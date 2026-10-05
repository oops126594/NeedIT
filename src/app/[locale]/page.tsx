import { CategoryMark } from "@/components/icons";
import { RecentSearches } from "@/components/recent-searches";
import { SearchForm } from "@/components/search-form";
import { StoreCard } from "@/components/product-card";
import { Link } from "@/i18n/navigation";
import { CATEGORY_IDS, POPULAR_NEEDS, nearbyStores } from "@/lib/catalog";
import { resolveLocale } from "@/lib/locale";
import { textOf } from "@/lib/text";
import { getTranslations } from "next-intl/server";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("Home");
  const categories = await getTranslations("Categories");
  const stores = nearbyStores();

  return (
    <div className="flex flex-col gap-8 px-4 py-5">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">{t("headline")}</h1>
        <p className="mt-1 text-muted">{t("tagline")}</p>
      </div>
      <SearchForm />
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted">{t("categories")}</h2>
        <ul className="grid grid-cols-4 gap-2">
          {CATEGORY_IDS.map((id) => (
            <li key={id}>
              <Link href={`/categories/${id}`} className="flex flex-col items-center gap-2 rounded-2xl py-1 text-center">
                <CategoryMark id={id} />
                <span className="text-xs font-medium leading-tight">{categories(id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <RecentSearches />
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted">{t("popular")}</h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR_NEEDS.map((need) => (
            <li key={need.id}>
              <Link
                href={`/search?q=${encodeURIComponent(textOf(need.query, locale))}`}
                className="inline-flex min-h-10 items-center rounded-full bg-paper px-3 text-sm font-medium"
              >
                {textOf(need.query, locale)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-muted">{t("nearby")}</h2>
          <p className="mt-1 text-sm text-muted">{t("serviceArea")}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {stores.map((store) => (
            <li key={store.id}>
              <StoreCard store={store} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
