"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { formatTime } from "@/lib/format";
import { getLocation, type LocationId } from "@/lib/locations";
import { MapPicker } from "@/components/map-picker";
import { productImage } from "@/lib/photos";
import { textOf } from "@/lib/text";
import type { AppNotification } from "@/lib/types";
import type { AppLocale } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { BagIcon, BellIcon, CartIcon, HelpIcon, HomeIcon, PinIcon, UserIcon } from "@/components/icons";
import { useShop } from "@/components/shop-provider";
import { useAppLocale } from "@/components/use-app-locale";
import { useOrderAlerts, type AlertPermission } from "@/components/use-order-alerts";
import Image from "next/image";

const iconButtonClass =
  "relative inline-flex size-11 items-center justify-center rounded-2xl text-ink transition hover:bg-accent-soft hover:text-accent-text";

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

export function LocationChoices({ onChosen }: { onChosen?: () => void }) {
  const t = useTranslations("Home");
  const { locationId, place, setPlace } = useShop();
  const preset = getLocation(locationId);
  const initial = place ?? { lat: preset.lat, lng: preset.lng };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">{t("locationHelp")}</p>
      <MapPicker
        initial={initial}
        onChoose={(next) => {
          setPlace(next);
          onChosen?.();
        }}
      />
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
  const { cartCount, locationId, place, toast, shop, ready, markNotificationsRead } = useShop();
  const alerts = useOrderAlerts(shop.notifications, locale);
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
    <div className="relative flex min-h-dvh w-full flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        {tCommon("skip")}
      </a>
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 shadow-[0_4px_24px_rgba(60,42,30,.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" locale={locale} dir="ltr" aria-label="NEEDIT home" className="inline-flex shrink-0 items-center rounded-2xl transition hover:-translate-y-0.5 hover:scale-105">
            <Image src="/logo.png" alt="" width={150} height={48} priority className="h-12 w-auto drop-shadow-sm" />
          </Link>
          <button
            type="button"
            className="min-w-0 text-start"
            aria-expanded={panel === "location"}
            onClick={() => setPanel((current) => (current === "location" ? null : "location"))}
          >
            <span className="block text-sm font-bold leading-tight">{tHome("deliveryTime")}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <PinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{place?.label ?? textOf(location.name, locale)}</span>
            </span>
          </button>
          <div className="order-last w-full shrink-0 md:order-none md:w-auto md:min-w-0 md:flex-1">
            <Suspense fallback={<div className="h-11 rounded-xl bg-paper" />}>
              <HeaderSearch />
            </Suspense>
          </div>
          <div className="ms-auto flex items-center gap-1">
            <LocaleSwitch className="inline-flex h-10 items-center rounded-lg px-2 text-sm font-semibold text-ink" />
            <button
              type="button"
              className={iconButtonClass}
              aria-expanded={panel === "notifications"}
              aria-label={t("notifications")}
              onClick={() => {
                setPanel((current) => (current === "notifications" ? null : "notifications"));
                if (panel !== "notifications") {
                  markNotificationsRead();
                  alerts.markRead();
                }
              }}
            >
              <BellIcon />
              {ready && alerts.unread > 0 ? (
                <span className="absolute end-2 top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {alerts.unread > 9 ? "9+" : alerts.unread}
                </span>
              ) : null}
            </button>
            <Link
              href="/cart"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold shadow-sm transition hover:border-accent/40 hover:bg-accent-soft"
              aria-label={t("cart")}
            >
              <CartIcon className="size-5" />
              <span className="hidden sm:inline">{t("cart")}</span>
              {ready && cartCount > 0 ? (
                <span className="rounded-md bg-accent px-1.5 text-xs font-bold text-white">{cartCount}</span>
              ) : null}
            </Link>
          </div>
        </div>
        {panel === "location" ? (
          <div className="max-h-[70vh] overflow-y-auto border-t border-line bg-white px-4 py-3">
            <div className="mx-auto w-full max-w-3xl">
              <p className="mb-2 text-sm font-semibold">{tHome("locationLabel")}</p>
              <LocationChoices onChosen={() => setPanel(null)} />
            </div>
          </div>
        ) : null}
        {panel === "notifications" ? (
          <div className="border-t border-line bg-white px-4 py-3">
            <div className="mx-auto w-full max-w-md">
              <p className="text-sm font-semibold">{tNotes("title")}</p>
              <AlertOptIn
                signedIn={alerts.signedIn}
                permission={alerts.permission}
                pushReady={alerts.pushReady}
                onEnable={() => void alerts.enable()}
              />
              {alerts.notes.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{tNotes("empty")}</p>
              ) : (
                <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-auto">
                  {alerts.notes.map((note) => (
                    <li key={note.id}>
                      <NotificationRow note={note} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 md:pb-12 md:pt-7">
        {children}
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex overflow-hidden rounded-2xl border border-line bg-white/95 shadow-[0_12px_36px_rgba(60,42,30,.16)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
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
      {alerts.banner ? (
        <Link
          href={noteHref(alerts.banner)}
          onClick={alerts.dismiss}
          className="fixed inset-x-4 top-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-lg"
        >
          <img src="/mark.png" alt="" className="size-11 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{noteTitle(alerts.banner, locale, tOrder)}</span>
            <span className="mt-0.5 block text-sm text-muted">{noteBody(alerts.banner, locale, tOrder)}</span>
          </span>
        </Link>
      ) : null}
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

function ageLabel(
  createdAt: number,
  locale: AppLocale,
  t: ReturnType<typeof useTranslations<"Notifications">>,
) {
  const minutes = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  return formatTime(createdAt, locale);
}

function noteHref(note: AppNotification): string {
  if (note.href) return note.href;
  return note.orderId ? `/orders/${note.orderId}` : "/";
}

function noteTitle(
  note: AppNotification,
  locale: AppLocale,
  tOrder: ReturnType<typeof useTranslations<"Order">>,
): string {
  if (note.title) return textOf(note.title, locale);
  return note.status ? tOrder(`status.${note.status}`) : "NEEDIT";
}

function noteBody(
  note: AppNotification,
  locale: AppLocale,
  tOrder: ReturnType<typeof useTranslations<"Order">>,
): string {
  if (note.body) return textOf(note.body, locale);
  if (note.orderId && note.status) return `${note.orderId} · ${tOrder(`detail.${note.status}`)}`;
  return note.orderId ?? "";
}

function NotificationRow({ note }: { note: AppNotification }) {
  const tOrder = useTranslations("Order");
  const tNotes = useTranslations("Notifications");
  const locale = useAppLocale();

  return (
    <Link href={noteHref(note)} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2">
      <img
        src={note.productId ? productImage(note.productId) : "/mark.png"}
        alt=""
        className="size-11 shrink-0 rounded-lg bg-white object-contain"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold">{noteTitle(note, locale, tOrder)}</span>
          <span className="shrink-0 text-xs text-muted">{ageLabel(note.createdAt, locale, tNotes)}</span>
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">{noteBody(note, locale, tOrder)}</span>
      </span>
    </Link>
  );
}

function AlertOptIn({
  signedIn,
  permission,
  pushReady,
  onEnable,
}: {
  signedIn: boolean | null;
  permission: AlertPermission;
  pushReady: boolean | null;
  onEnable: () => void;
}) {
  const t = useTranslations("Notifications");

  if (signedIn === false) {
    return (
      <Link href="/account" className="mt-3 block rounded-xl bg-accent-soft px-3 py-3 text-sm font-semibold text-accent-text">
        {t("signIn")}
      </Link>
    );
  }

  if (permission === "granted" && pushReady !== false) {
    return <p className="mt-3 rounded-xl bg-accent-soft px-3 py-3 text-sm font-semibold text-accent-text">{t("enabled")}</p>;
  }

  if (permission === "granted" && pushReady === false) {
    return <p className="mt-3 text-sm text-muted">{t("unsupported")}</p>;
  }

  if (permission === "denied") {
    return <p className="mt-3 text-sm text-muted">{t("blocked")}</p>;
  }

  if (permission === "unsupported") {
    return <p className="mt-3 text-sm text-muted">{t("unsupported")}</p>;
  }

  return (
    <div className="mt-3 rounded-xl border border-line px-3 py-3">
      <p className="text-sm text-muted">{t("enableHelp")}</p>
      <button type="button" onClick={onEnable} className="mt-2 h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-white">
        {t("enable")}
      </button>
    </div>
  );
}

function HeaderSearch() {
  const params = useSearchParams();
  return <SearchForm initialQuery={params.get("q") ?? ""} variant="bar" />;
}

export type { LocationId };
