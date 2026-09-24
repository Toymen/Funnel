"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Filter, Footprints, Megaphone, Table2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Tile, TileHeader } from "@/components/dashboard/widgets/primitives";
import { cn } from "@/lib/utils";

import { FUNNEL_RANGES } from "./ranges";
import type { FunnelReportData } from "./report";

const fmt = new Intl.NumberFormat("de-DE");
const pct = (value: number | null) =>
  value === null ? "–" : `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;

const SOURCE_LABELS: Record<string, string> = {
  direkt: "Direkt",
  qr: "QR-Code",
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  indeed: "Indeed",
  arbeitsagentur: "Arbeitsagentur",
  "bier-schneider.de": "bier-schneider.de",
  empfehlung: "Mitarbeiterempfehlung",
};

const STEP_LABELS: Record<string, string> = {
  language: "Sprache",
  mode: "Art der Bewerbung",
  name: "Vorname",
  contact: "Kontakt",
  callback: "Rückrufzeit",
  voice: "Sprachnachricht",
  privacy: "Datenschutz & Absenden",
};

function stepLabel(step: string, questionLabels: Record<string, string>) {
  if (step.startsWith("question:")) {
    const key = step.slice("question:".length);
    return `Frage: ${questionLabels[key] ?? key}`;
  }
  return STEP_LABELS[step] ?? step;
}

function href(range: string, jobId: string | null) {
  const params = new URLSearchParams({ range });
  if (jobId) params.set("job", jobId);
  return `/dashboard/reports/funnel?${params.toString()}` as Route;
}

/** Ein einzelner Balken: eine Farbe (Magnitude), Wert als Text daneben. */
function Bar({ value, max, index }: { value: number; max: number; index: number }) {
  const reduce = useReducedMotion();
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <span className="relative block h-6 overflow-hidden rounded-md bg-warm-paper">
      <motion.span
        className="absolute inset-y-0 start-0 rounded-md"
        style={{ backgroundColor: "var(--chart-1)" }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      />
    </span>
  );
}

export function FunnelReport({ data }: { data: FunnelReportData }) {
  const router = useRouter();
  const max = Math.max(1, ...data.stages.map((s) => s.count));
  const stepMax = Math.max(1, ...data.steps.map((s) => s.sessions));
  const empty = data.stages.every((s) => s.count === 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-near-ink">Recruiting-Funnel</h1>
        <p className="max-w-prose text-sm text-soft-ink">
          Wie viele Menschen eine Stelle ansehen, die Bewerbung beginnen und abschicken – und wo sie
          abspringen. Aufrufe und Starts werden anonym gezählt.
        </p>
        {/* Filter in einer Zeile über den Diagrammen; auf dem Handy wischbar. */}
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Zeitraum" className="flex flex-wrap gap-1">
            {FUNNEL_RANGES.map((r) => (
              <Link
                key={r.value}
                href={href(r.value, data.jobId)}
                aria-current={data.range === r.value ? "page" : undefined}
                className={cn(
                  "min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  data.range === r.value
                    ? "bg-near-ink text-pure-snow"
                    : "bg-soft-kraft text-soft-ink hover:text-near-ink",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
          <label className="flex min-h-10 items-center gap-2 text-sm text-soft-ink">
            <span className="sr-only sm:not-sr-only">Stelle</span>
            <select
              className="min-h-10 max-w-[70vw] rounded-full border border-hairline bg-pure-snow px-3 text-sm text-near-ink"
              value={data.jobId ?? ""}
              onChange={(e) => router.push(href(data.range, e.target.value || null))}
            >
              <option value="">Alle Stellen</option>
              {data.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {data.leak && !empty ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-hairline bg-pure-snow p-4"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger-rust" aria-hidden />
          <p className="text-sm text-near-ink">
            Größter Verlust: nur <strong>{pct(data.leak.fromPrevious)}</strong> kommen von der
            vorherigen Stufe zu <strong>„{data.leak.label}“</strong>.
          </p>
        </div>
      ) : null}

      <Tile>
        <TileHeader icon={Filter} title="Funnel" />
        {empty ? (
          <p className="px-5 py-8 text-sm text-soft-ink">
            Im gewählten Zeitraum gibt es noch keine Aufrufe oder Bewerbungen.
          </p>
        ) : (
          <ol className="flex flex-col gap-3 px-5 pb-5 pt-4">
            {data.stages.map((stage, i) => (
              <li
                key={stage.key}
                title={`${stage.label}: ${fmt.format(stage.count)}${
                  stage.fromPrevious === null ? "" : ` · ${pct(stage.fromPrevious)} von vorher · ${pct(stage.fromStart)} gesamt`
                }`}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(170px,200px)_1fr_auto] sm:items-center sm:gap-4"
              >
                <span className="flex items-baseline justify-between gap-2 sm:block">
                  <span className="text-sm font-medium text-near-ink">{stage.label}</span>
                  <span className="text-sm tabular-nums text-near-ink sm:hidden">
                    {fmt.format(stage.count)}
                  </span>
                </span>
                <Bar value={stage.count} max={max} index={i} />
                <span className="flex gap-3 text-xs tabular-nums text-soft-ink sm:w-40 sm:justify-end sm:text-sm">
                  <span className="hidden font-semibold text-near-ink sm:inline">{fmt.format(stage.count)}</span>
                  {stage.fromPrevious !== null ? <span>↓ {pct(stage.fromPrevious)}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Tile>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tile>
          <TileHeader icon={Footprints} title="Abbruch pro Schritt der Kurzbewerbung" />
          {data.steps.length === 0 ? (
            <p className="px-5 py-8 text-sm text-soft-ink">Noch keine Daten aus der Kurzbewerbung.</p>
          ) : (
            <ol className="flex flex-col gap-3 px-5 pb-5 pt-4">
              {data.steps.map((step, i) => (
                <li key={step.step} className="flex flex-col gap-1" title={`${fmt.format(step.sessions)} Personen`}>
                  <span className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-near-ink">{stepLabel(step.step, data.questionLabels)}</span>
                    <span className="shrink-0 tabular-nums text-soft-ink">
                      {fmt.format(step.sessions)} · {pct(step.fromFirst)}
                    </span>
                  </span>
                  <Bar value={step.sessions} max={stepMax} index={i} />
                </li>
              ))}
            </ol>
          )}
        </Tile>

        <Tile>
          <TileHeader icon={Megaphone} title="Quellen" />
          <ul className="flex flex-col divide-y divide-hairline px-5 pb-3 pt-2">
            {data.sources.length === 0 ? (
              <li className="py-6 text-sm text-soft-ink">Noch keine Quellen erfasst.</li>
            ) : (
              data.sources.map((source) => (
                <li key={source.source} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate font-medium text-near-ink">
                    {SOURCE_LABELS[source.source] ?? source.source}
                  </span>
                  <span className="shrink-0 text-end tabular-nums text-soft-ink">
                    {fmt.format(source.views)} Aufrufe · {fmt.format(source.applications)} Bew. ·{" "}
                    <span className="text-near-ink">{pct(source.conversion)}</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </Tile>
      </div>

      <Tile>
        <TileHeader icon={Table2} title="Stellenvergleich" />
        {/* Handy: Karten. Ab sm: Tabelle. */}
        <ul className="flex flex-col divide-y divide-hairline px-5 pb-3 sm:hidden">
          {data.comparison.map((row) => (
            <li key={row.jobId} className="py-3">
              <p className="font-medium text-near-ink">{row.title}</p>
              <dl className="mt-1 grid grid-cols-4 gap-2 text-xs text-soft-ink">
                <div><dt>Aufrufe</dt><dd className="tabular-nums text-near-ink">{fmt.format(row.views)}</dd></div>
                <div><dt>Bew.</dt><dd className="tabular-nums text-near-ink">{fmt.format(row.applications)}</dd></div>
                <div><dt>Quote</dt><dd className="tabular-nums text-near-ink">{pct(row.conversion)}</dd></div>
                <div><dt>Eingest.</dt><dd className="tabular-nums text-near-ink">{fmt.format(row.hires)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto px-5 pb-4 sm:block">
          <table className="w-full text-sm">
            <thead className="text-left text-soft-ink">
              <tr>
                <th className="py-2 font-medium">Stelle</th>
                <th className="py-2 text-end font-medium">Aufrufe</th>
                <th className="py-2 text-end font-medium">Bewerbungen</th>
                <th className="py-2 text-end font-medium">Bewerbung/Aufruf</th>
                <th className="py-2 text-end font-medium">Einstellungen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline tabular-nums">
              {data.comparison.map((row) => (
                <tr key={row.jobId}>
                  <td className="py-2 text-near-ink">{row.title}</td>
                  <td className="py-2 text-end">{fmt.format(row.views)}</td>
                  <td className="py-2 text-end">{fmt.format(row.applications)}</td>
                  <td className="py-2 text-end">{pct(row.conversion)}</td>
                  <td className="py-2 text-end">{fmt.format(row.hires)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tile>
    </div>
  );
}
