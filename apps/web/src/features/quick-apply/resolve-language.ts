import "server-only";

import { headers } from "next/headers";

import { isQuickApplyLanguage, suggestLanguage, type QuickApplyLanguage } from "./languages";

/**
 * Sprache für die Bewerberseiten: ?lang=… hat Vorrang, sonst Vorschlag aus
 * Accept-Language (PRD v2 §5.3). `explicit` zeigt an, ob gewählt wurde.
 */
export async function resolveQuickApplyLanguage(
  lang: string | undefined,
): Promise<{ language: QuickApplyLanguage; explicit: boolean }> {
  if (isQuickApplyLanguage(lang)) return { language: lang, explicit: true };
  const acceptLanguage = (await headers()).get("accept-language");
  return { language: suggestLanguage(acceptLanguage), explicit: false };
}
