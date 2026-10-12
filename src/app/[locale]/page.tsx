import { ProductCard } from "@/components/product-card";
import { categoryImage } from "@/lib/photos";
import { RecentSearches } from "@/components/recent-searches";
import { Link } from "@/i18n/navigation";
import { CATEGORY_IDS } from "@/lib/catalog";
import { readCatalog } from "@/lib/records";
import { resolveLocale } from "@/lib/locale";
import { getTranslations } from "next-intl/server";

const PROMOS = [
  {
    href: "/search?q=iPhone%20charger",
    title: "promoTechTitle",
    body: "promoTechBody",
    className: "bg-[#178a3d] text-white",
    image: "/products/wall-charger.jpg",
  },
  {
    href: "/search?q=birthday%20balloons",
    title: "promoPartyTitle",
    body: "promoPartyBody",
    className: "bg-[#f2b705] text-[#1c1c1c]",
    image: "/products/balloons.jpg",
  },
  {
    href: "/categories/home",
    title: "promoHomeTitle",
    body: "promoHomeBody",
    className: "bg-[#1d4e89] text-white",
    image: "/products/drawer.jpg",
  },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("Home");
  const categories = await getTranslations("Categories");
  const catalog = await readCatalog();
  const shelf = catalog.products
    .flatMap((product) => {
      const store = catalog.stores.find((item) => item.id === product.storeId);
      if (!store || !store.isOpen || product.stock === "OUT_OF_STOCK") return [];
      return [{ product, store }];
    })
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl bg-[#178a3d] text-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-lg">
            <p className="text-sm font-semibold text-white/80">{t("tagline")}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t("headline")}</h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">{t("bannerBody")}</p>
            <Link
              href="/search?q=I%20need%20a%20phone%20charger"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-[#178a3d]"
            >
              {t("findIt")}
            </Link>
          </div>
          <img src="/logo.png" alt="" className="h-28 w-auto self-end sm:h-36" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">{t("categories")}</h2>
        <ul className="flex gap-4 overflow-x-auto pb-1">
          {CATEGORY_IDS.map((id) => (
            <li key={id} className="w-16 shrink-0">
              <Link href={`/categories/${id}`} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#178a3d] bg-white">
                  <img src={categoryImage(id)} alt="" className="size-full object-cover" />
                </span>
                <span className="text-xs font-medium leading-tight">{categories(id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {PROMOS.map((promo) => (
          <Link
            key={promo.title}
            href={promo.href}
            className={`flex min-h-36 items-end justify-between gap-3 rounded-2xl p-4 ${promo.className}`}
          >
            <span>
              <span className="block text-lg font-bold leading-tight">{t(promo.title)}</span>
              <span className="mt-1 block text-sm opacity-90">{t(promo.body)}</span>
              <span className="mt-3 inline-flex h-8 items-center rounded-lg bg-white/95 px-3 text-xs font-semibold text-[#1c1c1c]">
                {t("findIt")}
              </span>
            </span>
            <img src={promo.image} alt="" className="size-24 shrink-0 rounded-xl bg-white object-cover" />
          </Link>
        ))}
      </section>

      <RecentSearches />

      <section>
        <h2 className="mb-3 text-base font-semibold">{t("bestsellers")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shelf.map(({ product, store }) => (
            <li key={product.id}>
              <ProductCard product={product} store={store} layout="shelf" />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted">{t("serviceArea")}</p>
    </div>
  );
}
