/**
 * Sprachen des Arbeitgeberbereichs (Dashboard, Anmeldung, Einstellungen).
 *
 * Die Sprache steht in einem Cookie, nicht in der URL: Harlys Routen bleiben
 * unverändert, und jede Person im Team kann ihre eigene Sprache wählen.
 * Ohne Cookie entscheidet der Accept-Language-Header, sonst Deutsch.
 */
export const LOCALES = ["de", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "de";
export const LOCALE_COOKIE = "HARLY_LOCALE";
/** Ein Jahr – die Wahl soll nicht bei jedem Login verloren gehen. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Feste Zeitzone, damit Server und Browser Daten gleich formatieren. */
export const TIME_ZONE = "Europe/Berlin";

/** Anzeigenamen in eigener Schreibweise (werden nicht übersetzt). */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  de: "Deutsch",
  en: "English",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Wählt anhand des Accept-Language-Headers Deutsch oder Englisch.
 * Regionen zählen zur Grundsprache (de-AT → de, en-GB → en); alles andere → Deutsch.
 */
export function negotiateLocale(
  acceptLanguage: string | null | undefined,
): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return {
        base: tag.trim().toLowerCase().split("-")[0] ?? "",
        weight: Number.isFinite(weight) ? weight : 0,
        index,
      };
    })
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { base } of ranked) {
    if (isAppLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
