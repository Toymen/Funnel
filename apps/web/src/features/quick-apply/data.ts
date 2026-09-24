import "server-only";

import { db, jobQuickApply, type QuickApplyLocalization } from "@harly/db";
import { eq } from "drizzle-orm";

import { normalizeJobApplicationConfig } from "@/features/jobs/config";
import { getPublicJobDetail } from "@/features/jobs/data";
import { getPublicWorkspaceSlug } from "@/lib/public-workspace";

import type { QuickApplyLanguage } from "./languages";

export type QuickApplyQuestion = {
  id: string;
  label: string;
  /** yesno = große Ja/Nein-Karten; choice = Auswahlkarten; text = kurzes Textfeld */
  kind: "yesno" | "choice" | "text";
  required: boolean;
  /** Original-Optionen (werden so an Harly übermittelt) mit übersetzten Anzeigen. */
  options: { value: string; label: string }[];
};

export type QuickApplyJob = {
  jobId: string;
  slug: string;
  workspaceSlug: string;
  title: string;
  summary: string | null;
  highlights: string[];
  icon: string;
  payLabel: string | null;
  hoursLabel: string | null;
  location: string | null;
  questions: QuickApplyQuestion[];
  legalConfigured: boolean;
  consentText: string | null;
  privacyHref: string | null;
};

const YES = /^(ja|yes|tak|da|так|да|evet|نعم)$/i;
const NO = /^(nein|no|nie|nu|ні|нет|hayır|لا)$/i;

function isYesNo(options: readonly string[] | undefined): boolean {
  return options?.length === 2 && options.some((o) => YES.test(o)) && options.some((o) => NO.test(o));
}

function formatPay(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryPeriod: string | null;
}): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const money = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: job.currency ?? "EUR",
    maximumFractionDigits: 0,
  });
  const period = job.salaryPeriod === "annual" ? " / Jahr" : " / Monat";
  if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax) {
    return `${money.format(job.salaryMin)}–${money.format(job.salaryMax)}${period}`;
  }
  return `ab ${money.format((job.salaryMin ?? job.salaryMax)!)}${period}`;
}

/** Übersetzung mit Fallback: Leichte Sprache → Deutsch-Original. */
function pick(
  localizations: Record<string, QuickApplyLocalization>,
  language: QuickApplyLanguage,
): QuickApplyLocalization {
  return localizations[language] ?? {};
}

/**
 * Lädt eine veröffentlichte Stelle für die 60-Sekunden-Bewerbung inkl.
 * Übersetzungen aus job_quick_apply (PRD v2 §5.3, §12).
 */
export async function getQuickApplyJob(
  jobSlug: string,
  language: QuickApplyLanguage,
): Promise<QuickApplyJob | null> {
  const workspaceSlug = await getPublicWorkspaceSlug();
  if (!workspaceSlug) return null;
  const detail = await getPublicJobDetail({ jobSlug, workspaceSlug });
  if (!detail) return null;
  const { job, workspace } = detail;

  const [settings] = await db
    .select()
    .from(jobQuickApply)
    .where(eq(jobQuickApply.jobId, job.id))
    .limit(1);
  if (settings && !settings.enabled) return null;

  const l10n = pick(settings?.localizations ?? {}, language);
  const config = normalizeJobApplicationConfig(job.applicationConfig);

  const questions: QuickApplyQuestion[] = config.questions.map((q) => {
    const label = l10n.questions?.[q.id] ?? q.label;
    const optionLabels = l10n.options?.[q.id] ?? {};
    const options = (q.options ?? []).map((value) => ({ value, label: optionLabels[value] ?? value }));
    return {
      id: q.id,
      label,
      kind: q.type === "select" ? (isYesNo(q.options) ? "yesno" : "choice") : "text",
      required: q.required,
      options,
    };
  });

  return {
    jobId: job.id,
    slug: job.slug,
    workspaceSlug,
    title: l10n.title ?? job.title,
    summary: l10n.summary ?? null,
    highlights: l10n.highlights ?? [],
    icon: settings?.icon ?? "truck",
    payLabel: settings?.payLabel ?? formatPay(job),
    hoursLabel: settings?.hoursLabel ?? null,
    location: job.location,
    questions,
    legalConfigured: workspace.legalConfigured,
    consentText: workspace.consentCheckboxText,
    privacyHref: workspace.legalPages?.["privacy-policy"] ? "/legal/privacy-policy" : null,
  };
}
