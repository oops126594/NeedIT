"use client";

import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { OrderStatus } from "@/lib/types";
import { primaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  customerEmail?: string;
  storeName: { ar: string; en: string };
  totalHalalas: number;
};

type Summary = {
  ordersToday: number;
  openOrders: number;
  stores: number;
  products: number;
};

const CAN_ADVANCE = new Set<OrderStatus>([
  "READY_FOR_PICKUP",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
]);

export function AdminBoard() {
  const t = useTranslations("Admin");
  const tOrder = useTranslations("Order");
  const locale = useAppLocale();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/orders");
    if (response.status === 403) {
      setForbidden(true);
      return;
    }
    const data = (await response.json()) as { orders: AdminOrder[]; summary: Summary };
    setOrders(data.orders);
    setSummary(data.summary);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  async function advance(id: string) {
    const response = await fetch(`/api/admin/orders/${id}`, { method: "PATCH" });
    if (response.ok) await load();
  }

  if (forbidden) return <p className="px-4 py-8 text-sm">{t("forbidden")}</p>;
  if (!orders || !summary) return <p className="px-4 py-8 text-sm text-muted">{t("title")}</p>;

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-paper px-3 py-3">
          <dt className="text-muted">{t("ordersToday")}</dt>
          <dd className="text-xl font-semibold">{summary.ordersToday}</dd>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-3">
          <dt className="text-muted">{t("openOrders")}</dt>
          <dd className="text-xl font-semibold">{summary.openOrders}</dd>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-3">
          <dt className="text-muted">{t("stores")}</dt>
          <dd className="text-xl font-semibold">{summary.stores}</dd>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-3">
          <dt className="text-muted">{t("products")}</dt>
          <dd className="text-xl font-semibold">{summary.products}</dd>
        </div>
      </dl>
      {orders.length === 0 ? <p className="text-sm text-muted">{t("empty")}</p> : null}
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm">{textOf(order.storeName, locale)}</p>
                <p className="text-sm text-accent-text">{tOrder(`status.${order.status}`)}</p>
                {order.customerEmail ? <p className="text-sm text-muted">{order.customerEmail}</p> : null}
              </div>
              <p className="font-semibold tabular-nums">{formatSar(order.totalHalalas, locale)}</p>
            </div>
            {CAN_ADVANCE.has(order.status) ? (
              <button type="button" className={`${primaryButtonClass} mt-3`} onClick={() => void advance(order.id)}>
                {t("advance")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
