import "server-only";

import {
  applicationQuestions,
  applications,
  applicationStageHistory,
  db,
  funnelEvents,
  jobs,
  jobStages,
} from "@harly/db";
import { and, asc, eq, gte, inArray, isNull, type SQL,sql } from "drizzle-orm";

import { requirePermission } from "@/features/workspaces/permissions-server";

import { normalizeSource } from "./events";
import {
  biggestDropOff,
  computeFunnel,
  type FunnelStage,
  type FunnelStageKey,
  percent,
  stageKeyForPipelineStage,
} from "./metrics";
import { type FunnelRange,rangeStart } from "./ranges";

export type FunnelReportData = {
  range: FunnelRange;
  jobId: string | null;
  jobs: { id: string; title: string }[];
  stages: FunnelStage[];
  leak: FunnelStage | null;
  steps: { step: string; sessions: number; fromFirst: number | null }[];
  /** Fragetexte je Fragen-Schlüssel für die Drop-off-Anzeige. */
  questionLabels: Record<string, string>;
  sources: { source: string; views: number; applications: number; conversion: number | null }[];
  comparison: {
    jobId: string;
    title: string;
    views: number;
    applications: number;
    conversion: number | null;
    hires: number;
  }[];
};

/**
 * Funnel-Report (PRD v2 §10). Browser-Stufen zählen eindeutige Sessions aus
 * funnel_events, Bewerbungen kommen aus Harlys applications-Tabelle (auch
 * Bewerbungen über das ausführliche Formular), spätere Stufen aus der
 * Pipeline-Historie.
 */
