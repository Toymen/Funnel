import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ApplyForm } from "@/features/applications/ApplyForm";
import { getPublicJobDetail } from "@/features/jobs/data";
import { normalizeJobApplicationConfig } from "@/features/jobs/config";
import { JobChrome } from "@/features/career-page/job/JobChrome";
import { getQuickApplyJob } from "@/features/quick-apply/data";
import { QuickApply } from "@/features/quick-apply/QuickApply";
import { resolveQuickApplyLanguage } from "@/features/quick-apply/resolve-language";
import { resolveCaptchaSiteKey } from "@/lib/captcha";
import { isPortalEnabled } from "@/lib/portal-auth";
import { getPublicWorkspaceSlug } from "@/lib/public-workspace";

import "@/features/quick-apply/quick-apply.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: true } };

type ApplyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ full?: string; lang?: string }>;
};

export default async function ApplyPage({ params, searchParams }: ApplyPageProps) {
  const [{ slug }, { full, lang }] = await Promise.all([params, searchParams]);

  // Bier-Schneider: Standard ist die 60-Sekunden-Bewerbung (PRD v2 §5).
  // ?full=1 öffnet das ausführliche Harly-Formular mit Lebenslauf.
  if (full !== "1") {
    const { language, explicit } = await resolveQuickApplyLanguage(lang);
    const quickJob = await getQuickApplyJob(slug, language);
    if (quickJob) {
      return <QuickApply job={quickJob} initialLanguage={language} languageChosen={explicit} />;
    }
  }

  const workspaceSlug = await getPublicWorkspaceSlug();
  const detail = workspaceSlug
    ? await getPublicJobDetail({ jobSlug: slug, workspaceSlug })
    : null;

  if (!detail) notFound();

  const { job, workspace, config } = detail;
  const applicationConfig = normalizeJobApplicationConfig(job.applicationConfig);
  const [captcha, portalEnabled] = await Promise.all([
    resolveCaptchaSiteKey(workspace.id),
    isPortalEnabled(),
  ]);

  return (
    <JobChrome
      config={config}
      workspace={workspace}
      job={job}
      boardRoot="/"
      activeTab="application"
      portalEnabled={portalEnabled}
    >
      <ApplyForm
        jobSlug={job.slug}
        workspaceSlug={workspace.slug}
        applicationConfig={applicationConfig}
        variant={
          config.template === "ashby"
            ? "ashby"
            : config.template === "join"
              ? "join"
              : "default"
        }
        captchaProvider={captcha?.provider ?? null}
        captchaSiteKey={captcha?.siteKey ?? null}
        legalConfigured={workspace.legalConfigured}
        consentCheckboxText={workspace.consentCheckboxText}
        legalPages={workspace.legalPages}
      />
    </JobChrome>
  );
}
