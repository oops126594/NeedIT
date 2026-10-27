import { ServiceRequestForm } from "@/components/service-request-form";
import { getTranslations } from "next-intl/server";

export default async function FuelServicePage() {
  const t = await getTranslations("Services");
  return <div className="mx-auto flex max-w-3xl flex-col gap-5"><header><p className="font-bold text-[#9a6400]">{t("fuelEyebrow")}</p><h1 className="mt-1 text-3xl font-black">{t("fuelTitle")}</h1><p className="mt-2 text-muted">{t("fuelIntro")}</p></header><ServiceRequestForm kind="fuel" /></div>;
}
