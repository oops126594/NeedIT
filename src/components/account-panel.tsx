"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { PILOT_ADMIN, PILOT_COURIERS, PILOT_MERCHANT } from "@/lib/pilot-accounts";
import { isSaudiMobile } from "@/lib/validate";
import { LanguageChoices, LocationChoices } from "@/components/app-shell";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "MERCHANT" | "ADMIN" | "COURIER";
  storeId?: string;
};

export function AccountPanel({ nextPath }: { nextPath: string }) {
  const t = useTranslations("Account");
  const locale = useAppLocale();
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
  const [resetNote, setResetNote] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

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

  async function sendReset() {
    setResetNote(null);
    setResetting(true);
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setResetting(false);
    if (response.status === 503) {
      setResetNote(t("mailUnavailable"));
      return;
    }
    if (!response.ok) {
      setResetNote(t("invalid"));
      return;
    }
    setResetNote(t("resetSent"));
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  if (!ready) {
    return <div className="mx-auto mt-16 h-96 w-full max-w-5xl animate-pulse rounded-[2rem] bg-white/70" />;
  }

  if (!user) {
    return (
      <div className="relative mx-auto min-h-[calc(100dvh-10rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-[#28243d] text-white shadow-[0_28px_80px_rgba(40,36,61,.25)]">
        <div className="animate-drift absolute -start-20 -top-24 size-72 rounded-full bg-[#ff6657]/35 blur-sm" />
        <div className="animate-float absolute -end-20 top-1/3 size-64 rounded-full bg-[#8bf0b1]/25 blur-sm" />
        <div className="absolute bottom-0 start-1/3 size-52 rounded-full bg-[#ffd166]/15 blur-sm" />
        <div className="relative grid min-h-[calc(100dvh-10rem)] lg:grid-cols-[1.05fr_.95fr]">
          <section className="flex flex-col justify-between p-7 sm:p-10 lg:p-14">
            <div>
              <Image src="/logo.png" alt="NEEDIT" width={180} height={64} priority className="h-16 w-auto rounded-2xl bg-white/95 p-2 shadow-xl" />
              <p className="mt-10 inline-flex rounded-full bg-[#8bf0b1]/15 px-3 py-1 text-sm font-bold text-[#8bf0b1]">{t("welcomeEyebrow")}</p>
              <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-6xl">{t("welcomeTitle")}</h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/65 sm:text-lg">{t("welcomeBody")}</p>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 text-center text-xs font-bold text-white/75">
              <span className="rounded-2xl bg-white/7 p-3">🛵<span className="mt-1 block">{t("benefitFast")}</span></span>
              <span className="rounded-2xl bg-white/7 p-3">📍<span className="mt-1 block">{t("benefitTrack")}</span></span>
              <span className="rounded-2xl bg-white/7 p-3">🌱<span className="mt-1 block">{t("benefitLocal")}</span></span>
            </div>
          </section>
          <section className="m-3 flex items-center rounded-[1.65rem] bg-[#fffaf4] p-5 text-ink sm:m-5 sm:p-8 lg:m-6 lg:p-10">
            <div className="w-full">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div><p className="text-sm font-bold text-accent-text">{t("hello")}</p><h2 className="mt-1 text-3xl font-black">{mode === "login" ? t("signIn") : t("register")}</h2></div>
                <LanguageChoices />
              </div>
              <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#f3ebe4] p-1.5">
                <button type="button" className={`h-11 rounded-xl text-sm font-bold ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => { setMode("login"); setError(null); }}>{t("signIn")}</button>
                <button type="button" className={`h-11 rounded-xl text-sm font-bold ${mode === "register" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => { setMode("register"); setError(null); }}>{t("register")}</button>
              </div>
              <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
                {mode === "register" ? <><AuthField label={t("name")} value={name} onChange={setName} autoComplete="name" /><AuthField label={t("phone")} value={phone} onChange={setPhone} autoComplete="tel" inputMode="tel" /></> : null}
                <AuthField label={t("email")} value={email} onChange={setEmail} autoComplete="email" type="email" />
                <AuthField label={t("password")} value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" />
                {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
                {mode === "login" ? <button type="button" className="self-start text-sm font-bold text-accent-text" onClick={() => void sendReset()} disabled={resetting}>{t("forgot")}</button> : null}
                {resetNote ? <p className="text-sm text-muted">{resetNote}</p> : null}
                <button type="submit" className={primaryButtonClass} disabled={pending}>{pending ? (mode === "login" ? t("signingIn") : t("creating")) : mode === "login" ? t("signInAction") : t("createAction")}</button>
              </form>
              <p className="mt-5 text-center text-xs leading-5 text-muted">{t("privacyNote")}</p>
            </div>
          </section>
        </div>
      </div>
    );
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
            {user.role === "ADMIN"
              ? t("roleAdmin")
              : user.role === "MERCHANT"
                ? t("roleMerchant")
                : user.role === "COURIER"
                  ? t("roleCourier")
                  : t("roleCustomer")}
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
            {user.role === "COURIER" ? (
              <Link href="/courier" className="text-sm font-semibold text-accent-text">
                {t("courier")}
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
            {mode === "login" ? (
              <button type="button" className="self-start text-sm font-semibold text-accent-text" onClick={() => void sendReset()} disabled={resetting}>
                {t("forgot")}
              </button>
            ) : null}
            {resetNote ? <p className="text-sm text-muted">{resetNote}</p> : null}
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
            {PILOT_COURIERS.map((courier) => (
              <p key={courier.id} className="mt-2">
                {t("roleCourier")}: {courier.email}
                <br />
                {courier.password}
              </p>
            ))}
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

function AuthField({ label, value, onChange, type = "text", autoComplete, inputMode }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete: string; inputMode?: "tel" }) {
  return <label className="text-sm font-bold"><span>{label}</span><input className={`${fieldClass} mt-2 h-14`} type={type} autoComplete={autoComplete} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
