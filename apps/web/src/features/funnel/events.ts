import { z } from "zod";

/**
 * Funnel-Ereignisse (PRD v2 §9.1). Browser-Ereignisse sind anonym; Server-
 * Ereignisse entstehen beim Absenden bzw. bei HR-Statuswechseln.
 */
export const BROWSER_FUNNEL_EVENTS = [
  "page_view",
  "job_view",
  "language_selected",
  "application_started",
  "quick_apply_chosen",
  "callback_requested",
  "voice_recorded",
  "step_viewed",
  "application_step_completed",
] as const;

export const SERVER_FUNNEL_EVENTS = [
  "application_submitted",
  "candidate_reviewed",
  "candidate_contacted",
  "interview_scheduled",
  "interview_completed",
  "offer_created",
  "hired",
  "rejected",
  "withdrawn",
] as const;

export type BrowserFunnelEvent = (typeof BROWSER_FUNNEL_EVENTS)[number];
export type ServerFunnelEvent = (typeof SERVER_FUNNEL_EVENTS)[number];
export type FunnelEventType = BrowserFunnelEvent | ServerFunnelEvent;

const utmValue = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value ? value : undefined));

export const browserFunnelEventSchema = z.object({
  eventType: z.enum(BROWSER_FUNNEL_EVENTS),
  sessionId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  utmSource: utmValue,
  utmMedium: utmValue,
  utmCampaign: utmValue,
  metadata: z
    .record(
      z.string().max(40),
      z.union([z.string().max(100), z.number(), z.boolean()]),
    )
    .refine((value) => Object.keys(value).length <= 10, "Too many metadata keys.")
    .optional(),
});

export type BrowserFunnelEventInput = z.input<typeof browserFunnelEventSchema>;

/** Bekannte Quellen (PRD v1 §20) – alles andere wird gekürzt übernommen. */
const SOURCE_ALIASES: Record<string, string> = {
  google: "google",
  facebook: "facebook",
  fb: "facebook",
  instagram: "instagram",
  ig: "instagram",
  indeed: "indeed",
  arbeitsagentur: "arbeitsagentur",
  "bier-schneider.de": "bier-schneider.de",
  website: "bier-schneider.de",
  empfehlung: "empfehlung",
  referral: "empfehlung",
};

/** Normalisiert die Traffic-Quelle. QR-Codes erkennt man an utm_medium=qr. */
export function normalizeSource(source?: string | null, medium?: string | null): string {
  if (medium?.trim().toLowerCase() === "qr") return "qr";
  const value = source?.trim().toLowerCase();
  if (!value) return "direkt";
  return SOURCE_ALIASES[value] ?? (value.replace(/[^a-z0-9._-]/g, "").slice(0, 50) || "sonstige");
}
