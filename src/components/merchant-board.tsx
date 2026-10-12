"use client";

import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { OrderStatus, Product, StockStatus } from "@/lib/types";
import { primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type MerchantOrder = {
  id: string;
  storeId: string;
  status: OrderStatus;
  storeName: { ar: string; en: string };
  lines: { productId: string; name: { ar: string; en: string }; quantity: number; priceHalalas: number }[];
  totalHalalas: number;
  address: { recipient: string; phone: string; district: string; line: string };
};

const ACTIONS: Partial<Record<OrderStatus, { action: "accept" | "reject" | "preparing" | "ready"; label: "accept" | "reject" | "preparing" | "ready" }[]>> = {
  PLACED: [
    { action: "accept", label: "accept" },
    { action: "reject", label: "reject" },
  ],
  ACCEPTED: [{ action: "preparing", label: "preparing" }],
  PREPARING: [{ action: "ready", label: "ready" }],
};

export function MerchantBoard() {
  const t = useTranslations("Merchant");
  const tOrder = useTranslations("Order");
  const tStock = useTranslations("Common");
  const locale = useAppLocale();
  const [orders, setOrders] = useState<MerchantOrder[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const [orderResponse, catalogResponse] = await Promise.all([
      fetch("/api/merchant/orders"),
      fetch("/api/catalog"),
    ]);
    if (orderResponse.status === 403) {
      setForbidden(true);
      setOrders([]);
      return;
    }
    const orderData = (await orderResponse.json()) as { orders: MerchantOrder[]; storeId: string };
    setOrders(orderData.orders);
    setStoreId(orderData.storeId);
    if (catalogResponse.ok) {
      const catalog = (await catalogResponse.json()) as { products: Product[] };
      setProducts(catalog.products.filter((product) => product.storeId === orderData.storeId));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  async function move(id: string, action: string) {
    const response = await fetch(`/api/merchant/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) await load();
  }

  async function setStock(id: string, stock: StockStatus) {
    const response = await fetch(`/api/merchant/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    if (response.ok) {
      setNotice(t("saved"));
      await load();
    }
  }

  if (forbidden) return <p className="px-4 py-8 text-sm">{t("forbidden")}</p>;
  if (!orders) return <p className="px-4 py-8 text-sm text-muted">{t("title")}</p>;

  const visibleProducts = products?.filter((product) => product.storeId === storeId) ?? [];

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </div>
      {orders.length === 0 ? <p className="text-sm text-muted">{t("empty")}</p> : null}
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm text-accent-text">{tOrder(`status.${order.status}`)}</p>
              </div>
              <p className="font-semibold tabular-nums">{formatSar(order.totalHalalas, locale)}</p>
            </div>
            <ul className="mt-2 text-sm">
              {order.lines.map((line) => (
                <li key={line.productId}>
                  {textOf(line.name, locale)} × {line.quantity}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">
              {order.address.recipient} · {order.address.phone}
              <br />
              {order.address.line}, {order.address.district}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {(ACTIONS[order.status] ?? []).map((item) => (
                <button
                  key={item.action}
                  type="button"
                  className={item.action === "reject" ? secondaryButtonClass : primaryButtonClass}
                  onClick={() => void move(order.id, item.action)}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("products")}</h2>
        {notice ? <p className="text-sm text-accent-text">{notice}</p> : null}
        <ul className="flex flex-col gap-2">
          {visibleProducts.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2">
              <span className="text-sm font-medium">{textOf(product.name, locale)}</span>
              <select
                className="h-10 rounded-xl border border-line bg-paper px-2 text-sm"
                value={product.stock}
                aria-label={textOf(product.name, locale)}
                onChange={(event) => void setStock(product.id, event.target.value as StockStatus)}
              >
                <option value="IN_STOCK">{tStock("inStock")}</option>
                <option value="LOW_STOCK">{tStock("lowStock")}</option>
                <option value="OUT_OF_STOCK">{tStock("outOfStock")}</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
