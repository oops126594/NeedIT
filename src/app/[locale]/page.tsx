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
    className: "bg-[#176b62] text-white",
    image: "/products/wall-charger.jpg",
  },
  {
    href: "/search?q=birthday%20balloons",
    title: "promoPartyTitle",
    body: "promoPartyBody",
    className: "bg-[#ffd166] text-[#33250b]",
    image: "/products/balloons.jpg",
  },
  {
    href: "/categories/home",
    title: "promoHomeTitle",
    body: "promoHomeBody",
    className: "bg-[#6557c7] text-white",
    image: "/products/drawer.jpg",
  },
] as const;

const SERVICES = [
  { href: "/services/delivery", icon: "🛵", title: "deliveryTitle", body: "deliveryBody", tone: "bg-[#dff5ef] text-[#165c53]" },
  { href: "/services/fuel", icon: "⛽", title: "fuelTitle", body: "fuelBody", tone: "bg-[#fff0d1] text-[#76510b]" },
  { href: "/support", icon: "🧰", title: "homeHelpTitle", body: "homeHelpBody", tone: "bg-[#eeeafe] text-[#5546a8]" },
  { href: "/support", icon: "✨", title: "moreTitle", body: "moreBody", tone: "bg-[#ffe5e0] text-[#a63b31]" },
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
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#ff6657] text-white shadow-[0_24px_60px_rgba(198,64,52,.22)]">
        <div className="absolute -end-12 -top-20 size-56 rounded-full bg-[#ffd166]/70" />
        <div className="absolute -bottom-24 start-1/3 size-48 rounded-full bg-[#176b62]/45" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-lg">
            <p className="inline-flex rounded-full bg-white/18 px-3 py-1 text-sm font-bold text-white">{t("tagline")}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{t("headline")}</h1>
            <p className="mt-2 max-w-md text-base leading-7 text-white/90">{t("bannerBody")}</p>
            <Link
              href="/search?q=I%20need%20a%20phone%20charger"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-[#c9342a] shadow-lg transition hover:-translate-y-0.5"
            >
              {t("findIt")}
            </Link>
          </div>
          <img src="/logo.png" alt="" className="h-28 w-auto self-end drop-shadow-xl sm:h-40" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-accent-text">{t("servicesEyebrow")}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">{t("servicesTitle")}</h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted shadow-sm">{t("servicesSoon")}</span>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <li key={service.title}>
              <Link href={service.href} className={`block h-full rounded-3xl p-4 transition hover:-translate-y-1 sm:p-5 ${service.tone}`}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm" aria-hidden="true">{service.icon}</span>
                <h3 className="mt-4 font-extrabold">{t(service.title)}</h3>
                <p className="mt-1 text-sm leading-5 opacity-80">{t(service.body)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">{t("categories")}</h2>
        <ul className="flex gap-4 overflow-x-auto pb-1">
          {CATEGORY_IDS.map((id) => (
            <li key={id} className="w-16 shrink-0">
              <Link href={`/categories/${id}`} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-[0_8px_22px_rgba(60,42,30,.1)] transition hover:-translate-y-1 hover:border-accent/40">
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
            className={`flex min-h-40 items-end justify-between gap-3 rounded-3xl p-5 shadow-[0_12px_30px_rgba(60,42,30,.1)] transition hover:-translate-y-1 ${promo.className}`}
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
        <h2 className="mb-4 text-xl font-extrabold">{t("bestsellers")}</h2>
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
