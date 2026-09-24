import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { truckDriverJob, truckDriverJobFor } from "./fixtures";
import { isQuickApplyLanguage } from "./languages";
import { QUICK_APPLY_MESSAGES } from "./messages";
import { QuickApplyHero } from "./QuickApplyHero";

type Args = Omit<React.ComponentProps<typeof QuickApplyHero>, "language">;

/** Rahmen wie auf der Stellenseite (app/(public)/jobs/[slug]/page.tsx). */
const withJobPage: Decorator = (Story) => (
  <div className="bs-quick bs-jobpage">
    <Story />
    <div className="bs-jobpage__details" lang="de">
      <p className="font-semibold">{QUICK_APPLY_MESSAGES.de.moreAboutJob}</p>
      <ul className="mt-2 list-disc ps-5">
        {truckDriverJob.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </div>
  </div>
);

const meta = {
  title: "Bewerbung/QuickApplyHero",
  decorators: [withJobPage],
  args: {
    jobId: truckDriverJob.jobId,
    slug: truckDriverJob.slug,
    title: truckDriverJob.title,
    summary: truckDriverJob.summary,
    payLabel: truckDriverJob.payLabel,
    hoursLabel: truckDriverJob.hoursLabel,
    location: truckDriverJob.location,
  },
  // Sprache aus der Toolbar; für Arabisch die übersetzten Texte der Beispielstelle.
  render: (args, { globals }) => {
    const language = isQuickApplyLanguage(globals.language) ? globals.language : "de";
    const localized = language === "de" ? {} : pickTexts(truckDriverJobFor(language), args);
    return <QuickApplyHero {...args} {...localized} language={language} />;
  },
} satisfies Meta<Args>;

/** Übernimmt übersetzte Texte nur für Felder, die nicht per Control geändert wurden. */
function pickTexts(job: ReturnType<typeof truckDriverJobFor>, args: Args): Partial<Args> {
  return {
    title: args.title === truckDriverJob.title ? job.title : args.title,
    summary: args.summary === truckDriverJob.summary ? job.summary : args.summary,
    payLabel: args.payLabel === truckDriverJob.payLabel ? job.payLabel : args.payLabel,
    hoursLabel: args.hoursLabel === truckDriverJob.hoursLabel ? job.hoursLabel : args.hoursLabel,
  };
}

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

/** Ohne Kurzfakten und Beschreibung – nur Titel und Button. */
export const OhneKurzfakten: Story = {
  args: { summary: null, payLabel: null, hoursLabel: null, location: null },
};

export const Arabisch: Story = {
  name: "Arabisch (RTL)",
  globals: { language: "ar" },
};
