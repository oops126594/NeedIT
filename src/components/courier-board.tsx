"use client";

import { along, dropPoint, storePoint, type LatLng } from "@/lib/geo";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { DeliveryAddress, OrderStatus } from "@/lib/types";
import { primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useOrderAlerts } from "@/components/use-order-alerts";

type Job = {
  id: string;
  status: OrderStatus;
  storeId: string;
  storeName: { ar: string; en: string };
  totalHalalas: number;
  deliveryFeeHalalas: number;
  createdAt: number;
  tipHalalas?: number;
  address: DeliveryAddress;
  courierLat?: number;
  courierLng?: number;
  lines: { name: { ar: string; en: string }; quantity: number }[];
};

const NEXT: Partial<Record<OrderStatus, { action: "pickup" | "enroute" | "deliver"; label: "pickup" | "enroute" | "deliver" }>> = {
  COURIER_ASSIGNED: { action: "pickup", label: "pickup" },
  PICKED_UP: { action: "enroute", label: "enroute" },
  OUT_FOR_DELIVERY: { action: "deliver", label: "deliver" },
};

export function CourierBoard() {
  const t = useTranslations("Courier");
  const tOrder = useTranslations("Order");
  const locale = useAppLocale();
  const alerts = useOrderAlerts([], locale);
  const [open, setOpen] = useState<Job[] | null>(null);
  const [mine, setMine] = useState<Job[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [sharing, setSharing] = useState<"gps" | "route" | "off">("off");
  const jobsRef = useRef<Job[]>([]);
  const routeStarted = useRef(false);

  async function load() {
    const response = await fetch("/api/courier/orders");
    if (response.status === 403) {
      setForbidden(true);
      setOpen([]);
      setMine([]);
      return;
    }
    const data = (await response.json()) as { open: Job[]; mine: Job[] };
    setOpen(data.open);
    setMine(data.mine);
    jobsRef.current = data.mine;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let watch = 0;
    let step = 0;
    const active = () => jobsRef.current.find((job) => job.status === "COURIER_ASSIGNED" || job.status === "PICKED_UP" || job.status === "OUT_FOR_DELIVERY");

    async function post(job: Job, point: LatLng) {
      await fetch(`/api/courier/orders/${job.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(point),
      });
    }

    function followRoute() {
      if (routeStarted.current) return;
      routeStarted.current = true;
      step = window.setInterval(() => {
        const job = active();
        if (!job) return;
        const from =
          typeof job.courierLat === "number" && typeof job.courierLng === "number"
            ? { lat: job.courierLat, lng: job.courierLng }
            : storePoint(job.storeId);
        const target = job.status === "COURIER_ASSIGNED" ? storePoint(job.storeId) : dropPoint(job.address);
        const next = along(from, target, 0.2);
        void post(job, next).then(() => load());
      }, 4000);
      setSharing("route");
    }

    if (!navigator.geolocation) {
      followRoute();
    } else {
      watch = navigator.geolocation.watchPosition(
        (position) => {
          const job = active();
          if (!job) return;
          setSharing("gps");
          void post(job, { lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => followRoute(),
        { enableHighAccuracy: true, maximumAge: 4000 },
      );
    }

    return () => {
      if (watch) navigator.geolocation.clearWatch(watch);
      window.clearInterval(step);
    };
  }, []);

  async function act(id: string, action: string) {
    const response = await fetch(`/api/courier/orders/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) await load();
  }

  if (forbidden) return <p className="px-4 py-8 text-sm">{t("forbidden")}</p>;
  if (!open || !mine) return <p className="px-4 py-8 text-sm text-muted">{t("title")}</p>;

  const active = mine.filter((job) => NEXT[job.status]);
  const delivered = mine.filter((job) => job.status === "DELIVERED");
  const earned = delivered.reduce((sum, job) => sum + job.deliveryFeeHalalas + (job.tipHalalas ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#176b62] p-6 text-white shadow-[0_24px_60px_rgba(23,107,98,.22)] sm:p-8">
        <div className="absolute -end-10 -top-12 size-44 rounded-full bg-[#b8eadf]/25" />
        <div className="absolute -bottom-20 start-1/3 size-40 rounded-full bg-[#ffd166]/20" />
        <div className="relative">
          <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{t("partnerApp")}</p>
          <h1 className="mt-3 text-3xl font-black">{t("title")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{t("intro")}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2 text-sm font-bold">
            <span className={`size-2 rounded-full ${sharing === "gps" ? "bg-[#8bf0b1]" : sharing === "route" ? "bg-[#ffd166]" : "bg-white/50"}`} />
            {sharing === "gps" ? t("sharingGps") : sharing === "route" ? t("sharingRoute") : t("sharingOff")}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <PartnerMetric label={t("availableCount")} value={String(open.length)} className="bg-[#dff5ef] text-[#165c53]" />
        <PartnerMetric label={t("activeCount")} value={String(active.length)} className="bg-[#fff0d1] text-[#76510b]" />
        <PartnerMetric label={t("earnings")} value={formatSar(earned, locale)} className="bg-[#eeeafe] text-[#5546a8]" />
      </section>

      {alerts.permission !== "granted" ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-[#28243d] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-black">{t("alertsTitle")}</h2><p className="mt-1 text-sm text-white/70">{t("alertsBody")}</p></div>
          <button type="button" onClick={() => void alerts.enable()} className="h-11 shrink-0 rounded-2xl bg-[#8bf0b1] px-5 text-sm font-black text-[#12463e]">{t("enableAlerts")}</button>
        </section>
      ) : (
        <p className="rounded-2xl bg-[#dff5ef] px-4 py-3 text-sm font-bold text-[#165c53]">✓ {t("alertsEnabled")}</p>
      )}

      {active.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div><p className="text-sm font-bold text-[#176b62]">{t("currentRoute")}</p><h2 className="text-xl font-black">{t("activeDelivery")}</h2></div>
          {active.map((job) => <ActiveJob key={job.id} job={job} locale={locale} statusLabel={tOrder(`status.${job.status}`)} onAct={act} />)}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div><p className="text-sm font-bold text-accent-text">{t("nearbyJobs")}</p><h2 className="text-xl font-black">{t("open")}</h2></div>
        {open.length === 0 ? <p className="text-sm text-muted">{t("emptyOpen")}</p> : null}
        {open.map((job) => (
          <article key={job.id} className="friendly-card rounded-3xl p-5 transition hover:-translate-y-0.5">
            <JobSummary job={job} locale={locale} statusLabel={tOrder(`status.${job.status}`)} />
            <button type="button" className={`${primaryButtonClass} mt-3`} onClick={() => void act(job.id, "claim")}>
              {t("claim")}
            </button>
          </article>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black">{t("history")}</h2>
        {mine.length === 0 ? <p className="text-sm text-muted">{t("emptyMine")}</p> : null}
        {mine.filter((job) => !NEXT[job.status]).map((job) => {
          const next = NEXT[job.status];
          return (
            <article key={job.id} className="friendly-card rounded-3xl p-5">
              <JobSummary job={job} locale={locale} statusLabel={tOrder(`status.${job.status}`)} />
              <p className="mt-2 text-sm">
                {job.address.recipient} · {job.address.phone}
                <br />
                {job.address.line}, {job.address.district}
              </p>
              {job.address.instructions ? <p className="mt-1 text-sm text-muted">{job.address.instructions}</p> : null}
              {next ? (
                <button type="button" className={`${primaryButtonClass} mt-3`} onClick={() => void act(job.id, next.action)}>
                  {t(next.label)}
                </button>
              ) : (
                <p className={`${secondaryButtonClass} mt-3`}>{tOrder(`status.${job.status}`)}</p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function PartnerMetric({ label, value, className }: { label: string; value: string; className: string }) {
  return <div className={`min-w-0 rounded-3xl p-4 ${className}`}><p className="truncate text-xs font-bold opacity-70">{label}</p><p className="mt-2 truncate text-xl font-black sm:text-2xl">{value}</p></div>;
}

function ActiveJob({ job, locale, statusLabel, onAct }: { job: Job; locale: "ar" | "en"; statusLabel: string; onAct: (id: string, action: string) => Promise<void> }) {
  const t = useTranslations("Courier");
  const next = NEXT[job.status];
  const destination = job.status === "COURIER_ASSIGNED" ? textOf(job.storeName, locale) : `${job.address.line}, ${job.address.district}`;
  const mapsUrl = job.status === "COURIER_ASSIGNED"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textOf(job.storeName, locale))}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${job.address.lat ?? ""},${job.address.lng ?? ""}`)}`;
  const progress = job.status === "COURIER_ASSIGNED" ? 25 : job.status === "PICKED_UP" ? 60 : 85;
  return <article className="overflow-hidden rounded-3xl bg-[#28243d] text-white shadow-xl"><div className="p-5"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-[#8bf0b1]">{statusLabel}</p><h3 className="mt-1 text-xl font-black">{job.id}</h3></div><span className="h-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{progress}%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8bf0b1]" style={{ width: `${progress}%` }} /></div><p className="mt-5 text-xs font-bold text-white/55">{t("nextStop")}</p><p className="mt-1 font-bold">{destination}</p><p className="mt-3 text-sm text-white/70">{job.address.recipient} · {job.address.phone}</p></div><div className="grid grid-cols-2 gap-2 bg-white/5 p-4"><a href={mapsUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-2xl bg-white/10 px-3 text-sm font-bold">{t("openRoute")}</a>{next ? <button type="button" className="min-h-12 rounded-2xl bg-[#8bf0b1] px-3 text-sm font-black text-[#12463e]" onClick={() => void onAct(job.id, next.action)}>{t(next.label)}</button> : null}</div></article>;
}

function JobSummary({
  job,
  locale,
  statusLabel,
}: {
  job: Job;
  locale: "ar" | "en";
  statusLabel: string;
}) {
  const t = useTranslations("Courier");
  return (
    <div>
      <div className="flex items-start justify-between gap-3"><p className="font-black">{job.id}</p><span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-text">{statusLabel}</span></div>
      <p className="text-sm">{textOf(job.storeName, locale)}</p>
      <p className="text-sm text-muted">
        {job.lines.map((line) => `${textOf(line.name, locale)} × ${line.quantity}`).join(", ")}
      </p>
      <p className="mt-1 font-semibold tabular-nums">{formatSar(job.totalHalalas, locale)}</p>
      {job.tipHalalas ? <p className="text-sm text-accent-text">{t("tip", { amount: formatSar(job.tipHalalas, locale) })}</p> : null}
    </div>
  );
}
