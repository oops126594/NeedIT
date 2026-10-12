import { BackButton } from "@/components/back-button";
import { StarIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ViewBeacon } from "@/components/view-beacon";
import { isAppLocale } from "@/i18n/routing";
import { readCatalog } from "@/lib/records";
import { stockRank } from "@/lib/catalog";
import { formatNumber } from "@/lib/format";
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
  const store = (await readCatalog()).stores.find((item) => item.id === id);
  if (!isAppLocale(locale) || !store) return { title: "NEEDIT" };
  return { title: store.name[locale] };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  const catalog = await readCatalog();
  const store = catalog.stores.find((item) => item.id === id);
  if (!store) notFound();
  const t = await getTranslations("Common");
  const tStore = await getTranslations("Store");
  const categories = await getTranslations("Categories");
  const products = catalog.products
    .filter((product) => product.storeId === store.id)
    .sort(
      (a, b) => stockRank(a.stock) - stockRank(b.stock) || a.name[locale].localeCompare(b.name[locale], locale),
    );

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <ViewBeacon event="store_viewed" id={store.id} />
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">{textOf(store.name, locale)}</h1>
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
          <StarIcon className="size-4 text-saffron" />
          <span>{formatNumber(store.rating, locale, 1)}</span>
          <span className="text-muted">{t("reviews", { count: formatNumber(store.reviewCount, locale) })}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {textOf(store.area, locale)}
          <span aria-hidden="true"> · </span>
          {t("distance", { distance: formatNumber(store.distanceKm, locale, 1) })}
        </p>
        <p className="mt-1 text-sm">
          <span className={store.isOpen ? "font-medium text-accent-text" : "font-medium text-warn"}>
            {store.isOpen ? t("open") : t("closed")}
          </span>
          <span aria-hidden="true"> · </span>
          <span className="text-muted">
            {t("deliveryWindow", {
              min: formatNumber(store.deliveryMinMinutes, locale),
              max: formatNumber(store.deliveryMaxMinutes, locale),
            })}
          </span>
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {store.categories.map((category) => (
            <li key={category} className="rounded-full bg-paper px-3 py-1 text-xs font-medium">
              {categories(category)}
            </li>
          ))}
        </ul>
        {!store.isOpen ? <p className="mt-3 text-sm text-warn">{tStore("closedNote")}</p> : null}
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">{tStore("products")}</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted">{tStore("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} store={store} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
