"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AdminLocale = "de" | "en";

const COOKIE_NAME = "admin-locale";

const de = {
  Home: "Start",
  Inbox: "Posteingang",
  Pipeline: "Prozess",
  Candidates: "Bewerbende",
  Jobs: "Stellen",
  People: "Personen",
  "Talent Pool": "Talentpool",
  Team: "Team",
  Work: "Arbeit",
  Tasks: "Aufgaben",
  Calendar: "Kalender",
  Reports: "Berichte",
  "Recruiting-Funnel": "Recruiting-Funnel",
  "Set up": "Einrichten",
  "Career Page": "Karriereseite",
  Templates: "Vorlagen",
  Documents: "Dokumente",
  Settings: "Einstellungen",
  "Saved for later": "Für später gespeichert",
  "Your colleagues": "Ihre Kolleginnen und Kollegen",
  "Assigned to you": "Ihnen zugewiesen",
  "Interviews and availability": "Gespräche und Verfügbarkeit",
  "Funnel, sources, time to hire": "Funnel, Quellen und Besetzungsdauer",
  "Your public job board": "Ihre öffentliche Stellenbörse",
  "Emails and scorecards": "E-Mails und Bewertungsbögen",
  "Requests, signatures, retention":
    "Anfragen, Unterschriften und Aufbewahrung",
  Main: "Hauptnavigation",
  More: "Mehr",
  "Invite team": "Team einladen",
  Navigation: "Navigation",
  Create: "Erstellen",
  "New job": "Neue Stelle",
  "Add candidate": "Bewerber hinzufügen",
  "Schedule interview": "Gespräch planen",
  Search: "Suchen",
  "Open navigation": "Navigation öffnen",
  "Close Harly AI": "Harly AI schließen",
  "Ask Harly AI": "Harly AI fragen",
  "More options": "Weitere Optionen",
  "Light mode": "Heller Modus",
  "Dark mode": "Dunkler Modus",
  Language: "Sprache",
  German: "Deutsch",
  English: "Englisch",
  Workspace: "Arbeitsbereich",
  "Account menu": "Kontomenü",
  "View profile": "Profil ansehen",
  "Account settings": "Kontoeinstellungen",
  "Organization settings": "Organisationseinstellungen",
  "Star on GitHub": "Auf GitHub markieren",
  "Signing out…": "Abmeldung läuft …",
  "Sign out": "Abmelden",
  "Company & brand": "Unternehmen & Marke",
  "Logo, colors, careers page, and other organization-wide settings.":
    "Logo, Farben, Karriereseite und weitere organisationsweite Einstellungen.",
  "Members & roles": "Mitglieder & Rollen",
  "Teammates, permissions, and access control settings.":
    "Teammitglieder, Berechtigungen und Zugriffskontrolle.",
  "Candidate Portal": "Bewerberportal",
  "Self-service portal for candidates to view applications and update their profile.":
    "Portal für Bewerbende, um Bewerbungen einzusehen und ihr Profil zu aktualisieren.",
  "Parsing & drafting models, AI features, and usage insights.":
    "Modelle zur Analyse und Texterstellung, KI-Funktionen und Nutzungsübersicht.",
  Email: "E-Mail",
  "Email delivery and reply routing settings.":
    "E-Mail-Versand und Zuordnung von Antworten.",
  Integrations: "Integrationen",
  "Connect your tools and automate your workflow.":
    "Verbinden Sie Ihre Werkzeuge und automatisieren Sie Ihre Abläufe.",
  Security: "Sicherheit",
  "2FA, SSO, passkeys, and access audit logs.":
    "Zwei-Faktor-Anmeldung, SSO, Passkeys und Zugriffsprotokolle.",
  "Legal & Compliance": "Recht & Datenschutz",
  "Legal entity, retention policies, privacy policy, and terms.":
    "Rechtsträger, Aufbewahrungsregeln, Datenschutz und Bedingungen.",
  "Harly Signature": "Harly-Unterschrift",
  "Native signing, remote links, OTP security, and evidence settings.":
    "Direkte Unterschriften, externe Links, Einmalcodes und Nachweise.",
  "Developers & API": "Entwicklung & API",
  "API keys, webhooks, and developer tools.":
    "API-Schlüssel, Webhooks und Entwicklungswerkzeuge.",
  "Search jobs, candidates, or jump to…":
    "Stellen oder Bewerbende suchen oder direkt öffnen …",
  "No results for": "Keine Ergebnisse für",
  Navigate: "Navigation",
  Actions: "Aktionen",
  "Create new job": "Neue Stelle erstellen",
  navigate: "navigieren",
  select: "auswählen",
  close: "schließen",
} as const;

export type AdminMessage = keyof typeof de;

type AdminI18nValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (message: string) => string;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

export function isAdminLocale(value: unknown): value is AdminLocale {
  return value === "de" || value === "en";
}

export function AdminI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: AdminLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<AdminI18nValue>(() => {
    const setLocale = (nextLocale: AdminLocale) => {
      document.cookie = `${COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setLocaleState(nextLocale);
    };
    return {
      locale,
      setLocale,
      t: (message) =>
        locale === "de" ? (de[message as AdminMessage] ?? message) : message,
    };
  }, [locale]);

  return <AdminI18nContext value={value}>{children}</AdminI18nContext>;
}

export function useAdminI18n() {
  const value = useContext(AdminI18nContext);
  if (!value)
    throw new Error("useAdminI18n must be used inside AdminI18nProvider");
  return value;
}