export async function getFunnelReport(input: {
  range: FunnelRange;
  jobId?: string | null;
}): Promise<FunnelReportData> {
  const { organization } = await requirePermission("reports:read");
  const workspaceId = organization.id;
  const since = rangeStart(input.range);

  const jobList = await db
    .select({ id: jobs.id, title: jobs.title })
    .from(jobs)
    .where(and(eq(jobs.workspaceId, workspaceId), isNull(jobs.deletedAt)))
    .orderBy(asc(jobs.title));
  const jobId = input.jobId && jobList.some((j) => j.id === input.jobId) ? input.jobId : null;

  const eventWhere: SQL[] = [eq(funnelEvents.workspaceId, workspaceId), gte(funnelEvents.createdAt, since)];
  if (jobId) eventWhere.push(eq(funnelEvents.jobId, jobId));
  const appWhere: SQL[] = [eq(applications.workspaceId, workspaceId), gte(applications.appliedAt, since)];
  if (jobId) appWhere.push(eq(applications.jobId, jobId));

  const [eventCounts, appRows, stageRows, stepRows, sourceViewRows, comparisonViews, comparisonApps, questionRows] =
    await Promise.all([
      db
        .select({
          eventType: funnelEvents.eventType,
          sessions: sql<number>`count(distinct ${funnelEvents.sessionId})::int`,
        })
        .from(funnelEvents)
        .where(and(...eventWhere, inArray(funnelEvents.eventType, ["job_view", "application_started"])))
        .groupBy(funnelEvents.eventType),
      db
        .select({ id: applications.id, status: applications.status, source: applications.source })
        .from(applications)
        .where(and(...appWhere)),
      db
        .selectDistinct({ applicationId: applicationStageHistory.applicationId, stageName: jobStages.name })
        .from(applicationStageHistory)
        .innerJoin(applications, eq(applications.id, applicationStageHistory.applicationId))
        .innerJoin(jobStages, eq(jobStages.id, applicationStageHistory.toStageId))
        .where(and(...appWhere)),
      db
        .select({
          step: sql<string>`${funnelEvents.metadata}->>'step'`,
          stepIndex: sql<number>`min((${funnelEvents.metadata}->>'stepIndex')::int)`,
          sessions: sql<number>`count(distinct ${funnelEvents.sessionId})::int`,
        })
        .from(funnelEvents)
        .where(and(...eventWhere, eq(funnelEvents.eventType, "step_viewed")))
        .groupBy(sql`${funnelEvents.metadata}->>'step'`),
      db
        .select({
          source: sql<string>`coalesce(${funnelEvents.utmSource}, 'direkt')`,
          views: sql<number>`count(distinct ${funnelEvents.sessionId})::int`,
        })
        .from(funnelEvents)
        .where(and(...eventWhere, eq(funnelEvents.eventType, "job_view")))
        .groupBy(sql`coalesce(${funnelEvents.utmSource}, 'direkt')`),
      db
        .select({
          jobId: funnelEvents.jobId,
          views: sql<number>`count(distinct ${funnelEvents.sessionId})::int`,
        })
        .from(funnelEvents)
        .where(
          and(
            eq(funnelEvents.workspaceId, workspaceId),
            gte(funnelEvents.createdAt, since),
            eq(funnelEvents.eventType, "job_view"),
          ),
        )
        .groupBy(funnelEvents.jobId),
      db
        .select({
          jobId: applications.jobId,
          applications: sql<number>`count(*)::int`,
          hires: sql<number>`count(*) filter (where ${applications.status} = 'hired')::int`,
        })
        .from(applications)
        .where(and(eq(applications.workspaceId, workspaceId), gte(applications.appliedAt, since)))
        .groupBy(applications.jobId),
      db
        .select({ key: applicationQuestions.key, label: applicationQuestions.label })
        .from(applicationQuestions)
        .where(
          and(
            eq(applicationQuestions.workspaceId, workspaceId),
            jobId ? eq(applicationQuestions.jobId, jobId) : undefined,
          ),
        ),
    ]);

  // Spätere Stufen: Bewerbung hat die Stufe irgendwann erreicht.
  const reached: Record<"interview" | "offer" | "hired", Set<string>> = {
    interview: new Set(),
    offer: new Set(),
    hired: new Set(),
  };
  for (const row of stageRows) {
    const key = stageKeyForPipelineStage(row.stageName);
    if (key) reached[key].add(row.applicationId);
  }
  for (const app of appRows) {
    if (app.status === "hired") reached.hired.add(app.id);
  }
  // Wer eingestellt wurde, hatte auch Angebot und Gespräch.
  for (const id of reached.hired) reached.offer.add(id);
  for (const id of reached.offer) reached.interview.add(id);

  const sessions = new Map(eventCounts.map((r) => [r.eventType, r.sessions]));
  const counts: Record<FunnelStageKey, number> = {
    job_view: sessions.get("job_view") ?? 0,
    application_started: sessions.get("application_started") ?? 0,
    application_submitted: appRows.length,
    interview: reached.interview.size,
    offer: reached.offer.size,
    hired: reached.hired.size,
  };
  const stages = computeFunnel(counts);

  const steps = stepRows
    .filter((s) => s.step)
    .sort((a, b) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
  const firstStep = steps[0]?.sessions ?? 0;

  const appsBySource = new Map<string, number>();
  for (const app of appRows) {
    const source = app.source === "public_form" || !app.source ? "direkt" : normalizeSource(app.source);
    appsBySource.set(source, (appsBySource.get(source) ?? 0) + 1);
  }
  const sourceKeys = new Set([...sourceViewRows.map((r) => r.source), ...appsBySource.keys()]);
  const sources = [...sourceKeys]
    .map((source) => {
      const views = sourceViewRows.find((r) => r.source === source)?.views ?? 0;
      const apps = appsBySource.get(source) ?? 0;
      return { source, views, applications: apps, conversion: percent(apps, views) };
    })
    .sort((a, b) => b.views + b.applications - (a.views + a.applications));

  const viewsByJob = new Map(comparisonViews.map((r) => [r.jobId, r.views]));
  const appsByJob = new Map(comparisonApps.map((r) => [r.jobId, r]));
  const comparison = jobList.map((job) => {
    const views = viewsByJob.get(job.id) ?? 0;
    const apps = appsByJob.get(job.id);
    return {
      jobId: job.id,
      title: job.title,
      views,
      applications: apps?.applications ?? 0,
      conversion: percent(apps?.applications ?? 0, views),
      hires: apps?.hires ?? 0,
    };
  });

  return {
    range: input.range,
    jobId,
    jobs: jobList,
    stages,
    leak: biggestDropOff(stages),
    steps: steps.map((s) => ({ step: s.step, sessions: s.sessions, fromFirst: percent(s.sessions, firstStep) })),
    questionLabels: Object.fromEntries(questionRows.map((q) => [q.key, q.label])),
    sources,
    comparison,
  };
}
