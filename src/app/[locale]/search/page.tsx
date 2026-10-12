import { BackButton } from "@/components/back-button";
import { ProductCard } from "@/components/product-card";
import { ViewBeacon } from "@/components/view-beacon";
import { formatNumber } from "@/lib/format";
import { resolveLocale } from "@/lib/locale";
import { formatSar } from "@/lib/money";
import { readCatalog } from "@/lib/records";
import { searchCatalog } from "@/lib/search";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });
  return { title: t("title") };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("Search");
  const tCommon = await getTranslations("Common");
  const raw = (await searchParams).q;
  const query = typeof raw === "string" ? raw : "";
  const catalog = await readCatalog();
  const result = searchCatalog(query, catalog.products, catalog.stores);
  const best = result.hits[0];

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <BackButton />
      <h1 className="text-[1.75rem] font-semibold tracking-tight">
        {best ? t("found") : result.query ? t("resultsFor", { query: result.query }) : t("prompt")}
      </h1>
      {best ? (
        <p className="text-base text-muted">
          {tCommon("deliveryWindow", {
            min: formatNumber(best.store.deliveryMinMinutes, locale),
            max: formatNumber(best.store.deliveryMaxMinutes, locale),
          })}
          <span aria-hidden="true"> · </span>
          <span className="font-semibold text-ink">{formatSar(best.product.priceHalalas, locale)}</span>
        </p>
      ) : null}
      {result.query ? <ViewBeacon event="search_completed" id={result.query} count={result.hits.length} /> : null}
      {result.needPhrase ? (
        <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-text">{t("needPhrase")}</p>
      ) : null}
      {result.query && result.hits.length === 0 ? (
        <div className="rounded-2xl border border-line px-4 py-6">
          <p className="font-semibold">{t("empty")}</p>
          <p className="mt-1 text-sm text-muted">{t("emptyHint")}</p>
        </div>
      ) : null}
      {result.hits.length > 0 ? (
        <>
          <p className="text-sm text-muted">{t("resultCount", { count: result.hits.length })}</p>
          <p className="text-sm text-muted">{t("sorted")}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {result.hits.map((hit) => (
              <li key={hit.product.id}>
                <ProductCard product={hit.product} store={hit.store} layout="shelf" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
