import type { AppLocale } from "@/i18n/routing";
import type { LocalizedText } from "@/lib/types";

export function textOf(value: LocalizedText, locale: AppLocale): string {
  return value[locale];
}

function toAsciiDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/** Shared fold for Arabic and English search text. */
export function normalize(value: string): string {
  return toAsciiDigits(value)
    .toLowerCase()
    .replace(/[\u064b-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenize(value: string): string[] {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ") : [];
}
