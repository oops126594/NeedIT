import { CheckoutForm } from "@/components/checkout-form";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("title") };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  return <CheckoutForm />;
}
