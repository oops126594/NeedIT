"use client";

import { Link } from "@/i18n/navigation";
import { useShop } from "@/components/shop-provider";
import { useTranslations } from "next-intl";

export function RecentSearches() {
  const t = useTranslations("Home");
  const { ready, shop } = useShop();
  if (!ready || shop.recentSearches.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">{t("recent")}</h2>
      <ul className="flex flex-wrap gap-2">
        {shop.recentSearches.map((query) => (
          <li key={query}>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="inline-flex min-h-10 items-center rounded-full border border-line bg-paper px-3 text-sm"
            >
              {query}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
