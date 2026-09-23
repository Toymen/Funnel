/** Zeitraumfilter des Funnel-Reports (PRD v1 §18). Client- und serverseitig nutzbar. */
export const FUNNEL_RANGES = [
  { value: "1", label: "Heute" },
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "365", label: "Dieses Jahr" },
] as const;

export type FunnelRange = (typeof FUNNEL_RANGES)[number]["value"];

export function normalizeFunnelRange(value: string | undefined): FunnelRange {
  return FUNNEL_RANGES.some((r) => r.value === value) ? (value as FunnelRange) : "30";
}

export function rangeStart(range: FunnelRange, now = new Date()): Date {
  if (range === "1") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "365") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getTime() - Number(range) * 86_400_000);
}
