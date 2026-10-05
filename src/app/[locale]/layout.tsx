import { AppShell } from "@/components/app-shell";
import { ShopProvider } from "@/components/shop-provider";
import { isAppLocale, routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return { title: "NEEDIT" };
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: { default: t("title"), template: "%s · NEEDIT" },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ShopProvider>
        <AppShell>{children}</AppShell>
      </ShopProvider>
    </NextIntlClientProvider>
  );
}
