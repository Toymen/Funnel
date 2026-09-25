"use client";

import { useState, type ReactNode } from "react";

import type {
  ApplicationFieldVisibility,
  JobApplicationConfig,
  JobApplicationFieldConfig,
} from "../config";
import { JobQuestionBuilder } from "../JobQuestionBuilder";
import { cn } from "@/lib/utils";

const visibilityOptions: Array<{
  value: ApplicationFieldVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "required",
    label: "Erforderlich",
    description: "Bewerbende müssen dieses Feld ausfüllen.",
  },
  {
    value: "optional",
    label: "Optional",
    description: "Anzeigen, aber das Überspringen erlauben.",
  },
  {
    value: "disabled",
    label: "Deaktiviert",
    description: "Im Bewerbungsformular ausblenden.",
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
              <span className="text-sm font-medium">{option.label}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {option.description}
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
  return (
    <div className="space-y-6">
      <FieldGroup
        title="Persönliche Angaben"
        description="Name und E-Mail bleiben erforderlich. Legen Sie die zusätzlichen Felder im ersten Abschnitt fest."
      >
        <VisibilityField
          name="applicationPhoneVisibility"
          label="Telefon"
          value={applicationConfig.sections.personal.phone}
        />
        <VisibilityField
          name="applicationAddressVisibility"
          label="Adresse"
          value={applicationConfig.sections.personal.address}
        />
        <VisibilityField
          name="applicationPhotoVisibility"
          label="Foto"
          value={applicationConfig.sections.personal.photo}
          description="Bewerbende können ein Profilfoto hochladen."
        />
        <VisibilityField
          name="applicationHeadlineVisibility"
          label="Kurzprofil"
          value={applicationConfig.sections.personal.headline}
          description="Kurzer beruflicher Titel oder Zusammenfassung."
        />
      </FieldGroup>

      <FieldGroup
        title="Profil"
        description="Lebenslauf und Profillinks festlegen."
      >
        <VisibilityField
          name="applicationResumeVisibility"
          label="Lebenslauf"
          value={applicationConfig.sections.profile.resume}
          description="Bewerbende können PDF-, DOC- oder DOCX-Dateien hochladen."
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
          label="Webseite / Portfolio"
          value={applicationConfig.sections.profile.websiteUrl}
        />
        <VisibilityField
          name="applicationEducationVisibility"
          label="Ausbildung"
          value={applicationConfig.sections.profile.education}
          description="Bewerbende können einen oder mehrere Ausbildungseinträge hinzufügen."
        />
        <VisibilityField
          name="applicationExperienceVisibility"
          label="Berufserfahrung"
          value={applicationConfig.sections.profile.experience}
          description="Bewerbende können eine oder mehrere Berufserfahrungen hinzufügen."
        />
      </FieldGroup>

      <FieldGroup
        title="Details"
        description="Zusätzliche Informationen und Fragen zur Vorauswahl."
      >
        <VisibilityField
          name="applicationCoverLetterVisibility"
          label="Anschreiben"
          value={applicationConfig.sections.details.coverLetter}
        />
        <div>
          <h3 className="mb-3 text-sm font-semibold">Eigene Fragen</h3>
          <JobQuestionBuilder
            initialQuestions={applicationConfig.questions}
            aiContext={aiContext}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
