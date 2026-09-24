import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicJobDetail } from "@/features/jobs/data";
import { JobChrome } from "@/features/career-page/job/JobChrome";
import { JobOverviewBody } from "@/features/career-page/job/JobOverviewBody";
import { publicJobMetadata } from "@/features/career-page/seo";
import { isPortalEnabled } from "@/lib/portal-auth";
import { getPublicWorkspaceSlug } from "@/lib/public-workspace";
import { getQuickApplyJob } from "@/features/quick-apply/data";
import { QuickApplyHero } from "@/features/quick-apply/QuickApplyHero";
import { resolveQuickApplyLanguage } from "@/features/quick-apply/resolve-language";

import "@/features/quick-apply/quick-apply.css";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const [{ slug }, workspaceSlug] = await Promise.all([
    params,
    getPublicWorkspaceSlug(),
  ]);
  const detail = workspaceSlug
    ? await getPublicJobDetail({ jobSlug: slug, workspaceSlug })
    : null;
  return detail
    ? publicJobMetadata(detail.workspace, detail.config, detail.job, { path: "" })
    : {};
}

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const { slug } = await params;
  const { lang } = (await searchParams) ?? {};
  const [workspaceSlug, portalEnabled] = await Promise.all([
    getPublicWorkspaceSlug(),
    isPortalEnabled(),
  ]);
  const detail = workspaceSlug
    ? await getPublicJobDetail({ jobSlug: slug, workspaceSlug })
    : null;

  if (!detail) notFound();

  const { job, workspace, config } = detail;
  // Bier-Schneider: Kurzfakten + „Jetzt in 1 Minute bewerben“ oben (PRD v2 §5.4).
  const { language } = await resolveQuickApplyLanguage(lang);
  const quick = await getQuickApplyJob(slug, language);

  // Stellen mit Kurzbewerbung: schlanke, mehrsprachige Seite – der Button
  // „Jetzt in 1 Minute bewerben“ ist ohne Scrollen sichtbar (PRD v2 §5.4).
  if (quick) {
    return (
      <div className="bs-quick bs-jobpage">
        <QuickApplyHero
          jobId={quick.jobId}
          slug={quick.slug}
          title={quick.title}
          summary={quick.summary}
          payLabel={quick.payLabel}
          hoursLabel={quick.hoursLabel}
          location={quick.location}
          language={language}
        />
        <div className="bs-jobpage__details" lang="de">
          <JobOverviewBody job={job} />
        </div>
      </div>
    );
  }

  return (
    <JobChrome
      config={config}
      workspace={workspace}
      job={job}
      boardRoot="/"
      activeTab="overview"
      portalEnabled={portalEnabled}
    >
      <JobOverviewBody job={job} />
    </JobChrome>
  );
}
