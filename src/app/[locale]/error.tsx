"use client";

import { secondaryButtonClass } from "@/components/styles";
import { useTranslations } from "next-intl";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Common");
  return (
    <div className="flex flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("error")}</h1>
      <button type="button" className={secondaryButtonClass} onClick={reset}>
        {t("retry")}
      </button>
    </div>
  );
}
