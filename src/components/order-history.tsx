"use client";

import { Link } from "@/i18n/navigation";
import { formatTime } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import { useShop } from "@/components/shop-provider";
import { primaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";

export function OrderHistory() {
  const t = useTranslations("Order");
  const locale = useAppLocale();
  const { ready, orders } = useShop();

  if (!ready) return <p className="px-4 py-8 text-sm text-muted">{t("history")}</p>;

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-2xl font-semibold">{t("historyTitle")}</h1>
      {orders.length === 0 ? (
        <>
          <p className="text-muted">{t("empty")}</p>
          <Link href="/" className={primaryButtonClass}>
            {t("emptyAction")}
          </Link>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
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
