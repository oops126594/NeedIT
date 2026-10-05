import { SupportForm } from "@/components/support-form";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Support" });
  return { title: t("title") };
}

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  await resolveLocale(params);
  const order = (await searchParams).order;
  const orderId = typeof order === "string" ? order : undefined;
  return <SupportForm orderId={orderId} />;
}
