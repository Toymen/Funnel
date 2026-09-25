import { cookies } from "next/headers";

import {
  ADMIN_LOCALE_COOKIE,
  isAdminLocale,
  translateAdmin,
  type AdminLocale,
} from "./admin-messages";

export async function getAdminLocale(): Promise<AdminLocale> {
  const saved = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(saved) ? saved : "de";
}

/**
 * Server-component counterpart to `useAdminI18n().t`. Client components use the
 * hook instead, so switching locale re-renders them without a reload.
 */
export async function getAdminT() {
  const locale = await getAdminLocale();
  return (message: string) => translateAdmin(locale, message);
}
