"use client";

import { useRouter } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import { cardFieldError, cardLast4, isSaudiMobile } from "@/lib/validate";
import type { PaymentMethod } from "@/lib/types";
import { BackButton } from "@/components/back-button";
import { useShop } from "@/components/shop-provider";
import { fieldClass, primaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { ViewBeacon } from "@/components/view-beacon";
import { getLocation } from "@/lib/locations";
import { useTranslations } from "next-intl";
import { cloneElement, useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from "react";

type FieldErrors = Partial<Record<"recipient" | "phone" | "district" | "line" | "number" | "expiry" | "cvc" | "form", string>>;

export function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const locale = useAppLocale();
  const router = useRouter();
  const { ready, summary, shop, locationId, placeOrder } = useShop();
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [line, setLine] = useState("");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const leaving = useRef(false);

  useEffect(() => {
    if (!ready || hydrated) return;
    const saved = shop.savedAddress;
    const area = getLocation(locationId).district;
    setRecipient(saved?.recipient ?? "");
    setPhone(saved?.phone ?? "");
    setDistrict(saved?.district || textOf(area, locale));
    setLine(saved?.line ?? "");
    setInstructions(saved?.instructions ?? "");
    setHydrated(true);
  }, [ready, hydrated, shop.savedAddress, locationId, locale]);

  useEffect(() => {
    if (!ready || leaving.current || summary.detailed.length > 0) return;
    router.replace("/cart");
  }, [ready, summary.detailed.length, router]);

  if (!ready) {
    return <p className="px-4 py-8 text-sm text-muted">{tCart("loading")}</p>;
  }

  if (!summary.store) {
    return (
      <p className="px-4 py-8 text-sm text-muted">{leaving.current ? t("placing") : tCart("empty")}</p>
    );
  }

  const range = `${formatNumber(summary.store.deliveryMinMinutes, locale)}–${formatNumber(summary.store.deliveryMaxMinutes, locale)}`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: FieldErrors = {};
    if (recipient.trim().length < 2) nextErrors.recipient = t("errors.recipient");
    if (!isSaudiMobile(phone)) nextErrors.phone = t("errors.phone");
    if (district.trim().length < 2) nextErrors.district = t("errors.district");
    if (line.trim().length < 4) nextErrors.line = t("errors.line");
    let last4: string | undefined;
    if (payment === "CARD") {
      const cardError = cardFieldError(cardNumber, expiry, cvc);
      if (cardError) nextErrors[cardError] = t(`errors.${cardError}`);
      else last4 = cardLast4(cardNumber);
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError(null);
      return;
    }

    setPending(true);
    leaving.current = true;
    const result = placeOrder({
      address: {
        recipient: recipient.trim(),
        phone: phone.trim(),
        district: district.trim(),
        line: line.trim(),
        instructions: instructions.trim(),
      },
      paymentMethod: payment,
      cardLast4: last4,
    });
    if (!result.ok) {
      leaving.current = false;
      setPending(false);
      setFormError(t(`errors.${result.reason}`));
      return;
    }
    setCardNumber("");
    setCvc("");
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4 py-5" noValidate>
      <ViewBeacon event="checkout_started" />
      <BackButton />
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted">
        {textOf(summary.store.name, locale)} · {t("eta", { range })}
      </p>
      {formError ? (
        <p role="alert" className="rounded-2xl bg-paper px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">{t("address")}</legend>
        <Field label={t("recipient")} error={errors.recipient}>
          <input className={fieldClass} autoComplete="name" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
        </Field>
        <Field label={t("phone")} error={errors.phone}>
          <input className={fieldClass} autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field label={t("district")} error={errors.district}>
          <input className={fieldClass} autoComplete="address-level2" value={district} onChange={(event) => setDistrict(event.target.value)} />
        </Field>
        <Field label={t("line")} error={errors.line}>
          <input className={fieldClass} autoComplete="address-line1" value={line} onChange={(event) => setLine(event.target.value)} />
        </Field>
        <Field label={t("instructions")} hint={t("instructionsHint")}>
          <textarea
            className={`${fieldClass} h-24 py-3`}
            maxLength={200}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </Field>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold">{t("payment")}</legend>
        <PaymentOption
          name="payment"
          checked={payment === "COD"}
          onChange={() => setPayment("COD")}
          title={t("cod")}
          help={t("codHelp")}
        />
        <PaymentOption
          name="payment"
          checked={payment === "CARD"}
          onChange={() => setPayment("CARD")}
          title={t("card")}
          help={t("cardHelp")}
        />
        {payment === "CARD" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line p-3">
            <p className="text-sm text-muted">{t("demoNote")}</p>
            <Field label={t("cardNumber")} error={errors.number}>
              <input
                className={fieldClass}
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("expiry")} error={errors.expiry}>
                <input
                  className={fieldClass}
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                />
              </Field>
              <Field label={t("cvc")} error={errors.cvc}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value)}
                />
              </Field>
            </div>
          </div>
        ) : null}
      </fieldset>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt>{tCart("subtotal")}</dt>
          <dd className="tabular-nums">{formatSar(summary.subtotal, locale)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{tCart("delivery")}</dt>
          <dd className="tabular-nums">{formatSar(summary.delivery, locale)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>{tCart("total")}</dt>
          <dd className="tabular-nums">{formatSar(summary.total, locale)}</dd>
        </div>
      </dl>
      <div className="h-28" />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[480px] border-t border-line bg-card/95 px-4 py-3 backdrop-blur">
        <button type="submit" className={primaryButtonClass} disabled={pending || !summary.store.isOpen}>
          {pending ? t("placing") : `${t("place")} · ${formatSar(summary.total, locale)}`}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-muted">
          {hint}
        </p>
      ) : null}
      {cloneElement(children, {
        id,
        "aria-invalid": Boolean(error) || undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PaymentOption({
  name,
  checked,
  onChange,
  title,
  help,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  help: string;
}) {
  return (
    <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${checked ? "border-accent bg-accent-soft" : "border-line"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{help}</span>
      </span>
    </label>
  );
}
