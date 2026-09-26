import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  type AppLocale,
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  negotiateLocale,
  TIME_ZONE,
} from "./config";
import { MESSAGES } from "./messages";

/** Cookie (eigene Wahl) → Accept-Language → Deutsch. */
export async function resolveRequestLocale(): Promise<AppLocale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;
  try {
    return negotiateLocale((await headers()).get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale();
  return {
    locale,
    messages: MESSAGES[locale],
    timeZone: TIME_ZONE,
  };
});
