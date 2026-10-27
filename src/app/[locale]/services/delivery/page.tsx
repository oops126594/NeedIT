import { ServiceRequestForm } from "@/components/service-request-form";
import { getTranslations } from "next-intl/server";

export default async function DeliveryServicePage() {
  const t = await getTranslations("Services");
  return <div className="mx-auto flex max-w-3xl flex-col gap-5"><header><p className="font-bold text-[#176b62]">{t("deliveryEyebrow")}</p><h1 className="mt-1 text-3xl font-black">{t("deliveryTitle")}</h1><p className="mt-2 text-muted">{t("deliveryIntro")}</p></header><ServiceRequestForm kind="delivery" /></div>;
}
