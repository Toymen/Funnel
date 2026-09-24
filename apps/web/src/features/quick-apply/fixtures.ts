import type { QuickApplyJob } from "./data";
import type { QuickApplyLanguage } from "./languages";

/**
 * Beispielstelle für Storybook und Tests: LKW-Fahrer mit zwei Ja/Nein-Fragen
 * und einer Auswahlfrage. Reine Daten, kein Server-Code.
 */
export const truckDriverJob: QuickApplyJob = {
  jobId: "00000000-0000-4000-8000-000000000001",
  slug: "lkw-fahrer-getraenkelogistik",
  workspaceSlug: "bier-schneider",
  title: "LKW-Fahrer (m/w/d) Getränkelogistik",
  summary: "Du lieferst Getränke an Gaststätten und Märkte in der Region. Abends bist du zu Hause.",
  highlights: ["Feste Touren in der Region", "Moderne LKW", "Pünktlicher Lohn"],
  icon: "truck",
  payLabel: "ab 3.100 € / Monat",
  hoursLabel: "Mo–Fr, 6–15 Uhr",
  location: "Musterstadt",
  questions: [
    {
      id: "license-ce",
      label: "Hast du einen Führerschein der Klasse CE?",
      kind: "yesno",
      required: true,
      options: [
        { value: "Ja", label: "Ja" },
        { value: "Nein", label: "Nein" },
      ],
    },
    {
      id: "lifting",
      label: "Kannst du Getränkekisten tragen?",
      kind: "yesno",
      required: true,
      options: [
        { value: "Ja", label: "Ja" },
        { value: "Nein", label: "Nein" },
      ],
    },
    {
      id: "start",
      label: "Wann kannst du anfangen?",
      kind: "choice",
      required: false,
      options: [
        { value: "Sofort", label: "Sofort" },
        { value: "In 1 Monat", label: "In 1 Monat" },
        { value: "In 3 Monaten", label: "In 3 Monaten" },
        { value: "Später", label: "Später" },
      ],
    },
  ],
  legalConfigured: true,
  consentText: "Ich bin einverstanden, dass Bier-Schneider meine Daten für die Bewerbung nutzt.",
  privacyHref: "/legal/privacy-policy",
};

/**
 * Arabische Fassung (wie aus job_quick_apply.localizations). Optionswerte
 * bleiben deutsch – so werden sie auch an Harly übermittelt.
 */
const truckDriverJobAr: QuickApplyJob = {
  ...truckDriverJob,
  title: "سائق شاحنة لنقل المشروبات",
  summary: "توصّل المشروبات إلى المطاعم والأسواق في المنطقة. وفي المساء تكون في البيت.",
  highlights: ["جولات ثابتة في المنطقة", "شاحنات حديثة", "راتب في موعده"],
  payLabel: "من 3.100 € / شهريًا",
  hoursLabel: "الإثنين–الجمعة، 6–15",
  questions: [
    { ...truckDriverJob.questions[0], label: "هل لديك رخصة قيادة من فئة CE؟" },
    { ...truckDriverJob.questions[1], label: "هل تستطيع حمل صناديق المشروبات؟" },
    {
      ...truckDriverJob.questions[2],
      label: "متى يمكنك أن تبدأ؟",
      options: [
        { value: "Sofort", label: "فورًا" },
        { value: "In 1 Monat", label: "بعد شهر" },
        { value: "In 3 Monaten", label: "بعد 3 أشهر" },
        { value: "Später", label: "لاحقًا" },
      ],
    },
  ],
};

/** Beispielstelle in der gewünschten Sprache (sonst Deutsch, wie im Seed). */
export function truckDriverJobFor(language: QuickApplyLanguage): QuickApplyJob {
  return language === "ar" ? truckDriverJobAr : truckDriverJob;
}
