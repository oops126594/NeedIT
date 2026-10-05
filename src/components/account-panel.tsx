"use client";

import { Link } from "@/i18n/navigation";
import { LanguageChoices, LocationChoices } from "@/components/app-shell";
import { useTranslations } from "next-intl";

export function AccountPanel() {
  const t = useTranslations("Account");

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <section className="rounded-2xl bg-paper px-4 py-4">
        <h2 className="font-semibold">{t("guest")}</h2>
        <p className="mt-2 text-sm text-muted">{t("guestBody")}</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("language")}</h2>
        <LanguageChoices />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("location")}</h2>
        <LocationChoices />
      </section>
      <div className="flex flex-col gap-2">
        <Link href="/orders" className="text-sm font-semibold text-accent-text">
          {t("orders")}
        </Link>
        <Link href="/support" className="text-sm font-semibold text-accent-text">
          {t("support")}
        </Link>
      </div>
    </div>
  );
}
