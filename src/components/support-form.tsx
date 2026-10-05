"use client";

import { formatTime } from "@/lib/format";
import type { SupportIssue } from "@/lib/types";
import { useShop } from "@/components/shop-provider";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const ISSUES: SupportIssue[] = [
  "missing",
  "wrong",
  "damaged",
  "late",
  "cancelled",
  "payment",
  "merchant",
  "other",
];

const FAQ = ["delivery", "area", "payment", "cancel"] as const;

export function SupportForm({ orderId }: { orderId?: string }) {
  const t = useTranslations("Support");
  const locale = useAppLocale();
  const { ready, shop, addTicket } = useShop();
  const [type, setType] = useState<SupportIssue | "">("");
  const [order, setOrder] = useState(orderId ?? "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ type?: string; message?: string }>({});
  const [sentId, setSentId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { type?: string; message?: string } = {};
    if (!type) nextErrors.type = t("errors.type");
    if (message.trim().length < 8) nextErrors.message = t("errors.message");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !type) return;
    setPending(true);
    const ticket = addTicket({ orderId: order, type, message });
    setSentId(ticket.id);
    setPending(false);
    setMessage("");
    setType("");
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("intro")}</p>
      </div>
      {sentId ? (
        <div className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-text" role="status">
          <p>{t("sent", { id: sentId })}</p>
          <button type="button" className={`${secondaryButtonClass} mt-3`} onClick={() => setSentId(null)}>
            {t("another")}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("order")}</span>
            <span className="text-muted">{t("orderHint")}</span>
            <input className={fieldClass} value={order} onChange={(event) => setOrder(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("type")}</span>
            <select
              className={fieldClass}
              value={type}
              aria-invalid={Boolean(errors.type)}
              onChange={(event) => setType(event.target.value as SupportIssue | "")}
            >
              <option value="">{t("choose")}</option>
              {ISSUES.map((issue) => (
                <option key={issue} value={issue}>
                  {t(`types.${issue}`)}
                </option>
              ))}
            </select>
            {errors.type ? <span className="text-danger">{errors.type}</span> : null}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("message")}</span>
            <textarea
              className={`${fieldClass} h-28 py-3`}
              maxLength={500}
              value={message}
              aria-invalid={Boolean(errors.message)}
              onChange={(event) => setMessage(event.target.value)}
            />
            {errors.message ? <span className="text-danger">{errors.message}</span> : null}
          </label>
          <button type="submit" className={primaryButtonClass} disabled={pending}>
            {pending ? t("sending") : t("send")}
          </button>
        </form>
      )}
      {ready && shop.tickets.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold">{t("yours")}</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {shop.tickets.map((ticket) => (
              <li key={ticket.id} className="rounded-2xl border border-line px-3 py-2 text-sm">
                <span className="font-medium">{t(`types.${ticket.type}`)}</span>
                <span className="mt-1 block text-muted">
                  {ticket.id}
                  {ticket.orderId ? ` · ${ticket.orderId}` : ""} · {formatTime(ticket.createdAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("faqTitle")}</h2>
        {FAQ.map((item) => (
          <details key={item} className="rounded-2xl border border-line px-4 py-3">
            <summary className="cursor-pointer font-medium">{t(`faq.${item}.q`)}</summary>
            <p className="mt-2 text-sm text-muted">{t(`faq.${item}.a`)}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
