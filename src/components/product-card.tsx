"use client";

import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { Product, Store } from "@/lib/types";
import { AddToCart } from "@/components/add-to-cart";
import { CategoryMark, StarIcon } from "@/components/icons";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";

const stockKey = {
  IN_STOCK: "inStock",
  LOW_STOCK: "lowStock",
  OUT_OF_STOCK: "outOfStock",
} as const;

const stockClass = {
  IN_STOCK: "text-accent-text",
  LOW_STOCK: "text-warn",
  OUT_OF_STOCK: "text-danger",
} as const;

export function ProductCard({ product, store }: { product: Product; store: Store }) {
  const t = useTranslations("Common");
  const locale = useAppLocale();

  return (
    <article className="rounded-2xl border border-line bg-card p-3">
      <div className="flex gap-3">
        <CategoryMark id={product.categoryId} className="size-16 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug">
            <Link href={`/products/${product.id}`} className="rounded-sm">
              {textOf(product.name, locale)}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            <Link href={`/stores/${store.id}`} className="rounded-sm font-medium text-ink">
              {textOf(store.name, locale)}
            </Link>
            <span aria-hidden="true"> · </span>
            {t("distance", { distance: formatNumber(store.distanceKm, locale, 1) })}
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold tabular-nums">{formatSar(product.priceHalalas, locale)}</span>
            <span className="text-sm text-muted">
              {t("deliveryWindow", {
                min: formatNumber(store.deliveryMinMinutes, locale),
                max: formatNumber(store.deliveryMaxMinutes, locale),
              })}
            </span>
          </p>
          <p className={`mt-1 text-sm font-medium ${stockClass[product.stock]}`}>{t(stockKey[product.stock])}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <AddToCart productId={product.id} />
      </div>
    </article>
  );
}

export function StoreCard({ store }: { store: Store }) {
  const t = useTranslations("Common");
  const locale = useAppLocale();

  return (
    <Link
      href={`/stores/${store.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-bold text-accent-text">
        {textOf(store.name, locale).slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{textOf(store.name, locale)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <StarIcon className="size-4 text-saffron" />
            <span className="sr-only">{t("rating", { rating: formatNumber(store.rating, locale, 1) })}</span>
            <span aria-hidden="true">{formatNumber(store.rating, locale, 1)}</span>
          </span>
        </span>
        <span className="mt-1 block text-sm text-muted">
          {store.isOpen ? t("open") : t("closed")}
          <span aria-hidden="true"> · </span>
          {t("distance", { distance: formatNumber(store.distanceKm, locale, 1) })}
          <span aria-hidden="true"> · </span>
          {t("deliveryWindow", {
            min: formatNumber(store.deliveryMinMinutes, locale),
            max: formatNumber(store.deliveryMaxMinutes, locale),
          })}
        </span>
      </span>
    </Link>
  );
}
