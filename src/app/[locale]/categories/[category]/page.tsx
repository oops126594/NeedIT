import { BackButton } from "@/components/back-button";
import { ProductCard } from "@/components/product-card";
import { isAppLocale } from "@/i18n/routing";
import { isCategoryId, stockRank } from "@/lib/catalog";
import { categoryImage } from "@/lib/photos";
import { readCatalog } from "@/lib/records";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isAppLocale(locale) || !isCategoryId(category)) return { title: "NEEDIT" };
  const t = await getTranslations({ locale, namespace: "Categories" });
  return { title: t(category) };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  if (!isAppLocale(locale) || !isCategoryId(category)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Categories");
  const tSearch = await getTranslations("Search");
  const catalog = await readCatalog();
  const items = catalog.products
    .filter((product) => product.categoryId === category)
    .flatMap((product) => {
      const store = catalog.stores.find((item) => item.id === product.storeId);
      return store ? [{ product, store }] : [];
    })
    .sort(
      (a, b) => stockRank(a.product.stock) - stockRank(b.product.stock) || a.store.distanceKm - b.store.distanceKm,
    );

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <BackButton />
      <div className="flex items-center gap-3">
        <img
          src={categoryImage(category)}
          alt=""
          className="size-16 rounded-full border-2 border-[#178a3d] object-cover"
        />
        <h1 className="text-2xl font-semibold">{t(category)}</h1>
      </div>
      {items.length === 0 ? (
        <p className="text-muted">{tSearch("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.product.id}>
              <ProductCard product={item.product} store={item.store} layout="shelf" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
