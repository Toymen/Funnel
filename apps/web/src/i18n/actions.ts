"use server";

import { cookies } from "next/headers";

import { isAppLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./config";

/** Speichert die gewählte Sprache im Cookie; der Client lädt danach neu (router.refresh). */
export async function setLocaleAction(
  locale: string,
): Promise<{ ok: boolean }> {
  if (!isAppLocale(locale)) return { ok: false };
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}
