import { OrderTracker } from "@/components/order-tracker";
import { isAppLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) return { title: "NEEDIT" };
  const t = await getTranslations({ locale, namespace: "Order" });
  return { title: `${t("title")} ${id}` };
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  return <OrderTracker id={id} />;
}
