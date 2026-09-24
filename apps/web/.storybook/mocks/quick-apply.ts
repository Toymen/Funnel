import type { QuickApplyErrorKey } from "@/features/quick-apply/actions";

/**
 * Steuerung der gemockten Server-Actions der 60-Sekunden-Bewerbung.
 *
 * Stories setzen das Verhalten über `parameters.quickApplyMock`; preview.tsx
 * legt es vor jeder Story auf `globalThis` ab. Die Mock-Actions unter
 * `src/features/quick-apply/__mocks__/actions.ts` lesen es von dort – Mock-
 * Dateien dürfen keine relativen Laufzeit-Imports haben, weil Storybook sie
 * unter dem Pfad des Originalmoduls ausliefert.
 */
export type QuickApplyMockConfig = {
  /** "success" oder ein Fehlerschlüssel, z. B. "errorDuplicate". */
  submit: "success" | QuickApplyErrorKey;
  /** Künstliche Wartezeit der Server-Action in Millisekunden. */
  delayMs: number;
  /** Ergebnis des optionalen Nachweis-Uploads auf der Danke-Seite. */
  upload: "success" | "error";
};

export const QUICK_APPLY_MOCK_KEY = "__storybookQuickApplyMock";

export const DEFAULT_QUICK_APPLY_MOCK: QuickApplyMockConfig = {
  submit: "success",
  delayMs: 400,
  upload: "success",
};

export function configureQuickApplyMock(config: Partial<QuickApplyMockConfig> | undefined): void {
  (globalThis as Record<string, unknown>)[QUICK_APPLY_MOCK_KEY] = { ...DEFAULT_QUICK_APPLY_MOCK, ...config };
}
