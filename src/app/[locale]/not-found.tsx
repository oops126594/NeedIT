import { Link } from "@/i18n/navigation";
import { primaryButtonClass } from "@/components/styles";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("Common");
  return (
    <div className="flex flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted">{t("notFoundBody")}</p>
      <Link href="/" className={`${primaryButtonClass} mt-3`}>
        {t("backHome")}
      </Link>
    </div>
  );
}
