import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import { type AppLocale, TIME_ZONE } from "./config";
import { MESSAGES } from "./messages";

/**
 * Für Tests mit renderToStaticMarkup: stellt Übersetzungen bereit wie das
 * Root-Layout in der App.
 */
export function withIntl(node: ReactNode, locale: AppLocale = "de") {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone={TIME_ZONE}
    >
      {node}
    </NextIntlClientProvider>
  );
}
