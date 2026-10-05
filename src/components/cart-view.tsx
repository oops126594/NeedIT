"use client";

import { Link } from "@/i18n/navigation";
import { formatSar } from "@/lib/money";
import { MAX_QUANTITY } from "@/lib/orders";
import { textOf } from "@/lib/text";
import { BackButton } from "@/components/back-button";
import { useShop } from "@/components/shop-provider";
import { primaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";

export function CartView() {
  const t = useTranslations("Cart");
  const tProduct = useTranslations("Product");
  const locale = useAppLocale();
  const { ready, summary, setQuantity } = useShop();

  if (!ready) {
    return <p className="px-4 py-8 text-sm text-muted">{t("loading")}</p>;
  }

  if (!summary.store || summary.detailed.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted">{t("empty")}</p>
        <Link href="/" className={primaryButtonClass}>
          {t("emptyAction")}
        </Link>
      </div>
    );
  }

  const closed = !summary.store.isOpen;

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <BackButton />
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted">{t("oneStore")}</p>
      <p className="text-sm">
        <Link href={`/stores/${summary.store.id}`} className="font-semibold text-accent-text">
          {t("from", { store: textOf(summary.store.name, locale) })}
        </Link>
      </p>
      {closed ? <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-warn">{t("closed")}</p> : null}
      <ul className="flex flex-col gap-3">
        {summary.detailed.map((item) => (
          <li key={item.product.id} className="rounded-2xl border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{textOf(item.product.name, locale)}</p>
                <p className="text-sm text-muted tabular-nums">{formatSar(item.product.priceHalalas, locale)}</p>
              </div>
              <p className="font-semibold tabular-nums">{formatSar(item.lineHalalas, locale)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-line"
                  aria-label={tProduct("decrease")}
                  onClick={() => setQuantity(item.product.id, item.line.quantity - 1)}
                >
                  −
                </button>
                <span className="min-w-6 text-center font-semibold tabular-nums">{item.line.quantity}</span>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-line"
                  aria-label={tProduct("increase")}
                  disabled={item.line.quantity >= MAX_QUANTITY}
                  onClick={() => setQuantity(item.product.id, item.line.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-danger"
                onClick={() => setQuantity(item.product.id, 0)}
              >
                {t("remove", { name: textOf(item.product.name, locale) })}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt>{t("subtotal")}</dt>
          <dd className="tabular-nums">{formatSar(summary.subtotal, locale)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{t("delivery")}</dt>
          <dd className="tabular-nums">{formatSar(summary.delivery, locale)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>{t("total")}</dt>
          <dd className="tabular-nums">{formatSar(summary.total, locale)}</dd>
        </div>
      </dl>
      <div className="h-28" />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[480px] border-t border-line bg-card/95 px-4 py-3 backdrop-blur">
        {closed ? (
          <p className="text-center text-sm text-warn">{t("closed")}</p>
        ) : (
          <Link href="/checkout" className={primaryButtonClass}>
            {t("checkout")} · {formatSar(summary.total, locale)}
          </Link>
        )}
      </div>
    </div>
  );
}
