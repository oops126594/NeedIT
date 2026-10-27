"use client";

import { useAppLocale } from "@/components/use-app-locale";
import { formatTime } from "@/lib/format";
import { formatSar } from "@/lib/money";
import type { ServiceRequest, ServiceRequestStatus } from "@/lib/service-types";
import { textOf } from "@/lib/text";
import type { OrderStatus } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type AdminOrder = { id: string; status: OrderStatus; customerName: string; customerEmail?: string; storeName: { ar: string; en: string }; totalHalalas: number; createdAt: number };
type Customer = { id: string; name: string; email: string; phone: string; createdAt: number };
type Dashboard = {
  orders: AdminOrder[]; services: ServiceRequest[]; customers: Customer[];
  summary: { orders: number; openOrders: number; services: number; openServices: number; customers: number; stores: number; products: number };
  billing: { orderValueHalalas: number; serviceValueHalalas: number; deliveryFeesHalalas: number; serviceFeesHalalas: number };
  costs: { infrastructure: number; maps: number; messaging: number; operations: number; estimatedMonthlyCostHalalas: number };
};
type Tab = "overview" | "orders" | "services" | "users" | "billing";

const CAN_ADVANCE = new Set<OrderStatus>(["READY_FOR_PICKUP", "COURIER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]);
const SERVICE_FLOW: ServiceRequestStatus[] = ["REQUESTED", "REVIEWING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

export function AdminBoard() {
  const t = useTranslations("Admin");
  const tOrder = useTranslations("Order");
  const locale = useAppLocale();
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/dashboard");
    if (response.status === 403) return setForbidden(true);
    if (response.ok) setData((await response.json()) as Dashboard);
  }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); const interval = window.setInterval(() => void load(), 10000); return () => { clearTimeout(timer); clearInterval(interval); }; }, []);
  async function advanceOrder(id: string) { if ((await fetch(`/api/admin/orders/${id}`, { method: "PATCH" })).ok) await load(); }
  async function setServiceStatus(id: string, status: ServiceRequestStatus) { if ((await fetch(`/api/admin/services/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) })).ok) await load(); }

  if (forbidden) return <p className="px-4 py-8 text-sm">{t("forbidden")}</p>;
  if (!data) return <p className="px-4 py-8 text-sm text-muted">{t("loading")}</p>;
  const tabs: Tab[] = ["overview", "orders", "services", "users", "billing"];

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl bg-[#28243d] p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-bold text-[#b8eadf]">{t("eyebrow")}</p><h1 className="mt-1 text-3xl font-black">{t("title")}</h1><p className="mt-2 max-w-2xl text-sm text-white/70">{t("intro")}</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="rounded-3xl bg-[#ff6657] p-5 text-white shadow-[0_18px_45px_rgba(198,64,52,.2)]">
          <p className="text-sm font-bold text-white/75">{t("monthlyCost")}</p><p className="mt-2 text-3xl font-black tabular-nums">{formatSar(data.costs.estimatedMonthlyCostHalalas, locale)}</p><p className="mt-2 text-xs text-white/75">{t("costDisclaimer")}</p>
        </div>
        <Metric label={t("openOrders")} value={data.summary.openOrders} tone="bg-[#dff5ef] text-[#165c53]" />
        <Metric label={t("openServices")} value={data.summary.openServices} tone="bg-[#fff0d1] text-[#76510b]" />
      </section>
      <nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${tab === item ? "bg-ink text-white" : "border border-line bg-white text-muted"}`}>{t(`tabs.${item}`)}</button>)}</nav>

      {tab === "overview" ? <Overview data={data} t={t} locale={locale} /> : null}
      {tab === "orders" ? <Orders orders={data.orders} t={t} tOrder={tOrder} locale={locale} advance={advanceOrder} /> : null}
      {tab === "services" ? <Services services={data.services} t={t} locale={locale} update={setServiceStatus} /> : null}
      {tab === "users" ? <Users customers={data.customers} t={t} locale={locale} /> : null}
      {tab === "billing" ? <Billing data={data} t={t} locale={locale} /> : null}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`rounded-3xl p-5 ${tone}`}><p className="text-sm font-bold opacity-75">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>; }

function Overview({ data, t, locale }: { data: Dashboard; t: ReturnType<typeof useTranslations<"Admin">>; locale: "ar" | "en" }) {
  const metrics = [["orders", data.summary.orders], ["services", data.summary.services], ["customers", data.summary.customers], ["stores", data.summary.stores], ["products", data.summary.products]] as const;
  return <section><h2 className="mb-3 text-xl font-black">{t("snapshot")}</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{metrics.map(([key, value]) => <Metric key={key} label={t(key)} value={value} tone="friendly-card" />)}</div><div className="mt-5 friendly-card rounded-3xl p-5"><h3 className="font-black">{t("projectedValue")}</h3><p className="mt-2 text-2xl font-black">{formatSar(data.billing.orderValueHalalas + data.billing.serviceValueHalalas, locale)}</p><p className="mt-1 text-sm text-muted">{t("notCollected")}</p></div></section>;
}

