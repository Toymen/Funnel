import { FunnelReport } from "@/features/funnel/FunnelReport";
import { normalizeFunnelRange } from "@/features/funnel/ranges";
import { getFunnelReport } from "@/features/funnel/report";
import { requirePagePermission } from "@/features/workspaces/permissions-server";

export const dynamic = "force-dynamic";

type FunnelPageProps = {
  searchParams: Promise<{ range?: string; job?: string }>;
};

/** /dashboard/reports/funnel – Recruiting-Funnel (PRD v2 §10). */
export default async function FunnelReportPage({ searchParams }: FunnelPageProps) {
  await requirePagePermission("reports:read");
  const { range, job } = await searchParams;
  const data = await getFunnelReport({ range: normalizeFunnelRange(range), jobId: job ?? null });
  return <FunnelReport data={data} />;
}
