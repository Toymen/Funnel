"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Banknote, Clock, MapPin } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { trackFunnel } from "@/features/funnel/client";

import { languageInfo, QUICK_APPLY_LANGUAGES, type QuickApplyLanguage } from "./languages";
import { QUICK_APPLY_MESSAGES } from "./messages";
import { ButtonTruck, TruckSvg } from "./Truck";

/**
 * Kopfbereich der Stellenseite (PRD v2 §5.4): Titel, drei Kurzfakten als
 * Icons und der große Button „Jetzt in 1 Minute bewerben“ – ohne Scrollen
 * sichtbar. Beim Tippen rollt ein Mini-LKW über den Button.
 */
export function QuickApplyHero({
  jobId,
  slug,
  title,
  summary,
  payLabel,
  hoursLabel,
  location,
  language,
}: {
  jobId: string;
  slug: string;
  title: string;
  summary: string | null;
  payLabel: string | null;
  hoursLabel: string | null;
  location: string | null;
  language: QuickApplyLanguage;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [rolling, setRolling] = useState(false);
  const t = QUICK_APPLY_MESSAGES[language];
  const rtl = languageInfo(language).dir === "rtl";
  const href = `/apply/${slug}?lang=${language}` as Route;

  useEffect(() => {
    trackFunnel("job_view", { jobId, metadata: { language } });
  }, [jobId, language]);

  const go = () => {
    if (reduce) {
      router.push(href);
      return;
    }
    setRolling(true);
    window.setTimeout(() => router.push(href), 550);
  };

  const facts = [
    payLabel ? { icon: Banknote, label: t.pay, value: payLabel } : null,
    hoursLabel ? { icon: Clock, label: t.hours, value: hoursLabel } : null,
    location ? { icon: MapPin, label: t.place, value: location } : null,
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);

  return (
    <section className="bs-quick bs-hero" dir={rtl ? "rtl" : "ltr"} lang={language === "de-easy" ? "de" : language}>
      <div className="bs-hero__inner">
        <div className={"bs-hero__truck " + (rtl ? "-scale-x-100" : "")} aria-hidden>
          <TruckSvg className="w-full" />
        </div>
        <h1 className="bs-question">{title}</h1>
        {summary ? <p className="bs-lead">{summary}</p> : null}
        {facts.length ? (
          <ul className="bs-facts">
            {facts.map(({ icon: Icon, label, value }) => (
              <li key={label}>
                <Icon className="size-6 shrink-0" aria-hidden />
                <span className="sr-only">{label}: </span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <a
          href={href}
          className="bs-button"
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <ButtonTruck rolling={rolling} rtl={rtl} />
          <span>{t.applyNow}</span>
        </a>
        <p className="bs-hint text-center">{t.applyNowHint}</p>
        <nav aria-label={t.chooseLanguage} className="bs-langs">
          {QUICK_APPLY_LANGUAGES.map((l) => (
            <a
              key={l.code}
              href={`?lang=${l.code}`}
              lang={l.code === "de-easy" ? "de" : l.code}
              dir={l.dir}
              aria-current={l.code === language ? "true" : undefined}
            >
              {l.name}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