function Orders({ orders, t, tOrder, locale, advance }: { orders: AdminOrder[]; t: ReturnType<typeof useTranslations<"Admin">>; tOrder: ReturnType<typeof useTranslations<"Order">>; locale: "ar" | "en"; advance: (id: string) => Promise<void> }) {
  return <section><h2 className="mb-3 text-xl font-black">{t("allOrders")}</h2><div className="overflow-x-auto rounded-3xl border border-line bg-white"><table className="w-full min-w-[720px] text-start text-sm"><thead className="bg-[#fff7ef] text-muted"><tr><Th>{t("reference")}</Th><Th>{t("customer")}</Th><Th>{t("store")}</Th><Th>{t("status")}</Th><Th>{t("amount")}</Th><Th>{t("action")}</Th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-line"><Td><strong>{order.id}</strong><small className="block text-muted">{formatTime(order.createdAt, locale)}</small></Td><Td>{order.customerName}<small className="block text-muted">{order.customerEmail}</small></Td><Td>{textOf(order.storeName, locale)}</Td><Td>{tOrder(`status.${order.status}`)}</Td><Td>{formatSar(order.totalHalalas, locale)}</Td><Td>{CAN_ADVANCE.has(order.status) ? <button className="rounded-xl bg-accent px-3 py-2 font-bold text-white" onClick={() => void advance(order.id)}>{t("advance")}</button> : "—"}</Td></tr>)}</tbody></table></div></section>;
}

function Services({ services, t, locale, update }: { services: ServiceRequest[]; t: ReturnType<typeof useTranslations<"Admin">>; locale: "ar" | "en"; update: (id: string, status: ServiceRequestStatus) => Promise<void> }) {
  return <section><h2 className="mb-3 text-xl font-black">{t("serviceOperations")}</h2><ul className="grid gap-4 lg:grid-cols-2">{services.map((service) => { const place = service.kind === "HOME_DELIVERY" ? service.dropoff : service.location; return <li key={service.id} className="friendly-card rounded-3xl p-5"><div className="flex justify-between gap-3"><div><p className="font-black">{service.kind === "HOME_DELIVERY" ? t("delivery") : t("fuel")}</p><p className="text-xs text-muted">{service.id} · {formatTime(service.createdAt, locale)}</p></div><strong>{formatSar(service.estimatedTotalHalalas, locale)}</strong></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">{t("customer")}</dt><dd className="font-semibold">{service.customerName}<br />{service.customerPhone}</dd></div><div><dt className="text-muted">{t("location")}</dt><dd className="font-semibold">{place.label}</dd></div></dl><label className="mt-4 block text-sm font-bold">{t("status")}<select value={service.status} onChange={(event) => void update(service.id, event.target.value as ServiceRequestStatus)} className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3">{[...SERVICE_FLOW, "CANCELLED" as const].map((status) => <option key={status} value={status}>{t(`serviceStatus.${status}`)}</option>)}</select></label></li>; })}</ul>{services.length === 0 ? <p className="text-muted">{t("noServices")}</p> : null}</section>;
}

function Users({ customers, t, locale }: { customers: Customer[]; t: ReturnType<typeof useTranslations<"Admin">>; locale: "ar" | "en" }) { return <section><h2 className="mb-3 text-xl font-black">{t("customerData")}</h2><div className="overflow-x-auto rounded-3xl border border-line bg-white"><table className="w-full min-w-[650px] text-sm"><thead className="bg-[#fff7ef]"><tr><Th>{t("customer")}</Th><Th>{t("email")}</Th><Th>{t("phone")}</Th><Th>{t("joined")}</Th></tr></thead><tbody>{customers.map((user) => <tr key={user.id} className="border-t border-line"><Td><strong>{user.name}</strong></Td><Td>{user.email}</Td><Td>{user.phone}</Td><Td>{formatTime(user.createdAt, locale)}</Td></tr>)}</tbody></table></div></section>; }

function Billing({ data, t, locale }: { data: Dashboard; t: ReturnType<typeof useTranslations<"Admin">>; locale: "ar" | "en" }) { const rows = [["infrastructure", data.costs.infrastructure], ["mapsCost", data.costs.maps], ["messaging", data.costs.messaging], ["operationsCost", data.costs.operations]] as const; const billingRows = [["orderValue", data.billing.orderValueHalalas], ["serviceValue", data.billing.serviceValueHalalas], ["deliveryFees", data.billing.deliveryFeesHalalas], ["serviceFees", data.billing.serviceFeesHalalas]] as const; return <section className="grid gap-5 lg:grid-cols-2"><div className="friendly-card rounded-3xl p-5"><h2 className="text-xl font-black">{t("monthlyCosts")}</h2><dl className="mt-4 divide-y divide-line">{rows.map(([key, value]) => <div key={key} className="flex justify-between py-3"><dt>{t(key)}</dt><dd className="font-bold">{formatSar(value, locale)}</dd></div>)}<div className="flex justify-between py-4 text-lg"><dt className="font-black">{t("total")}</dt><dd className="font-black">{formatSar(data.costs.estimatedMonthlyCostHalalas, locale)}</dd></div></dl><p className="text-xs text-muted">{t("costDisclaimer")}</p></div><div className="friendly-card rounded-3xl p-5"><h2 className="text-xl font-black">{t("billingSummary")}</h2><dl className="mt-4 divide-y divide-line">{billingRows.map(([key, value]) => <div key={key} className="flex justify-between py-3"><dt>{t(key)}</dt><dd className="font-bold">{formatSar(value, locale)}</dd></div>)}</dl><p className="mt-3 text-xs text-muted">{t("notCollected")}</p></div></section>; }

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-start font-bold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-3 align-top">{children}</td>; }
