import "server-only";

import { eq } from "drizzle-orm";

import { db, funnelEvents, jobs, organization } from "@harly/db";
import { getPublicWorkspaceSlug } from "@/lib/public-workspace";

import {
  normalizeSource,
  type BrowserFunnelEventInput,
  type FunnelEventType,
} from "./events";

type RecordInput = {
  eventType: FunnelEventType;
  sessionId: string;
  jobId?: string | null;
  applicationId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  metadata?: BrowserFunnelEventInput["metadata"];
};

/** Arbeitsbereich zur Stelle – bzw. der öffentliche Arbeitsbereich ohne Stelle. */
async function resolveWorkspaceId(jobId?: string | null): Promise<string | null> {
  if (jobId) {
    const [job] = await db
      .select({ workspaceId: jobs.workspaceId })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    return job?.workspaceId ?? null;
  }
  const slug = await getPublicWorkspaceSlug();
  if (!slug) return null;
  const [workspace] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);
  return workspace?.id ?? null;
}

/**
 * Speichert ein anonymes Funnel-Ereignis. Keine IP, kein User-Agent, keine
 * personenbezogenen Daten (PRD v2 §9.2). Gibt false zurück, wenn die Stelle
 * unbekannt ist – Tracking darf nie eine Bewerbung verhindern.
 */
export async function recordFunnelEvent(input: RecordInput): Promise<boolean> {
  const workspaceId = await resolveWorkspaceId(input.jobId);
  if (!workspaceId) return false;
  await db.insert(funnelEvents).values({
    workspaceId,
    sessionId: input.sessionId,
    jobId: input.jobId ?? null,
    applicationId: input.applicationId ?? null,
    eventType: input.eventType,
    utmSource: normalizeSource(input.utmSource, input.utmMedium),
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    metadata: input.metadata ?? null,
  });
  return true;
}
