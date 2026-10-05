"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getLocation, SERVICE_LOCATIONS, type LocationId } from "@/lib/locations";
import { textOf } from "@/lib/text";
import type { AppLocale } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { BagIcon, BellIcon, CartIcon, HelpIcon, HomeIcon, PinIcon, UserIcon } from "@/components/icons";
import { useShop } from "@/components/shop-provider";
import { useAppLocale } from "@/components/use-app-locale";

const iconButtonClass =
  "relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-paper";

export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useAppLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");
  const next: AppLocale = locale === "ar" ? "en" : "ar";
  const label = next === "en" ? "English" : "العربية";

  return (
    <button
      type="button"
      className={className ?? `${iconButtonClass} text-sm font-semibold`}
      aria-label={`${t("language")}: ${label}`}
      onClick={() => {
        const query = window.location.search;
        router.replace(query ? `${pathname}${query}` : pathname, { locale: next });
      }}
    >
      {label}
    </button>
  );
}

export function LanguageChoices() {
  const locale = useAppLocale();
  const pathname = usePathname();
  const router = useRouter();

  function choose(next: AppLocale) {
    if (next === locale) return;
    const query = window.location.search;
    router.replace(query ? `${pathname}${query}` : pathname, { locale: next });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          ["ar", "العربية"],
          ["en", "English"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={locale === id}
          onClick={() => choose(id)}
          className={`min-h-12 rounded-full border text-sm font-semibold ${
            locale === id ? "border-accent bg-accent-soft text-accent-text" : "border-line bg-card"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function LocationChoices() {
  const locale = useAppLocale();
  const t = useTranslations("Home");
  const { locationId, setLocation } = useShop();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">{t("locationHelp")}</p>
      {SERVICE_LOCATIONS.map((location) => (
        <button
          key={location.id}
          type="button"
          aria-pressed={location.id === locationId}
          onClick={() => setLocation(location.id)}
          className={`min-h-12 rounded-2xl border px-4 text-start text-sm font-semibold ${
            location.id === locationId ? "border-accent bg-accent-soft text-accent-text" : "border-line"
          }`}
        >
          {textOf(location.name, locale)}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Nav");
  const tCommon = useTranslations("Common");
  const tHome = useTranslations("Home");
  const tToast = useTranslations("Toast");
  const tNotes = useTranslations("Notifications");
  const tOrder = useTranslations("Order");
  const locale = useAppLocale();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  const { cartCount, unreadCount, locationId, toast, shop, ready, markNotificationsRead } = useShop();
  const [panel, setPanel] = useState<"location" | "notifications" | null>(null);
  const location = getLocation(locationId);

  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!panel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const tabs = [
    { href: "/", label: t("home"), icon: HomeIcon, active: pathname === "/" },
    { href: "/orders", label: t("orders"), icon: BagIcon, active: pathname.startsWith("/orders") },
    { href: "/support", label: t("support"), icon: HelpIcon, active: pathname.startsWith("/support") },
    { href: "/account", label: t("account"), icon: UserIcon, active: pathname.startsWith("/account") },
  ] as const;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-card md:shadow-[0_0_0_1px_rgba(26,24,20,0.08)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        {tCommon("skip")}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 rounded-full">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-ink">
              N
            </span>
            <span className="text-lg font-bold tracking-tight">NEEDIT</span>
          </Link>
          <div className="flex items-center">
            <LocaleSwitch />
            <button
              type="button"
              className={iconButtonClass}
              aria-expanded={panel === "notifications"}
              aria-label={t("notifications")}
              onClick={() => {
                setPanel((current) => (current === "notifications" ? null : "notifications"));
                if (panel !== "notifications") markNotificationsRead();
              }}
            >
              <BellIcon />
              {ready && unreadCount > 0 ? (
                <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-danger" />
              ) : null}
            </button>
            <Link href="/cart" className={iconButtonClass} aria-label={t("cart")}>
              <CartIcon />
              {ready && cartCount > 0 ? (
                <span className="absolute end-1 top-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-accent-ink">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full text-sm font-medium text-ink"
          aria-expanded={panel === "location"}
          onClick={() => setPanel((current) => (current === "location" ? null : "location"))}
        >
          <PinIcon className="size-4 text-accent-text" />
          <span>{textOf(location.name, locale)}</span>
        </button>
        {panel === "location" ? (
          <div className="mt-2 rounded-2xl border border-line bg-card p-3 shadow-lg">
            <p className="mb-2 text-sm font-semibold">{tHome("locationLabel")}</p>
            <LocationChoices />
          </div>
        ) : null}
        {panel === "notifications" ? (
          <div className="mt-2 max-h-72 overflow-auto rounded-2xl border border-line bg-card p-3 shadow-lg">
            <p className="mb-2 text-sm font-semibold">{tNotes("title")}</p>
            {shop.notifications.length === 0 ? (
              <p className="text-sm text-muted">{tNotes("empty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shop.notifications.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/orders/${note.orderId}`}
                      className="block rounded-xl bg-paper px-3 py-2 text-sm"
                    >
                      {tOrder("notification", {
                        orderId: note.orderId,
                        status: tOrder(`status.${note.status}`),
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </header>
      <main id="content" className="flex-1 pb-28">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[480px] border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                tab.active ? "text-accent-text" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {toast ? (
        <p
          role="status"
          className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm text-card"
        >
          {tToast(toast)}
        </p>
      ) : null}
    </div>
  );
}

export type { LocationId };
