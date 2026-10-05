"use client";

import { isAppLocale, type AppLocale } from "@/i18n/routing";
import { useLocale } from "next-intl";

export function useAppLocale(): AppLocale {
  const locale = useLocale();
  return isAppLocale(locale) ? locale : "ar";
}
