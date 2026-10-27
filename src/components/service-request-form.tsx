"use client";

import { MapPicker } from "@/components/map-picker";
import { fieldClass, primaryButtonClass } from "@/components/styles";
import { useShop } from "@/components/shop-provider";
import { getLocation, type MapPlace } from "@/lib/locations";
import { formatSar } from "@/lib/money";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const DELIVERY_TYPES = ["GROCERIES", "PARCEL", "GIFT", "DOCUMENTS", "PHARMACY", "STORE_PICKUP"] as const;
const FUEL_TYPES = ["PETROL_91", "PETROL_95", "DIESEL"] as const;

export function ServiceRequestForm({ kind }: { kind: "delivery" | "fuel" }) {
  const t = useTranslations("Services");
  const locale = useAppLocale();
  const { locationId, place } = useShop();
  const preset = getLocation(locationId);
  const initial = place ?? { lat: preset.lat, lng: preset.lng };
  const [pickup, setPickup] = useState<MapPlace | null>(null);
  const [destination, setDestination] = useState<MapPlace | null>(place);
  const [step, setStep] = useState<"form" | "pickup" | "destination">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string; total: number } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const chosen = kind === "delivery" ? pickup && destination : destination;
    if (!chosen) return setError(t("chooseLocation"));
    const scheduled = String(data.get("scheduledFor") || "");
    const common = { scheduledFor: scheduled ? new Date(scheduled).toISOString() : undefined, notes: String(data.get("notes") || "") || undefined };
    const body = kind === "delivery"
      ? {
          kind: "HOME_DELIVERY",
          subtype: data.get("subtype"),
          pickup,
          dropoff: destination,
          recipientName: data.get("recipientName"),
          recipientPhone: data.get("recipientPhone"),
          itemDescription: data.get("itemDescription"),
          ...common,
        }
      : {
          kind: "FUEL_REFILL",
          fuelType: data.get("fuelType"),
          liters: Number(data.get("liters")),
          vehicleMake: data.get("vehicleMake"),
          vehicleModel: data.get("vehicleModel"),
          vehicleColor: data.get("vehicleColor"),
          plateNumber: data.get("plateNumber"),
          location: destination,
          safetyAccepted: data.get("safetyAccepted") === "on",
          ...common,
        };
    setBusy(true);
    try {
      const response = await fetch("/api/services", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { request?: { id: string; estimatedTotalHalalas: number }; error?: string };
      if (response.status === 401) return setError(t("signInRequired"));
      if (!response.ok || !result.request) return setError(t("invalid"));
      setConfirmation({ id: result.request.id, total: result.request.estimatedTotalHalalas });
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <section className="friendly-card rounded-3xl p-6 text-center sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#dff5ef] text-3xl">✓</span>
        <h2 className="mt-4 text-2xl font-black">{t("received")}</h2>
        <p className="mt-2 text-muted">{t("reference", { id: confirmation.id })}</p>
        <p className="mt-4 text-lg font-bold">{t("estimatedTotal", { amount: formatSar(confirmation.total, locale) })}</p>
        <p className="mt-2 text-sm text-muted">{t("reviewNotice")}</p>
      </section>
    );
  }

  if (step !== "form") {
    return (
      <section className="friendly-card rounded-3xl p-5">
        <button type="button" className="mb-4 text-sm font-bold text-accent-text" onClick={() => setStep("form")}>← {t("back")}</button>
        <h2 className="mb-3 text-xl font-black">{step === "pickup" ? t("pickupLocation") : kind === "fuel" ? t("vehicleLocation") : t("dropoffLocation")}</h2>
        <MapPicker initial={initial} onChoose={(next) => {
          if (step === "pickup") setPickup(next);
          else setDestination(next);
          setStep("form");
        }} />
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="friendly-card flex flex-col gap-6 rounded-3xl p-5 sm:p-7">
      {kind === "delivery" ? (
        <>
          <ChoiceGrid name="subtype" values={DELIVERY_TYPES} label={(value) => t(`deliveryTypes.${value}`)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <LocationButton label={t("pickupLocation")} value={pickup?.label} onClick={() => setStep("pickup")} />
            <LocationButton label={t("dropoffLocation")} value={destination?.label} onClick={() => setStep("destination")} />
          </div>
          <Field name="recipientName" label={t("recipientName")} required />
          <Field name="recipientPhone" label={t("recipientPhone")} inputMode="tel" required />
          <label className="text-sm font-bold">{t("itemDescription")}<textarea name="itemDescription" required minLength={3} maxLength={500} className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-white p-4 font-normal" /></label>
        </>
      ) : (
        <>
          <ChoiceGrid name="fuelType" values={FUEL_TYPES} label={(value) => t(`fuelTypes.${value}`)} />
          <label className="text-sm font-bold">{t("liters")}<select name="liters" className={`${fieldClass} mt-2`} defaultValue="20">{[5, 10, 20, 30, 40, 50, 60].map((value) => <option key={value} value={value}>{t("literValue", { count: value })}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2"><Field name="vehicleMake" label={t("vehicleMake")} required /><Field name="vehicleModel" label={t("vehicleModel")} required /><Field name="vehicleColor" label={t("vehicleColor")} required /><Field name="plateNumber" label={t("plateNumber")} required /></div>
          <LocationButton label={t("vehicleLocation")} value={destination?.label} onClick={() => setStep("destination")} />
          <div className="rounded-2xl bg-[#fff0d1] p-4 text-sm leading-6 text-[#76510b]">
            <p className="font-black">{t("safetyTitle")}</p><p>{t("safetyBody")}</p>
            <label className="mt-3 flex items-start gap-3 font-semibold"><input name="safetyAccepted" type="checkbox" required className="mt-1 size-4 accent-[var(--accent)]" />{t("safetyAccept")}</label>
          </div>
        </>
      )}
      <Field name="scheduledFor" label={t("schedule")} type="datetime-local" />
      <label className="text-sm font-bold">{t("notes")}<textarea name="notes" maxLength={500} className="mt-2 min-h-20 w-full rounded-2xl border border-line bg-white p-4 font-normal" /></label>
      {error ? <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
      <button disabled={busy} className={primaryButtonClass}>{busy ? t("sending") : t("requestService")}</button>
      <p className="text-center text-xs leading-5 text-muted">{kind === "fuel" ? t("fuelEstimateNotice") : t("deliveryEstimateNotice")}</p>
    </form>
  );
}

function Field({ name, label, ...props }: { name: string; label: string; type?: string; required?: boolean; inputMode?: "tel" }) {
  return <label className="text-sm font-bold">{label}<input name={name} className={`${fieldClass} mt-2`} {...props} /></label>;
}

function LocationButton({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  const t = useTranslations("Services");
  return <button type="button" onClick={onClick} className="min-h-20 rounded-2xl border border-line bg-white p-4 text-start shadow-sm"><span className="block text-sm font-black">{label}</span><span className="mt-1 block text-sm text-muted">{value || t("chooseOnMap")}</span></button>;
}

function ChoiceGrid<T extends string>({ name, values, label }: { name: string; values: readonly T[]; label: (value: T) => string }) {
  const t = useTranslations("Services");
  return <fieldset><legend className="mb-3 text-sm font-black">{name === "fuelType" ? t("chooseFuel") : t("chooseDelivery")}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{values.map((value, index) => <label key={value} className="cursor-pointer"><input className="peer sr-only" type="radio" name={name} value={value} defaultChecked={index === 0} /><span className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-white px-3 text-center text-sm font-semibold peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text">{label(value)}</span></label>)}</div></fieldset>;
}
