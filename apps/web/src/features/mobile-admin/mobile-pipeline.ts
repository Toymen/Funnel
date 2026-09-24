/**
 * Reine Logik für die wischbaren Pipeline-Spalten auf dem Handy (PRD §11.1).
 */

/** Stufen, deren Wechsel eine Entscheidung ist und bestätigt werden soll. */
const TERMINAL_STAGE_NAMES = new Set([
  "hired",
  "rejected",
  "eingestellt",
  "abgesagt",
  "absage",
]);

export function isTerminalStageName(name: string): boolean {
  return TERMINAL_STAGE_NAMES.has(name.trim().toLowerCase());
}

export function moveConfirmationMessage(
  candidateName: string,
  stageName: string,
): string {
  return `${candidateName} wirklich nach „${stageName}“ verschieben?`;
}

/**
 * Index der Spalte, die nach dem Wischen am linken Rand steht.
 * `step` ist Spaltenbreite plus Abstand. Ergebnis liegt immer in [0, count - 1].
 */
export function columnIndexForScroll(
  scrollLeft: number,
  step: number,
  count: number,
): number {
  if (count <= 0 || step <= 0 || !Number.isFinite(scrollLeft)) return 0;
  const index = Math.round(Math.abs(scrollLeft) / step);
  return Math.min(Math.max(index, 0), count - 1);
}
