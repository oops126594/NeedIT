import { AccountPanel } from "@/components/account-panel";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title") };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  await resolveLocale(params);
  const nextValue = (await searchParams).next;
  const nextPath = typeof nextValue === "string" && nextValue.startsWith("/") && !nextValue.startsWith("//") ? nextValue : "/";
  return <AccountPanel nextPath={nextPath} />;
}
