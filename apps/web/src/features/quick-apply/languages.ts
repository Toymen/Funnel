/**
 * Sprachen der 60-Sekunden-Bewerbung (PRD v2 §5.3).
 * Sprachnamen stehen in eigener Schreibweise – keine Flaggen.
 */
export const QUICK_APPLY_LANGUAGES = [
  { code: "de", name: "Deutsch", speech: "de-DE", dir: "ltr" },
  { code: "de-easy", name: "Leichte Sprache", speech: "de-DE", dir: "ltr" },
  { code: "en", name: "English", speech: "en-GB", dir: "ltr" },
  { code: "pl", name: "Polski", speech: "pl-PL", dir: "ltr" },
  { code: "ro", name: "Română", speech: "ro-RO", dir: "ltr" },
  { code: "uk", name: "Українська", speech: "uk-UA", dir: "ltr" },
  { code: "ru", name: "Русский", speech: "ru-RU", dir: "ltr" },
  { code: "tr", name: "Türkçe", speech: "tr-TR", dir: "ltr" },
  { code: "ar", name: "العربية", speech: "ar-SA", dir: "rtl" },
] as const;

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
  for (const { tag } of preferred) {
    const base = tag.split("-")[0];
    const match = QUICK_APPLY_LANGUAGES.find((l) => l.code === base);
    if (match) return match.code;
  }
  return DEFAULT_LANGUAGE;
}
