"use client";

import { TrackMap } from "@/components/track-map";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { dropPoint, haversineKm, rideMinutes, storePoint } from "@/lib/geo";
import { formatSar } from "@/lib/money";
import { productImage } from "@/lib/photos";
import { textOf } from "@/lib/text";
import type { CustomerOrder, OrderStatus } from "@/lib/types";
import { isSaudiMobile } from "@/lib/validate";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Tracked = CustomerOrder & { status: OrderStatus };

const TIPS = [200, 500, 1000] as const;
const MOVING = new Set<OrderStatus>(["COURIER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]);

export function LiveDelivery({ order, onOrder }: { order: Tracked; onOrder: (order: Tracked) => void }) {
  const t = useTranslations("Order");
  const locale = useAppLocale();
  const store = storePoint(order.storeId);
  const drop = dropPoint(order.address);
  const courier =
    typeof order.courierLat === "number" && typeof order.courierLng === "number"
      ? { lat: order.courierLat, lng: order.courierLng }
      : null;
  const target = order.status === "COURIER_ASSIGNED" ? store : drop;
  const minutes = courier && MOVING.has(order.status) ? rideMinutes(courier, target) : null;
  const distance = haversineKm(store, drop);
  const [editing, setEditing] = useState(false);
  const [line, setLine] = useState(order.address.line);
  const [district, setDistrict] = useState(order.address.district);
  const [phone, setPhone] = useState(order.alternatePhone ?? "");
  const [instructions, setInstructions] = useState(order.address.instructions);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canEdit = Boolean(order.persistedStatus) && order.status !== "DELIVERED" && !order.frozenStatus;

  async function save(body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/orders/${order.id}/track`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!response.ok) {
      setError(t("trackClosed"));
      return;
    }
    const data = (await response.json()) as { order: Tracked };
    onOrder({
      ...data.order,
      notifiedStatus: data.order.status,
      persistedStatus: data.order.status,
    });
    setEditing(false);
  }

  function saveAddress() {
    if (line.trim().length < 4 || district.trim().length < 2) {
      setError(t("trackInvalid"));
      return;
    }
    if (phone.trim() && !isSaudiMobile(phone)) {
      setError(t("trackInvalid"));
      return;
    }
    void save({
      address: {
        ...order.address,
        line: line.trim(),
        district: district.trim(),
        instructions: instructions.trim(),
      },
      alternatePhone: phone.trim(),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <TrackMap
        store={store}
        drop={drop}
        courier={courier}
        storeLabel={t("mapStore")}
        dropLabel={t("mapHome")}
        courierLabel={order.courierName?.split(" ")[0] ?? t("mapCourier")}
      />
      {minutes ? (
        <p className="text-sm font-semibold text-accent-text">{t("arriving", { minutes: formatNumber(minutes, locale) })}</p>
      ) : null}
      {order.courierName ? (
        <div className="rounded-2xl border border-line px-4 py-3">
          <p className="font-semibold">{t("partner", { name: order.courierName.split(" ")[0] ?? order.courierName })}</p>
          <p className="mt-1 text-sm text-muted">{t(`partnerStatus.${order.status}`)}</p>
          {order.courierPhone ? <p className="mt-2 text-sm">{order.courierPhone}</p> : null}
          <p className="mt-2 text-sm text-muted">
            {t("storeDistance", { km: formatNumber(distance, locale, 1) })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("waitingPartner")}</p>
      )}
      {canEdit && order.courierName && order.status !== "DELIVERED" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{t("tipTitle")}</p>
          <div className="grid grid-cols-3 gap-2">
            {TIPS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={pending}
                className={order.tipHalalas === amount ? primaryButtonClass : secondaryButtonClass}
                onClick={() => void save({ tipHalalas: amount })}
              >
                {formatSar(amount, locale)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {order.tipHalalas ? <p className="text-sm text-muted">{t("tipSaved", { amount: formatSar(order.tipHalalas, locale) })}</p> : null}
      <div className="rounded-2xl border border-line px-4 py-3 text-sm">
        <p className="font-semibold">{t("deliveryDetails")}</p>
        <p className="mt-2">
          {order.address.recipient}
          <br />
          {order.address.line}, {order.address.district}
        </p>
        <p className="mt-1 text-muted">{order.address.phone}</p>
        {order.alternatePhone ? <p className="mt-1 text-muted">{t("alternateSaved", { phone: order.alternatePhone })}</p> : null}
        {canEdit ? (
          editing ? (
            <div className="mt-3 flex flex-col gap-2">
              <input className={fieldClass} value={line} onChange={(event) => setLine(event.target.value)} aria-label={t("addressLine")} />
              <input className={fieldClass} value={district} onChange={(event) => setDistrict(event.target.value)} aria-label={t("addressDistrict")} />
              <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} aria-label={t("alternatePhone")} placeholder={t("alternatePhone")} />
              <input className={fieldClass} value={instructions} onChange={(event) => setInstructions(event.target.value)} aria-label={t("instructions")} placeholder={t("instructions")} />
              <button type="button" className={primaryButtonClass} disabled={pending} onClick={saveAddress}>
                {t("saveAddress")}
              </button>
            </div>
          ) : (
            <button type="button" className="mt-2 font-semibold text-accent-text" onClick={() => setEditing(true)}>
              {t("changeAddress")}
            </button>
          )
        ) : null}
        {error ? <p className="mt-2 text-danger">{error}</p> : null}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {order.lines.map((lineItem) => (
          <img
            key={lineItem.productId}
            src={productImage(lineItem.productId)}
            alt={textOf(lineItem.name, locale)}
            className="size-16 shrink-0 rounded-xl border border-line object-cover"
          />
        ))}
      </div>
      <Link href={`/support?order=${order.id}`} className="rounded-2xl border border-line px-4 py-3 text-sm font-semibold">
        {t("needHelp")}
      </Link>
    </section>
  );
}
