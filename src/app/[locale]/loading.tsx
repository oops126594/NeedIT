import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Common");
  return (
    <div className="flex flex-col gap-4 px-4 py-6" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted">{t("loading")}</p>
      <div className="motion-safe:animate-pulse h-8 w-2/3 rounded-xl bg-paper" />
      <div className="motion-safe:animate-pulse h-14 rounded-2xl bg-paper" />
      <div className="motion-safe:animate-pulse h-24 rounded-2xl bg-paper" />
      <div className="motion-safe:animate-pulse h-24 rounded-2xl bg-paper" />
    </div>
  );
}
