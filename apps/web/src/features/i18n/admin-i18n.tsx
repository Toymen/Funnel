"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  ADMIN_LOCALE_COOKIE,
  translateAdmin,
  type AdminLocale,
} from "./admin-messages";

export {
  isAdminLocale,
  translateAdmin,
  type AdminLocale,
  type AdminMessage,
} from "./admin-messages";

type AdminI18nValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (message: string) => string;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

export function AdminI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: AdminLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<AdminI18nValue>(() => {
    const setLocale = (nextLocale: AdminLocale) => {
      document.cookie = `${ADMIN_LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setLocaleState(nextLocale);
    };
    return {
      locale,
      setLocale,
      t: (message) => translateAdmin(locale, message),
    };
  }, [locale]);

  return <AdminI18nContext value={value}>{children}</AdminI18nContext>;
}

export function useAdminI18n() {
  const value = useContext(AdminI18nContext);
  if (!value)
    throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  return value;
}
