/**
 * Logik für Ein-Tipp-Kontakt und Kurzbewerbungs-Badges im HR-Bereich
 * (PRD §11 und §11.1). Reine Funktionen ohne React, damit sie getestet werden können.
 *
 * Die Daten stammen aus `applications.snapshot.quickApply`
 * (siehe features/quick-apply/actions.ts).
 */
import {
  isQuickApplyLanguage,
  languageInfo,
  type QuickApplyLanguage,
} from "@/features/quick-apply/languages";
import { isPlaceholderEmail } from "@/features/quick-apply/schema";

export const QUICK_APPLY_MODES = ["quick", "callback", "voice"] as const;
export type QuickApplyMode = (typeof QUICK_APPLY_MODES)[number];

export const CALLBACK_WINDOWS = [
  "morning",
  "midday",
  "afternoon",
  "evening",
  "anytime",
] as const;
export type CallbackWindow = (typeof CALLBACK_WINDOWS)[number];

export type QuickApplyInfo = {
  language: QuickApplyLanguage | null;
  mode: QuickApplyMode | null;
  callbackWindow: CallbackWindow | null;
};

/** HR-Texte (Deutsch). Zentral, damit die Komponenten keine Klartexte verstreuen. */
export const MOBILE_ADMIN_TEXT = {
  contactHeading: "Kontakt",
  call: "Anrufen",
  sms: "SMS",
  email: "E-Mail",
  callAria: (name: string) => `${name} anrufen`,
  smsAria: (name: string) => `SMS an ${name} schreiben`,
  emailAria: (name: string) => `E-Mail an ${name} schreiben`,
  contactBarLabel: "Schnellkontakt",
  anonymized:
    "Kontaktdaten sind anonymisiert. Zum Anrufen die Identität oben freigeben.",
  noContact: "Keine Telefonnummer oder E-Mail-Adresse hinterlegt.",
  badgesLabel: "Kurzbewerbung",
  languagePrefix: "Sprache: ",
  mode: {
    quick: "Kurzbewerbung",
    callback: "Rückruf gewünscht",
    voice: "Sprachnachricht",
  } satisfies Record<QuickApplyMode, string>,
  callbackWindow: {
    morning: "morgens",
    midday: "mittags",
    afternoon: "nachmittags",
    evening: "abends",
    anytime: "jederzeit",
  } satisfies Record<CallbackWindow, string>,
  callbackHint: (window: string) => `Bitte ${window} anrufen`,
  stageSelect: (name: string) => `Stufe für ${name} ändern`,
  stageColumns: "Stufen",
  stageColumnsHint: "Zum Blättern wischen",
  emptyStage: "Keine Bewerbungen in dieser Stufe",
  stageCount: (name: string, count: number) =>
    `${name}, ${count} ${count === 1 ? "Bewerbung" : "Bewerbungen"}`,
} as const;

function isMode(value: unknown): value is QuickApplyMode {
  return QUICK_APPLY_MODES.includes(value as QuickApplyMode);
}

function isCallbackWindow(value: unknown): value is CallbackWindow {
  return CALLBACK_WINDOWS.includes(value as CallbackWindow);
}

/**
 * Liest `snapshot.quickApply` defensiv. Gibt `null` zurück, wenn es keine
 * Kurzbewerbung ist oder die Daten unbrauchbar sind.
 */
export function parseQuickApply(value: unknown): QuickApplyInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const info: QuickApplyInfo = {
    language: isQuickApplyLanguage(raw.language) ? raw.language : null,
    mode: isMode(raw.mode) ? raw.mode : null,
    callbackWindow: isCallbackWindow(raw.callbackWindow)
      ? raw.callbackWindow
      : null,
  };
  if (!info.language && !info.mode) return null;
  return info;
}

export function languageLabel(code: QuickApplyLanguage): string {
  return languageInfo(code).name;
}

/** Text des Modus-Badges, bei Rückruf inklusive Zeitfenster. */
export function modeLabel(
  info: Pick<QuickApplyInfo, "mode" | "callbackWindow">,
): string | null {
  if (!info.mode) return null;
  const base = MOBILE_ADMIN_TEXT.mode[info.mode];
  if (info.mode === "callback" && info.callbackWindow) {
    return `${base} · ${MOBILE_ADMIN_TEXT.callbackWindow[info.callbackWindow]}`;
  }
  return base;
}

/**
 * Wandelt eine eingegebene Telefonnummer in eine wählbare Form für tel:/sms: um.
 * Leerzeichen, Klammern, Punkte, Schrägstriche und Bindestriche fallen weg,
 * „00“ am Anfang wird zu „+“. Gibt `null` zurück, wenn zu wenige Ziffern übrig bleiben.
 */
export function dialableNumber(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const plus = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 5 || digits.length > 16) return null;
  return plus ? `+${digits}` : digits;
}

/** Echte, zustellbare E-Mail-Adresse – keine Platzhalter aus der Kurzbewerbung. */
export function contactEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed || isPlaceholderEmail(trimmed)) return null;
  // Bewusst einfach: genau ein @, Punkt in der Domain, keine Leerzeichen.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export type ContactActionKind = "call" | "sms" | "email";

export type ContactAction = {
  kind: ContactActionKind;
  href: string;
  label: string;
  ariaLabel: string;
  /** Hervorgehobene Hauptaktion (genau eine, falls überhaupt Aktionen existieren). */
  primary: boolean;
};

export type ContactInput = {
  name: string;
  phone: string | null | undefined;
  email: string | null | undefined;
  quickApply?: QuickApplyInfo | null;
};

/**
 * Welche Ein-Tipp-Aktionen erscheinen:
 * - Telefonnummer vorhanden → „Anrufen“ (tel:) und „SMS“ (sms:)
 * - echte E-Mail vorhanden → „E-Mail“ (mailto:), Platzhalter nie
 * Hauptaktion ist „Anrufen“, sobald es eine Nummer gibt (Kurzbewerbungen haben
 * meist nur die Nummer, Rückrufwunsch erst recht), sonst „E-Mail“.
 */
export function contactActions(input: ContactInput): ContactAction[] {
  const actions: ContactAction[] = [];
  const number = dialableNumber(input.phone);
  const email = contactEmail(input.email);
  const name = input.name.trim() || "Bewerber/in";

  if (number) {
    actions.push({
      kind: "call",
      href: `tel:${number}`,
      label: MOBILE_ADMIN_TEXT.call,
      ariaLabel: MOBILE_ADMIN_TEXT.callAria(name),
      primary: true,
    });
    actions.push({
      kind: "sms",
      href: `sms:${number}`,
      label: MOBILE_ADMIN_TEXT.sms,
      ariaLabel: MOBILE_ADMIN_TEXT.smsAria(name),
      primary: false,
    });
  }
  if (email) {
    actions.push({
      kind: "email",
      href: `mailto:${email}`,
      label: MOBILE_ADMIN_TEXT.email,
      ariaLabel: MOBILE_ADMIN_TEXT.emailAria(name),
      primary: !number,
    });
  }
  return actions;
}
