"use server";

import { headers } from "next/headers";
import { applications, candidateFiles, db } from "@harly/db";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createPublicApplication } from "@/features/applications/data";
import { sendApplicationReceivedEmails } from "@/features/applications/notifications";
import { recordFunnelEvent } from "@/features/funnel/record";
import { getServerLogger } from "@/lib/logger";
import { privateResumeFileUrl } from "@/lib/resume/storage-key";
import { storage } from "@/lib/storage";
import { createResumeStorageKey } from "@/lib/storage-validation";
import { clientIp, enforceRateLimit } from "@/server/api/ratelimit";

import { getQuickApplyJob } from "./data";
import { isQuickApplyLanguage } from "./languages";
import { placeholderEmailForPhone, quickApplicationSchema } from "./schema";

export type QuickApplyErrorKey =
  | "errorFirstName"
  | "errorContact"
  | "errorPhone"
  | "errorEmail"
  | "errorPrivacy"
  | "errorGeneric"
  | "errorTooMany"
  | "errorDuplicate"
  | "errorUpload";

export type QuickApplyResult =
  | { ok: true; applicationId: string; uploadToken: string }
  | { ok: false; error: QuickApplyErrorKey };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

type DetectedFile = { mime: string; ext: string; kind: "voice" | "document" };

/** Dateityp anhand der ersten Bytes – der Browser-Angabe wird nicht vertraut. */
function detectFile(bytes: Buffer): DetectedFile | null {
  const at = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (at([0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: "application/pdf", ext: "pdf", kind: "document" };
  if (at([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg", kind: "document" };
  if (at([0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", ext: "png", kind: "document" };
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8))
    return { mime: "image/webp", ext: "webp", kind: "document" };
  if (at([0x1a, 0x45, 0xdf, 0xa3])) return { mime: "audio/webm", ext: "webm", kind: "voice" };
  if (at([0x4f, 0x67, 0x67, 0x53])) return { mime: "audio/ogg", ext: "ogg", kind: "voice" };
  if (at([0x66, 0x74, 0x79, 0x70], 4)) return { mime: "audio/mp4", ext: "m4a", kind: "voice" };
  return null;
}

function signingKey(): string {
  const key = process.env.STORAGE_UPLOAD_SECRET ?? process.env.AI_ENCRYPTION_KEY;
  if (!key) throw new Error("STORAGE_UPLOAD_SECRET is required for quick-apply uploads.");
  return key;
}

function signUpload(applicationId: string, expiresAt: number): string {
  const payload = `${applicationId}.${expiresAt}`;
  const signature = createHmac("sha256", signingKey()).update(`quick-apply:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyUpload(token: string, applicationId: string): boolean {
  const [id, expires, signature] = token.split(".");
  if (!id || !expires || !signature || id !== applicationId || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(signUpload(id, Number(expires)).split(".")[2]);
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Textfeld aus FormData; Dateien oder fehlende Felder ergeben `fallback`. */
function formText(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

async function remoteIp(): Promise<string> {
  const h = await headers();
  return clientIp({
    headers: new Headers({
      "x-forwarded-for": h.get("x-forwarded-for") ?? "",
      "x-real-ip": h.get("x-real-ip") ?? "",
    }),
  } as Request);
}

async function storeFile(input: {
  workspaceId: string;
  candidateId: string;
  file: File;
  fileName: string;
}): Promise<DetectedFile | null> {
  if (input.file.size <= 0 || input.file.size > MAX_FILE_SIZE) return null;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const detected = detectFile(bytes.subarray(0, 16));
  if (!detected) return null;
  const key = createResumeStorageKey(input.workspaceId, `${input.fileName}.${detected.ext}`);
  await storage.put(key, bytes, detected.mime);
  await db.insert(candidateFiles).values({
    workspaceId: input.workspaceId,
    candidateId: input.candidateId,
    fileName: `${input.fileName}.${detected.ext}`,
    fileUrl: privateResumeFileUrl(key),
    fileType: detected.mime,
    fileSize: bytes.length,
    uploadedById: null,
  });
  return detected;
}

function errorFromIssues(issues: { message: string }[]): QuickApplyErrorKey {
  const first = issues[0]?.message;
  switch (first) {
    case "firstName":
      return "errorFirstName";
    case "contact":
      return "errorContact";
    case "phone":
      return "errorPhone";
    case "email":
      return "errorEmail";
    case "privacy":
      return "errorPrivacy";
    default:
      return "errorGeneric";
  }
}

/**
 * Nimmt eine 60-Sekunden-Bewerbung an (PRD v2 §5.2) und legt sie als normale
 * Harly-Bewerbung an – mit Sprache, Modus und Rückrufzeit im Snapshot.
 */
export async function submitQuickApplicationAction(formData: FormData): Promise<QuickApplyResult> {
  const logger = getServerLogger();
  const ip = await remoteIp();
  try {
    await enforceRateLimit(`public:quick-apply:${ip}`, { limit: 5, windowMs: 60_000 });
  } catch {
    return { ok: false, error: "errorTooMany" };
  }

  let answers: Record<string, string> = {};
  try {
    answers = JSON.parse(formText(formData, "answers", "{}")) as Record<string, string>;
  } catch {
    answers = {};
  }
  const parsed = quickApplicationSchema.safeParse({
    jobSlug: formData.get("jobSlug"),
    sessionId: formData.get("sessionId"),
    language: formData.get("language"),
    mode: formData.get("mode"),
    firstName: formData.get("firstName"),
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    callbackWindow: formData.get("callbackWindow") || undefined,
    answers,
    consent: formData.get("consent") === "true",
    utmSource: formData.get("utmSource") ?? undefined,
    utmMedium: formData.get("utmMedium") ?? undefined,
    utmCampaign: formData.get("utmCampaign") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: errorFromIssues(parsed.error.issues) };
  const input = parsed.data;
  if (!isQuickApplyLanguage(input.language)) return { ok: false, error: "errorGeneric" };

  const job = await getQuickApplyJob(input.jobSlug, input.language);
  if (!job) return { ok: false, error: "errorGeneric" };

  // Nur Antworten auf bekannte Fragen, Pflichtfragen dürfen leer bleiben – HR fragt nach.
  const questionAnswers = Object.fromEntries(
    job.questions.map((q) => [q.id, (input.answers[q.id] ?? "").slice(0, 500)]),
  );

  const email = input.email?.toLowerCase() ?? placeholderEmailForPhone(input.phone!);
  const source = input.utmMedium?.toLowerCase() === "qr" ? "qr" : (input.utmSource ?? "quick_apply");

  const result = await createPublicApplication(
    { jobSlug: job.slug, workspaceSlug: job.workspaceSlug },
    {
      firstName: input.firstName,
      lastName: "",
      email,
      phone: input.phone,
      address: undefined,
      location: undefined,
      headline: undefined,
      photoUrl: undefined,
      linkedinUrl: undefined,
      githubUrl: undefined,
      websiteUrl: undefined,
      coverLetter: undefined,
      educationEntries: [],
      experienceEntries: [],
      resumeUrl: undefined,
      resumeKey: undefined,
      resumeFileName: undefined,
      resumeFileType: undefined,
      resumeFileSize: undefined,
      questionAnswers,
      skills: [],
      experienceYears: undefined,
    },
    {
      // Einwilligung ist Pflicht (Schema); Nachweis mit Workspace-Text (DSGVO Art. 7).
      consent: {
        consentText: job.consentText ?? "Einwilligung zur Verarbeitung meiner Bewerbungsdaten",
        ipAddress: ip,
        userAgent: (await headers()).get("user-agent"),
      },
      source,
      allowMissingResume: true,
      snapshotExtra: {
        quickApply: {
          language: input.language,
          mode: input.mode,
          callbackWindow: input.callbackWindow ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
        },
      },
    },
  );

  if (!result.ok) {
    return { ok: false, error: /already applied/i.test(result.message) ? "errorDuplicate" : "errorGeneric" };
  }

  const voice = formData.get("voice");
  if (voice instanceof File && voice.size > 0) {
    await storeFile({
      workspaceId: result.email.workspaceId,
      candidateId: result.candidateId,
      file: voice,
      fileName: "sprachnachricht",
    }).catch((error: unknown) => logger.warn({ error, applicationId: result.applicationId }, "voice upload failed"));
  }

  await sendApplicationReceivedEmails(result.email).catch((error: unknown) =>
    logger.warn({ error, applicationId: result.applicationId }, "application emails failed"),
  );
  await recordFunnelEvent({
    eventType: "application_submitted",
    sessionId: input.sessionId,
    jobId: job.jobId,
    applicationId: result.applicationId,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    metadata: { mode: input.mode, language: input.language },
  }).catch(() => false);

  // Nur IDs loggen – keine Bewerberdaten (PRD v1 §44).
  logger.info({ applicationId: result.applicationId, mode: input.mode }, "quick application created");
  return {
    ok: true,
    applicationId: result.applicationId,
    uploadToken: signUpload(result.applicationId, Date.now() + UPLOAD_WINDOW_MS),
  };
}

/** Optionaler Upload nach dem Absenden (Führerschein-Foto, Lebenslauf). */
export async function uploadQuickApplicationFileAction(formData: FormData): Promise<{ ok: boolean }> {
  const applicationId = formText(formData, "applicationId");
  const token = formText(formData, "uploadToken");
  const file = formData.get("file");
  if (!(file instanceof File) || !verifyUpload(token, applicationId)) return { ok: false };
  try {
    await enforceRateLimit(`public:quick-apply-upload:${applicationId}`, { limit: 10, windowMs: UPLOAD_WINDOW_MS });
  } catch {
    return { ok: false };
  }
  const [application] = await db
    .select({ workspaceId: applications.workspaceId, candidateId: applications.candidateId })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) return { ok: false };
  const stored = await storeFile({
    workspaceId: application.workspaceId,
    candidateId: application.candidateId,
    file,
    fileName: "nachweis",
  }).catch(() => null);
  return { ok: Boolean(stored) };
}
