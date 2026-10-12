import { AddToCart } from "@/components/add-to-cart";
import { BackButton } from "@/components/back-button";
import { StarIcon } from "@/components/icons";
import { photoCredit, productImage } from "@/lib/photos";
import { ViewBeacon } from "@/components/view-beacon";
import { Link } from "@/i18n/navigation";
import { isAppLocale } from "@/i18n/routing";
import { readCatalog } from "@/lib/records";
import { formatNumber, freshness } from "@/lib/format";
import { formatSar } from "@/lib/money";
import { textOf } from "@/lib/text";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const catalog = await readCatalog();
  const product = catalog.products.find((item) => item.id === id);
  if (!isAppLocale(locale) || !product) return { title: "NEEDIT" };
  return { title: product.name[locale] };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  const catalog = await readCatalog();
  const product = catalog.products.find((item) => item.id === id);
  const store = product ? catalog.stores.find((item) => item.id === product.storeId) : undefined;
  if (!product || !store) notFound();

  const t = await getTranslations("Common");
  const fresh = freshness(product.inventoryUpdatedAt);
  const stockKey = product.stock === "IN_STOCK" ? "inStock" : product.stock === "LOW_STOCK" ? "lowStock" : "outOfStock";

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <ViewBeacon event="product_viewed" id={product.id} />
      <BackButton />
      <div className="overflow-hidden rounded-2xl bg-white">
        <img
          src={productImage(product.id)}
          alt={textOf(product.name, locale)}
          className="aspect-square w-full object-contain p-6"
        />
      </div>
      {photoCredit(product.id, locale) ? (
        <p className="-mt-3 text-xs text-muted">{photoCredit(product.id, locale)}</p>
      ) : null}
      <div>
        <p className="text-sm text-muted">{textOf(product.brand, locale)}</p>
        <h1 className="text-2xl font-semibold">{textOf(product.name, locale)}</h1>
        <p className="mt-2 text-xl font-semibold tabular-nums">{formatSar(product.priceHalalas, locale)}</p>
        <p className={`mt-1 text-sm font-medium ${product.stock === "OUT_OF_STOCK" ? "text-danger" : product.stock === "LOW_STOCK" ? "text-warn" : "text-accent-text"}`}>
          {t(stockKey)}
        </p>
        <p className="mt-1 text-sm text-muted">{t(`freshness.${fresh}`)}</p>
      </div>
      <p className="text-sm leading-6">{textOf(product.description, locale)}</p>
      <Link href={`/stores/${store.id}`} className="rounded-2xl border border-line p-4">
        <span className="flex items-center justify-between gap-3">
          <span className="font-semibold">{textOf(store.name, locale)}</span>
          <span className="inline-flex items-center gap-1 text-sm">
            <StarIcon className="size-4 text-saffron" />
            {formatNumber(store.rating, locale, 1)}
          </span>
        </span>
        <span className="mt-1 block text-sm text-muted">
          {textOf(store.area, locale)}
          <span aria-hidden="true"> · </span>
          {t("distance", { distance: formatNumber(store.distanceKm, locale, 1) })}
          <span aria-hidden="true"> · </span>
          {store.isOpen ? t("open") : t("closed")}
        </span>
        <span className="mt-1 block text-sm text-muted">
          {t("deliveryWindow", {
            min: formatNumber(store.deliveryMinMinutes, locale),
            max: formatNumber(store.deliveryMaxMinutes, locale),
          })}
        </span>
      </Link>
      <AddToCart productId={product.id} withQuantity />
    </div>
  );
}
