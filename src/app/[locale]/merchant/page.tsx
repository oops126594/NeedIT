import { MerchantBoard } from "@/components/merchant-board";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Merchant" });
  return { title: t("title") };
}

export default async function MerchantPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  return <MerchantBoard />;
}
