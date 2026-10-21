"use client";

import { along, dropPoint, storePoint, type LatLng } from "@/lib/geo";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { DeliveryAddress, OrderStatus } from "@/lib/types";
import { primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type Job = {
  id: string;
  status: OrderStatus;
  storeId: string;
  storeName: { ar: string; en: string };
  totalHalalas: number;
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

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
        <p className="mt-2 text-sm text-accent-text">
          {sharing === "gps" ? t("sharingGps") : sharing === "route" ? t("sharingRoute") : t("sharingOff")}
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("open")}</h2>
        {open.length === 0 ? <p className="text-sm text-muted">{t("emptyOpen")}</p> : null}
        {open.map((job) => (
          <article key={job.id} className="rounded-2xl border border-line p-4">
            <JobSummary job={job} locale={locale} statusLabel={tOrder(`status.${job.status}`)} />
            <button type="button" className={`${primaryButtonClass} mt-3`} onClick={() => void act(job.id, "claim")}>
              {t("claim")}
            </button>
          </article>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("mine")}</h2>
        {mine.length === 0 ? <p className="text-sm text-muted">{t("emptyMine")}</p> : null}
        {mine.map((job) => {
          const next = NEXT[job.status];
          return (
            <article key={job.id} className="rounded-2xl border border-line p-4">
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
      <p className="font-semibold">{job.id}</p>
      <p className="text-sm">{textOf(job.storeName, locale)}</p>
      <p className="text-sm text-accent-text">{statusLabel}</p>
      <p className="text-sm text-muted">
        {job.lines.map((line) => `${textOf(line.name, locale)} × ${line.quantity}`).join(", ")}
      </p>
      <p className="mt-1 font-semibold tabular-nums">{formatSar(job.totalHalalas, locale)}</p>
      {job.tipHalalas ? <p className="text-sm text-accent-text">{t("tip", { amount: formatSar(job.tipHalalas, locale) })}</p> : null}
    </div>
  );
}
