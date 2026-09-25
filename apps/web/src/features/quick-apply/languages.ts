/**
 * Sprachen der 60-Sekunden-Bewerbung (PRD v2 §5.3).
 * Sprachnamen stehen in eigener Schreibweise – keine Flaggen.
 */
export const QUICK_APPLY_LANGUAGES = [
  { code: "de", name: "Deutsch", speech: "de-DE", dir: "ltr", primary: true },
  { code: "en", name: "English", speech: "en-GB", dir: "ltr", primary: true },
  { code: "tr", name: "Türkçe", speech: "tr-TR", dir: "ltr", primary: true },
  { code: "ar", name: "العربية", speech: "ar-SA", dir: "rtl", primary: true },
  { code: "uk", name: "Українська", speech: "uk-UA", dir: "ltr", primary: true },
  { code: "de-easy", name: "Leichte Sprache", speech: "de-DE", dir: "ltr", primary: false },
  { code: "pl", name: "Polski", speech: "pl-PL", dir: "ltr", primary: false },
  { code: "ro", name: "Română", speech: "ro-RO", dir: "ltr", primary: false },
  { code: "ru", name: "Русский", speech: "ru-RU", dir: "ltr", primary: false },
] as const;

/** Die fünf prominent angezeigten Sprachen für Bewerbende in Rheinland-Pfalz. */
export const PRIMARY_QUICK_APPLY_LANGUAGES = QUICK_APPLY_LANGUAGES.filter((language) => language.primary);

export type QuickApplyLanguage = (typeof QUICK_APPLY_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: QuickApplyLanguage = "de";

export function isQuickApplyLanguage(value: unknown): value is QuickApplyLanguage {
  return QUICK_APPLY_LANGUAGES.some((l) => l.code === value);
}

export function languageInfo(code: QuickApplyLanguage) {
  return QUICK_APPLY_LANGUAGES.find((l) => l.code === code) ?? QUICK_APPLY_LANGUAGES[0];
}

/**
 * Schlägt eine Sprache anhand des Accept-Language-Headers vor.
 * "de" bleibt Deutsch; Leichte Sprache wird nie automatisch gewählt.
 */
export function suggestLanguage(acceptLanguage: string | null | undefined): QuickApplyLanguage {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag = "", q = "q=1"] = part.trim().split(";");
      return { tag: tag.toLowerCase(), q: Number(q.replace("q=", "")) || 0 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag, q } of preferred) {
    if (!tag || tag === "*" || q <= 0) continue;
    const base = tag.split("-")[0];
    const match = QUICK_APPLY_LANGUAGES.find((l) => l.code === base);
    if (match) return match.code;
  }
  return DEFAULT_LANGUAGE;
}
