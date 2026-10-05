"use client";

import { Link } from "@/i18n/navigation";
import { formatNumber, formatTime } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { ORDER_FLOW, arrivalMinutes, canCancel, canRate } from "@/lib/orders";
import { textOf } from "@/lib/text";
import { BackButton } from "@/components/back-button";
import { useShop } from "@/components/shop-provider";
import { primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function OrderTracker({ id }: { id: string }) {
  const t = useTranslations("Order");
  const tCart = useTranslations("Cart");
  const locale = useAppLocale();
  const { ready, orders, cancelOrder, rateOrder } = useShop();
  const [confirming, setConfirming] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  const order = orders.find((item) => item.id === id);

  if (!ready) return <p className="px-4 py-8 text-sm text-muted">{t("history")}</p>;
  if (!order) {
    return (
      <div className="flex flex-col gap-3 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted">{t("notFound")}</p>
        <Link href="/orders" className={primaryButtonClass}>
          {t("history")}
        </Link>
      </div>
    );
  }

  const minutes = arrivalMinutes(order, Date.now());
  const range = `${formatNumber(order.etaMinMinutes, locale)}–${formatNumber(order.etaMaxMinutes, locale)}`;
  const currentIndex = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
  const showCountdown = order.status === "PICKED_UP" || order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <BackButton />
      <div>
        <p className="text-sm text-muted">{formatTime(order.createdAt, locale)}</p>
        <h1 className="text-2xl font-semibold">{order.id}</h1>
        <p className="mt-1 text-sm">{textOf(order.storeName, locale)}</p>
      </div>
      <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-text" aria-live="polite">
        {order.frozenStatus
          ? t(`status.${order.status}`)
          : showCountdown && minutes
            ? t("arriving", { minutes: formatNumber(minutes, locale) })
            : order.status === "DELIVERED"
              ? t("delivered")
              : t("eta", { range })}
      </p>
      <p className="text-sm text-muted">{t("simulated")}</p>
      {order.frozenStatus ? (
        <p className="text-sm font-medium text-danger">{t(`status.${order.status}`)}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {ORDER_FLOW.map((step, index) => {
            const reached = currentIndex >= index;
            const current = order.status === step;
            return (
              <li key={step} className="flex gap-3" aria-current={current ? "step" : undefined}>
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    reached ? "bg-accent text-accent-ink" : "bg-paper text-muted"
                  }`}
                >
                  {reached ? "✓" : index + 1}
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${reached ? "text-ink" : "text-muted"}`}>
                    {t(`status.${step}`)}
                  </span>
                  {current ? <span className="block text-sm text-muted">{t(`detail.${step}`)}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{t("items")}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {order.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3">
              <span>
                {textOf(line.name, locale)} × {line.quantity}
              </span>
              <span className="tabular-nums">{formatSar(line.priceHalalas * line.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt>{tCart("delivery")}</dt>
            <dd className="tabular-nums">{formatSar(order.deliveryFeeHalalas, locale)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>{tCart("total")}</dt>
            <dd className="tabular-nums">{formatSar(order.totalHalalas, locale)}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted">
          {order.paymentMethod === "CARD"
            ? t("paymentCard", { last4: order.cardLast4 ?? "••••" })
            : t("paymentCod")}
        </p>
        <p className="text-sm">
          {order.address.recipient} · {order.address.phone}
          <br />
          {order.address.line}, {order.address.district}
        </p>
      </section>
      {canCancel(order.status) ? (
        <div className="flex flex-col gap-2">
          {confirming ? (
            <>
              <p className="text-sm font-medium">{t("confirmCancel")}</p>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  const result = cancelOrder(order.id);
                  if (!result.ok) setCancelError(true);
                  setConfirming(false);
                }}
              >
                {t("confirmYes")}
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => setConfirming(false)}>
                {t("confirmNo")}
              </button>
            </>
          ) : (
            <button type="button" className={secondaryButtonClass} onClick={() => setConfirming(true)}>
              {t("cancel")}
            </button>
          )}
          {cancelError ? <p className="text-sm text-danger">{t("tooLate")}</p> : null}
        </div>
      ) : null}
      {canRate(order.status) ? (
        <div>
          <h2 className="text-sm font-semibold">{t("rate")}</h2>
          {order.rating ? (
            <p className="mt-2 text-sm text-accent-text">
              {t("thanks")} {"★".repeat(order.rating)}
            </p>
          ) : (
            <div className="mt-2 flex gap-2" role="group" aria-label={t("rate")}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-line text-lg"
                  aria-label={t("star", { count: star })}
                  onClick={() => rateOrder(order.id, star)}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
      <Link href={`/support?order=${order.id}`} className="text-sm font-semibold text-accent-text">
        {t("support")}
      </Link>
    </div>
  );
}
