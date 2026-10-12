"use client";

import { getProduct, getStore } from "@/lib/catalog";
import { MAX_QUANTITY } from "@/lib/orders";
import { textOf } from "@/lib/text";
import { useShop } from "@/components/shop-provider";
import { primaryButtonClass, secondaryButtonClass } from "@/components/styles";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function AddToCart({
  productId,
  withQuantity = false,
  compact = false,
}: {
  productId: string;
  withQuantity?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Product");
  const locale = useAppLocale();
  const { ready, summary, addToCart, replaceCart } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const product = getProduct(productId);
  const store = product ? getStore(product.storeId) : undefined;
  const inCart = summary.detailed.find((item) => item.product.id === productId)?.line.quantity ?? 0;
  const unavailable = !product || product.stock === "OUT_OF_STOCK";
  const closed = Boolean(store && !store.isOpen);

  function submit(replace: boolean) {
    const result = replace ? replaceCart(productId, quantity) : addToCart(productId, quantity);
    if (result.ok) {
      setConfirm(false);
      return;
    }
    if (result.reason === "other-store") setConfirm(true);
  }

  return (
    <div className="flex flex-col gap-3">
      {closed ? <p className="text-sm text-warn">{t("closedNote")}</p> : null}
      {unavailable ? <p className="text-sm text-danger">{t("unavailable")}</p> : null}
      {withQuantity && !unavailable && !closed ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("quantity")}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("decrease")}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-lg"
            >
              −
            </button>
            <span className="min-w-6 text-center font-semibold tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label={t("increase")}
              onClick={() => setQuantity((current) => Math.min(MAX_QUANTITY, current + 1))}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-lg"
            >
              +
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className={
          compact
            ? "h-8 min-h-0 w-auto rounded-lg border border-accent bg-[#f3faf5] px-3 text-xs font-bold uppercase tracking-wide text-accent-text disabled:opacity-40"
            : withQuantity
              ? primaryButtonClass
              : `${primaryButtonClass} min-h-11 w-auto px-4 text-sm`
        }
        disabled={!ready || unavailable || closed}
        onClick={() => submit(false)}
      >
        {t("add")}
      </button>
      {inCart > 0 ? <p className="text-sm text-accent-text">{t("inCart", { count: inCart })}</p> : null}
      {confirm && summary.store ? (
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="font-semibold">{t("otherStoreTitle")}</p>
          <p className="mt-1 text-sm text-muted">
            {t("otherStoreBody", { store: textOf(summary.store.name, locale) })}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" className={primaryButtonClass} onClick={() => submit(true)}>
              {t("replace")}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => setConfirm(false)}>
              {t("keep")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
