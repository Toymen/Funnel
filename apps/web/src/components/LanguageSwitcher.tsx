"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { setLocaleAction } from "@/i18n/actions";
import { type AppLocale, LOCALE_NAMES, LOCALES } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Umschalter Deutsch/English für den Arbeitgeberbereich (Nutzermenü, Anmeldung).
 * Sprachnamen stehen in eigener Schreibweise, damit man sie in jeder Sprache findet.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common.language");
  const current = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: AppLocale) {
    if (locale === current) return;
    startTransition(async () => {
      const { ok } = await setLocaleAction(locale);
      if (ok) router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn("inline-flex rounded-lg bg-muted p-0.5", className)}
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          disabled={isPending}
          onClick={() => choose(locale)}
          className={cn(
            "min-h-8 rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-60",
            locale === current
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LOCALE_NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
