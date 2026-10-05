import { BackButton } from "@/components/back-button";
import { ProductCard } from "@/components/product-card";
import { isAppLocale } from "@/i18n/routing";
import { isCategoryId, productsForCategory } from "@/lib/catalog";
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
  const items = productsForCategory(category);

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <BackButton />
      <h1 className="text-2xl font-semibold">{t(category)}</h1>
      {items.length === 0 ? (
        <p className="text-muted">{tSearch("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.product.id}>
              <ProductCard product={item.product} store={item.store} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
