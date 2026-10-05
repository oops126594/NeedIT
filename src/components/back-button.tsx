"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function BackButton() {
  const t = useTranslations("Common");
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="text-sm font-semibold text-accent-text"
    >
      {t("back")}
    </button>
  );
}
