/**
 * next-intl in Vitest: Außerhalb einer Next.js-Anfrage gibt es keine
 * Request-Konfiguration. Server-Actions und Server-Komponenten, die
 * getTranslations() & Co. nutzen, bekommen hier die englischen Texte – so
 * bleiben bestehende Tests mit englischen Erwartungen gültig.
 * Client-Komponenten in Tests mit withIntl() aus src/i18n/test-utils.tsx rendern.
 */
import { createFormatter, createTranslator } from "next-intl";
import type * as NextIntlServer from "next-intl/server";
import { vi } from "vitest";

import { TIME_ZONE } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";

const TEST_LOCALE = "en" as const;

vi.mock("next-intl/server", async (importOriginal) => {
  const actual = await importOriginal<typeof NextIntlServer>();
  return {
    ...actual,
    getLocale: () => Promise.resolve(TEST_LOCALE),
    getTimeZone: () => Promise.resolve(TIME_ZONE),
    getMessages: () => Promise.resolve(MESSAGES[TEST_LOCALE]),
    getTranslations: (
      arg?: string | { namespace?: string; locale?: string },
    ) => {
      const namespace = typeof arg === "string" ? arg : arg?.namespace;
      return Promise.resolve(
        createTranslator({
          locale: TEST_LOCALE,
          messages: MESSAGES[TEST_LOCALE],
          // Namespace-Typen prüft TypeScript im App-Code; hier nur durchreichen.
          namespace: namespace as never,
        }),
      );
    },
    getFormatter: () =>
      Promise.resolve(
        createFormatter({ locale: TEST_LOCALE, timeZone: TIME_ZONE }),
      ),
  };
});
