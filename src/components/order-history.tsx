"use client";

import { Link } from "@/i18n/navigation";
import { formatTime } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import { useShop } from "@/components/shop-provider";
import { primaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import type { OrderStatus } from "@/lib/types";
import type { ServiceRequest } from "@/lib/service-types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ListedOrder = {
  id: string;
  status: OrderStatus;
  storeName: { ar: string; en: string };
  totalHalalas: number;
  createdAt: number;
};

export function OrderHistory() {
  const t = useTranslations("Order");
  const locale = useAppLocale();
  const { ready, orders } = useShop();
  const [saved, setSaved] = useState<ListedOrder[] | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/orders")
      .then(async (response) => {
        if (!alive || !response.ok) return;
        const data = (await response.json()) as { orders: ListedOrder[] };
        setSaved(data.orders);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/services")
      .then(async (response) => {
        if (!alive || !response.ok) return;
        const data = (await response.json()) as { requests: ServiceRequest[] };
        setServiceRequests(data.requests);
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (!ready) return <p className="px-4 py-8 text-sm text-muted">{t("history")}</p>;

  const savedIds = new Set(saved?.map((order) => order.id) ?? []);
  const localOnly = orders.filter((order) => !savedIds.has(order.id) && !order.persistedStatus);
  const rows = [
    ...(saved ?? []),
    ...localOnly.map((order) => ({
      id: order.id,
      status: order.status,
      storeName: order.storeName,
      totalHalalas: order.totalHalalas,
      createdAt: order.createdAt,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-2xl font-semibold">{t("historyTitle")}</h1>
      {serviceRequests.length > 0 ? (
        <section className="mb-2">
          <h2 className="mb-3 text-lg font-bold">{t("serviceRequests")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {serviceRequests.map((request) => (
              <li key={request.id} className="friendly-card rounded-2xl p-4">
                <span className="flex items-start justify-between gap-3">
                  <span><span className="block font-bold">{request.kind === "HOME_DELIVERY" ? t("serviceDelivery") : t("serviceFuel")}</span><span className="mt-1 block text-xs text-muted">{request.id}</span></span>
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-text">{t(`serviceStatus.${request.status}`)}</span>
                </span>
                <span className="mt-3 flex justify-between text-sm"><span className="text-muted">{formatTime(request.createdAt, locale)}</span><strong>{formatSar(request.estimatedTotalHalalas, locale)}</strong></span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {rows.length === 0 ? (
        <>
          <p className="text-muted">{t("empty")}</p>
          <Link href="/" className={primaryButtonClass}>
            {t("emptyAction")}
          </Link>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="block rounded-2xl border border-line p-4">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{order.id}</span>
                    <span className="mt-1 block text-sm text-muted">{textOf(order.storeName, locale)}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatSar(order.totalHalalas, locale)}</span>
                </span>
                <span className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-accent-text">{t(`status.${order.status}`)}</span>
                  <span className="text-muted">{formatTime(order.createdAt, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
