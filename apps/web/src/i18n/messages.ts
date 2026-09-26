/**
 * Alle Übersetzungen des Arbeitgeberbereichs (DE/EN), eine JSON-Datei je Bereich.
 * Statische Imports statt dynamischer Pfade: so prüft TypeScript jeden Schlüssel
 * (siehe next-intl.d.ts) und der Bundler kennt alle Dateien.
 *
 * Neue Texte gehören in die JSON-Datei ihres Bereichs; neue Bereiche nur hier ergänzen.
 * Die Bewerbungsseite nutzt weiter ihr eigenes System (features/quick-apply/messages.ts).
 */
import deAccount from "../../messages/de/account.json";
import deActivity from "../../messages/de/activity.json";
import deAdmin from "../../messages/de/admin.json";
import deAi from "../../messages/de/ai.json";
import deAuth from "../../messages/de/auth.json";
import deAutomations from "../../messages/de/automations.json";
import deCandidates from "../../messages/de/candidates.json";
import deCareerPage from "../../messages/de/careerPage.json";
import deCommon from "../../messages/de/common.json";
import deDashboard from "../../messages/de/dashboard.json";
import deDevelopers from "../../messages/de/developers.json";
import deDocuments from "../../messages/de/documents.json";
import deErrors from "../../messages/de/errors.json";
import deEvaluations from "../../messages/de/evaluations.json";
import deFunnelReport from "../../messages/de/funnelReport.json";
import deInterviews from "../../messages/de/interviews.json";
import deJobs from "../../messages/de/jobs.json";
import deMail from "../../messages/de/mail.json";
import deMobileAdmin from "../../messages/de/mobileAdmin.json";
import deNav from "../../messages/de/nav.json";
import deNotifications from "../../messages/de/notifications.json";
import deOffers from "../../messages/de/offers.json";
import deOnboarding from "../../messages/de/onboarding.json";
import dePeople from "../../messages/de/people.json";
import dePipeline from "../../messages/de/pipeline.json";
import dePool from "../../messages/de/pool.json";
import deReports from "../../messages/de/reports.json";
import deSearch from "../../messages/de/search.json";
import deSecurity from "../../messages/de/security.json";
import deSettings from "../../messages/de/settings.json";
import deTasks from "../../messages/de/tasks.json";
import deUi from "../../messages/de/ui.json";
import deWorkspaces from "../../messages/de/workspaces.json";
import enAccount from "../../messages/en/account.json";
import enActivity from "../../messages/en/activity.json";
import enAdmin from "../../messages/en/admin.json";
import enAi from "../../messages/en/ai.json";
import enAuth from "../../messages/en/auth.json";
import enAutomations from "../../messages/en/automations.json";
import enCandidates from "../../messages/en/candidates.json";
import enCareerPage from "../../messages/en/careerPage.json";
import enCommon from "../../messages/en/common.json";
import enDashboard from "../../messages/en/dashboard.json";
import enDevelopers from "../../messages/en/developers.json";
import enDocuments from "../../messages/en/documents.json";
import enErrors from "../../messages/en/errors.json";
import enEvaluations from "../../messages/en/evaluations.json";
import enFunnelReport from "../../messages/en/funnelReport.json";
import enInterviews from "../../messages/en/interviews.json";
import enJobs from "../../messages/en/jobs.json";
import enMail from "../../messages/en/mail.json";
import enMobileAdmin from "../../messages/en/mobileAdmin.json";
import enNav from "../../messages/en/nav.json";
import enNotifications from "../../messages/en/notifications.json";
import enOffers from "../../messages/en/offers.json";
import enOnboarding from "../../messages/en/onboarding.json";
import enPeople from "../../messages/en/people.json";
import enPipeline from "../../messages/en/pipeline.json";
import enPool from "../../messages/en/pool.json";
import enReports from "../../messages/en/reports.json";
import enSearch from "../../messages/en/search.json";
import enSecurity from "../../messages/en/security.json";
import enSettings from "../../messages/en/settings.json";
import enTasks from "../../messages/en/tasks.json";
import enUi from "../../messages/en/ui.json";
import enWorkspaces from "../../messages/en/workspaces.json";

export const MESSAGE_NAMESPACES = [
  "common",
  "ui",
  "nav",
  "errors",
  "search",
  "notifications",
  "auth",
  "onboarding",
  "workspaces",
  "security",
  "candidates",
  "pipeline",
  "pool",
  "evaluations",
  "mobileAdmin",
  "jobs",
  "careerPage",
  "mail",
  "interviews",
  "offers",
  "documents",
  "tasks",
  "dashboard",
  "reports",
  "funnelReport",
  "automations",
  "ai",
  "activity",
  "settings",
  "account",
  "people",
  "admin",
  "developers",
] as const;

const en = {
  common: enCommon,
  ui: enUi,
  nav: enNav,
  errors: enErrors,
  search: enSearch,
  notifications: enNotifications,
  auth: enAuth,
  onboarding: enOnboarding,
  workspaces: enWorkspaces,
  security: enSecurity,
  candidates: enCandidates,
  pipeline: enPipeline,
  pool: enPool,
  evaluations: enEvaluations,
  mobileAdmin: enMobileAdmin,
  jobs: enJobs,
  careerPage: enCareerPage,
  mail: enMail,
  interviews: enInterviews,
  offers: enOffers,
  documents: enDocuments,
  tasks: enTasks,
  dashboard: enDashboard,
  reports: enReports,
  funnelReport: enFunnelReport,
  automations: enAutomations,
  ai: enAi,
  activity: enActivity,
  settings: enSettings,
  account: enAccount,
  people: enPeople,
  admin: enAdmin,
  developers: enDevelopers,
};

const de = {
  common: deCommon,
  ui: deUi,
  nav: deNav,
  errors: deErrors,
  search: deSearch,
  notifications: deNotifications,
  auth: deAuth,
  onboarding: deOnboarding,
  workspaces: deWorkspaces,
  security: deSecurity,
  candidates: deCandidates,
  pipeline: dePipeline,
  pool: dePool,
  evaluations: deEvaluations,
  mobileAdmin: deMobileAdmin,
  jobs: deJobs,
  careerPage: deCareerPage,
  mail: deMail,
  interviews: deInterviews,
  offers: deOffers,
  documents: deDocuments,
  tasks: deTasks,
  dashboard: deDashboard,
  reports: deReports,
  funnelReport: deFunnelReport,
  automations: deAutomations,
  ai: deAi,
  activity: deActivity,
  settings: deSettings,
  account: deAccount,
  people: dePeople,
  admin: deAdmin,
  developers: deDevelopers,
} satisfies Record<keyof typeof en, unknown>;

/** Englisch ist die Referenz für die Typen; der Paritätstest hält Deutsch deckungsgleich. */
export type Messages = typeof en;

export const MESSAGES = { de, en } as const;
