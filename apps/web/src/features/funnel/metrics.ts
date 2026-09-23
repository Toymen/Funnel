/**
 * Conversion-Berechnung (PRD v1 §46, v2 §10). Rein funktional und getestet.
 */
export type FunnelStageKey =
  | "job_view"
  | "application_started"
  | "application_submitted"
  | "interview"
  | "offer"
  | "hired";

export const FUNNEL_STAGE_LABELS: Record<FunnelStageKey, string> = {
  job_view: "Stellenaufrufe",
  application_started: "Bewerbung begonnen",
  application_submitted: "Bewerbung abgeschickt",
  interview: "Vorstellungsgespräch",
  offer: "Angebot",
  hired: "Einstellung",
};

export type FunnelStage = {
  key: FunnelStageKey;
  label: string;
  count: number;
  /** Conversion von der vorherigen Stufe in Prozent (eine Nachkommastelle). */
  fromPrevious: number | null;
  /** Conversion von der ersten Stufe in Prozent. */
  fromStart: number | null;
};

export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export function computeFunnel(counts: Record<FunnelStageKey, number>): FunnelStage[] {
  const keys = Object.keys(FUNNEL_STAGE_LABELS) as FunnelStageKey[];
  const first = counts[keys[0]!] ?? 0;
  return keys.map((key, index) => {
    const count = counts[key] ?? 0;
    const previous = index === 0 ? null : (counts[keys[index - 1]!] ?? 0);
    return {
      key,
      label: FUNNEL_STAGE_LABELS[key],
      count,
      fromPrevious: previous === null ? null : percent(count, previous),
      fromStart: index === 0 ? null : percent(count, first),
    };
  });
}

/** Die Stufe mit dem größten relativen Verlust – das „Leck“ im Funnel. */
export function biggestDropOff(stages: FunnelStage[]): FunnelStage | null {
  let worst: FunnelStage | null = null;
  for (const stage of stages.slice(1)) {
    if (stage.fromPrevious === null) continue;
    if (!worst || stage.fromPrevious < (worst.fromPrevious ?? 100)) worst = stage;
  }
  return worst;
}

/** Ordnet frei benannte Harly-Pipeline-Stufen den Funnel-Stufen zu. */
export function stageKeyForPipelineStage(name: string): "interview" | "offer" | "hired" | null {
  const value = name.toLowerCase();
  if (/(hired|eingestellt|einstellung)/.test(value)) return "hired";
  if (/(offer|angebot)/.test(value)) return "offer";
  if (/(interview|gespräch|gespraech|kennenlernen)/.test(value)) return "interview";
  return null;
}
