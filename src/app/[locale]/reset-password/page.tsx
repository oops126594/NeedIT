import { ResetPasswordForm } from "@/components/reset-password-form";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("forgot") };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
