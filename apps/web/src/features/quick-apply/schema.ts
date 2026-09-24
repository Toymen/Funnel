import { z } from "zod";

import { QUICK_APPLY_LANGUAGES } from "./languages";

const languageCodes = QUICK_APPLY_LANGUAGES.map((l) => l.code) as [string, ...string[]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

/** Telefonnummer: tolerant, nur Ziffern, Leerzeichen und + / - ( ). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9][0-9 ()/-]{5,24}$/, "phone");

/**
 * Eingaben der 60-Sekunden-Bewerbung (PRD v2 §5.1 Nr. 4):
 * Pflicht sind nur Vorname und Telefon ODER E-Mail.
 */
export const quickApplicationSchema = z
  .object({
    jobSlug: z.string().trim().min(1).max(200),
    sessionId: z.string().uuid(),
    language: z.enum(languageCodes),
    mode: z.enum(["quick", "callback", "voice"]),
    firstName: z.string().trim().min(1, "firstName").max(100),
    phone: optionalText(40).pipe(phoneSchema.optional()),
    email: optionalText(200).pipe(z.string().email("email").optional()),
    callbackWindow: z.enum(["morning", "midday", "afternoon", "evening", "anytime"]).optional(),
    answers: z.record(z.string().max(120), z.string().max(500)).default({}),
    consent: z.literal(true, { message: "privacy" }),
    utmSource: optionalText(100),
    utmMedium: optionalText(100),
    utmCampaign: optionalText(100),
  })
  .refine((v) => v.phone || v.email, { message: "contact", path: ["phone"] })
  .refine((v) => v.mode !== "callback" || v.phone, { message: "phone", path: ["phone"] });

export type QuickApplicationInput = z.input<typeof quickApplicationSchema>;

/**
 * Platzhalter-E-Mail für Bewerbungen nur mit Telefonnummer. Harly verlangt eine
 * E-Mail je Kandidat; die reservierte TLD .invalid (RFC 2606) stellt sicher,
 * dass niemals eine Mail zugestellt wird. Gleiche Nummer → gleicher Kandidat.
 */
export function placeholderEmailForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "").replace(/^0/, "49");
  return `tel-${digits}@kurzbewerbung.invalid`;
}

export function isPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@kurzbewerbung.invalid");
}
