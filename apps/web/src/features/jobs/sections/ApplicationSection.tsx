"use client";

import { useState, type ReactNode } from "react";

import type {
  ApplicationFieldVisibility,
  JobApplicationConfig,
  JobApplicationFieldConfig,
} from "../config";
import { JobQuestionBuilder } from "../JobQuestionBuilder";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/i18n/admin-i18n";

const visibilityOptions: Array<{
  value: ApplicationFieldVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "required",
    label: "Required",
    description: "Candidates must fill this field.",
  },
  {
    value: "optional",
    label: "Optional",
    description: "Show it, but let candidates skip it.",
  },
  {
    value: "disabled",
    label: "Disabled",
    description: "Hide it from the application form.",
  },
];

function VisibilityField({
  name,
  label,
  value,
  description,
}: {
  name: string;
  label: string;
  value: JobApplicationFieldConfig;
  description?: string;
}) {
  const { t } = useAdminI18n();
  const [selected, setSelected] = useState<ApplicationFieldVisibility>(
    value.visibility,
  );

  return (
    <fieldset className="rounded-lg border border-input bg-card px-3.5 pt-2 pb-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
        {label}
      </legend>
      {description ? (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-3">
        {visibilityOptions.map((option) => {
          const checked = selected === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col rounded-md border px-3 py-2 transition-colors duration-150",
                checked
                  ? "border-pine/50 bg-sage/50"
                  : "border-border bg-background/60 hover:border-pine/30",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => setSelected(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{t(option.label)}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {t(option.description)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ApplicationSection({
  applicationConfig,
  aiContext,
}: {
  applicationConfig: JobApplicationConfig;
  aiContext?: {
    title: string;
    description: string;
    keywords: string[];
  };
}) {
  const { t } = useAdminI18n();
  return (
    <div className="space-y-6">
      <FieldGroup
        title={t("Personal information")}
        description={t("Name and email stay required. Configure the additional fields shown in the first section of the application form.")}
      >
        <VisibilityField
          name="applicationPhoneVisibility"
          label={t("Phone")}
          value={applicationConfig.sections.personal.phone}
        />
        <VisibilityField
          name="applicationAddressVisibility"
          label={t("Address")}
          value={applicationConfig.sections.personal.address}
        />
        <VisibilityField
          name="applicationPhotoVisibility"
          label={t("Photo")}
          value={applicationConfig.sections.personal.photo}
          description={t("Candidates can upload a profile photo.")}
        />
        <VisibilityField
          name="applicationHeadlineVisibility"
          label={t("Headline")}
          value={applicationConfig.sections.personal.headline}
          description={t("Short professional title or summary.")}
        />
      </FieldGroup>

      <FieldGroup
        title={t("Profile")}
        description={t("Control resume and profile links.")}
      >
        <VisibilityField
          name="applicationResumeVisibility"
          label={t("Resume / CV")}
          value={applicationConfig.sections.profile.resume}
          description={t("Candidates can upload PDF, DOC, or DOCX.")}
        />
        <VisibilityField
          name="applicationLinkedinVisibility"
          label="LinkedIn"
          value={applicationConfig.sections.profile.linkedinUrl}
        />
        <VisibilityField
          name="applicationGithubVisibility"
          label="GitHub"
          value={applicationConfig.sections.profile.githubUrl}
        />
        <VisibilityField
          name="applicationWebsiteVisibility"
          label={t("Website / Portfolio")}
          value={applicationConfig.sections.profile.websiteUrl}
        />
        <VisibilityField
          name="applicationEducationVisibility"
          label={t("Education")}
          value={applicationConfig.sections.profile.education}
          description={t("Candidates can add one or more education entries.")}
        />
        <VisibilityField
          name="applicationExperienceVisibility"
          label={t("Experience")}
          value={applicationConfig.sections.profile.experience}
          description={t("Candidates can add one or more work experience entries.")}
        />
      </FieldGroup>

      <FieldGroup
        title="Details"
        description={t("Additional written context and screening questions.")}
      >
        <VisibilityField
          name="applicationCoverLetterVisibility"
          label={t("Cover letter")}
          value={applicationConfig.sections.details.coverLetter}
        />
        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("Custom questions")}</h3>
          <JobQuestionBuilder
            initialQuestions={applicationConfig.questions}
            aiContext={aiContext}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
