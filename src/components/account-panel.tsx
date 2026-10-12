"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { PILOT_ADMIN, PILOT_MERCHANT } from "@/lib/pilot-accounts";
import { isSaudiMobile } from "@/lib/validate";
import { LanguageChoices, LocationChoices } from "@/components/app-shell";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "MERCHANT" | "ADMIN";
  storeId?: string;
};

export function AccountPanel({ nextPath }: { nextPath: string }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!alive) return;
        if (!response.ok) {
          setUser(null);
          setReady(true);
          return;
        }
        const data = (await response.json()) as { user: SessionUser };
        setUser(data.user);
        setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (mode === "register" && (name.trim().length < 2 || !isSaudiMobile(phone))) {
      setError(t("invalid"));
      return;
    }
    setPending(true);
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mode === "login" ? { email, password } : { name, email, phone, password },
      ),
    });
    setPending(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "exists" ? t("exists") : t("invalid"));
      return;
    }
    const data = (await response.json()) as { user: SessionUser };
    setUser(data.user);
    router.push(nextPath);
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {!ready ? <p className="text-sm text-muted">{t("signIn")}</p> : null}
      {ready && user ? (
        <section className="rounded-2xl bg-paper px-4 py-4">
          <h2 className="font-semibold">{t("signedIn", { name: user.name })}</h2>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-sm">
            {user.role === "ADMIN" ? t("roleAdmin") : user.role === "MERCHANT" ? t("roleMerchant") : t("roleCustomer")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {user.role === "MERCHANT" ? (
              <Link href="/merchant" className="text-sm font-semibold text-accent-text">
                {t("merchant")}
              </Link>
            ) : null}
            {user.role === "ADMIN" ? (
              <Link href="/admin" className="text-sm font-semibold text-accent-text">
                {t("admin")}
              </Link>
            ) : null}
            <button type="button" className={secondaryButtonClass} onClick={() => void signOut()}>
              {t("signOut")}
            </button>
          </div>
        </section>
      ) : null}
      {ready && !user ? (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={mode === "login" ? primaryButtonClass : secondaryButtonClass}
              onClick={() => setMode("login")}
            >
              {t("signIn")}
            </button>
            <button
              type="button"
              className={mode === "register" ? primaryButtonClass : secondaryButtonClass}
              onClick={() => setMode("register")}
            >
              {t("register")}
            </button>
          </div>
          <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3" noValidate>
            {mode === "register" ? (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{t("name")}</span>
                  <input className={fieldClass} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{t("phone")}</span>
                  <input className={fieldClass} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </label>
              </>
            ) : null}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{t("email")}</span>
              <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{t("password")}</span>
              <input className={fieldClass} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button type="submit" className={primaryButtonClass} disabled={pending}>
              {pending ? (mode === "login" ? t("signingIn") : t("creating")) : mode === "login" ? t("signIn") : t("register")}
            </button>
          </form>
          <section className="rounded-2xl border border-line px-4 py-3 text-sm">
            <h2 className="font-semibold">{t("pilot")}</h2>
            <p className="mt-2">
              {t("roleAdmin")}: {PILOT_ADMIN.email}
              <br />
              {PILOT_ADMIN.password}
            </p>
            <p className="mt-2">
              {t("roleMerchant")}: {PILOT_MERCHANT.email}
              <br />
              {PILOT_MERCHANT.password}
            </p>
          </section>
        </section>
      ) : null}
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
