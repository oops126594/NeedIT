import type { AppLocale } from "@/i18n/routing";

export function localeTag(locale: AppLocale): string {
  return locale === "ar" ? "ar-SA" : "en-SA";
}

export function formatNumber(value: number, locale: AppLocale, digits = 0): string {
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatTime(timestamp: number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function freshness(iso: string, now = Date.now()): "today" | "recent" | "stale" {
  const age = now - new Date(iso).getTime();
  const day = 86_400_000;
  if (Number.isNaN(age) || age < day) return "today";
  if (age < 3 * day) return "recent";
  return "stale";
}
