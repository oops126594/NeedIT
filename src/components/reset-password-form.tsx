"use client";

import { Link } from "@/i18n/navigation";
import { fieldClass, primaryButtonClass } from "@/components/styles";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm() {
  const t = useTranslations("Account");
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError(t("invalid"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsDiffer"));
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setPending(false);
    if (!response.ok) {
      setError(t("resetInvalid"));
      return;
    }
    setDone(true);
  }

  if (!token) return <p className="px-4 py-8 text-sm text-danger">{t("resetInvalid")}</p>;
  if (done) {
    return (
      <div className="flex flex-col gap-3 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("resetDone")}</h1>
        <Link href="/account" className={primaryButtonClass}>
          {t("signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3 px-4 py-8" noValidate>
      <h1 className="text-2xl font-semibold">{t("forgot")}</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t("newPassword")}</span>
        <input
          className={fieldClass}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{t("confirmPassword")}</span>
        <input
          className={fieldClass}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {t("resetAction")}
      </button>
    </form>
  );
}
