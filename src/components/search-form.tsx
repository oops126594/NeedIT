"use client";

import { useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { useShop } from "@/components/shop-provider";
import { SearchIcon } from "@/components/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

export function SearchForm({
  initialQuery = "",
  variant = "field",
}: {
  initialQuery?: string;
  variant?: "field" | "bar";
}) {
  const t = useTranslations("Home");
  const router = useRouter();
  const { addSearch } = useShop();
  const [value, setValue] = useState(initialQuery);
  const [error, setError] = useState(false);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      setError(true);
      return;
    }
    setError(false);
    addSearch(query);
    track("search_started", { q: query });
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex flex-col gap-2">
      <label htmlFor="need-search" className="sr-only">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <input
          id="need-search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(false);
          }}
          placeholder={t("placeholder")}
          maxLength={80}
          enterKeyHint="search"
          aria-invalid={error}
          aria-describedby={error ? "need-search-error" : undefined}
          className={
            variant === "bar"
              ? "h-11 w-full rounded-xl border border-line bg-paper ps-10 pe-3 text-sm text-ink placeholder:text-muted"
              : "h-12 w-full rounded-xl border border-line bg-paper ps-10 pe-3 text-base text-ink placeholder:text-muted"
          }
        />
        <button
          type="submit"
          aria-label={t("searchSubmit")}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <SearchIcon className="size-4" />
        </button>
      </div>
      {error ? (
        <p id="need-search-error" className="text-sm text-danger">
          {t("searchRequired")}
        </p>
      ) : null}
    </form>
  );
}
