import type { AppLocale } from "./config";
import type { Messages } from "./messages";

// Typsichere Schlüssel: t("jobs.title") ist ein Fehler, wenn der Schlüssel fehlt.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: Messages;
  }
}
