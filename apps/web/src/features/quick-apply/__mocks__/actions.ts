/**
 * Storybook-Mock für ../actions.ts (per `sb.mock` in .storybook/preview.tsx).
 * Kein Server, keine Datenbank, kein Netzwerk – das Verhalten steuern Stories
 * über `parameters.quickApplyMock` (siehe .storybook/mocks/quick-apply.ts).
 *
 * Wichtig: nur `import type` mit relativen Pfaden – Storybook liefert diese
 * Datei unter dem Pfad des Originalmoduls aus.
 */
import { fn } from "storybook/test";

import type { QuickApplyMockConfig } from "../../../../.storybook/mocks/quick-apply";
import type { QuickApplyResult } from "../actions";

export type { QuickApplyErrorKey, QuickApplyResult } from "../actions";

function config(): QuickApplyMockConfig {
  const fromPreview = (globalThis as Record<string, unknown>).__storybookQuickApplyMock as
    | QuickApplyMockConfig
    | undefined;
  return fromPreview ?? { submit: "success", delayMs: 400, upload: "success" };
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const submitQuickApplicationAction = fn(async (formData: FormData): Promise<QuickApplyResult> => {
  void formData;
  const { submit, delayMs } = config();
  await wait(delayMs);
  if (submit !== "success") return { ok: false, error: submit };
  return { ok: true, applicationId: "storybook-application", uploadToken: "storybook-token" };
}).mockName("submitQuickApplicationAction");

export const uploadQuickApplicationFileAction = fn(async (formData: FormData): Promise<{ ok: boolean }> => {
  void formData;
  const { upload, delayMs } = config();
  await wait(delayMs);
  return { ok: upload === "success" };
}).mockName("uploadQuickApplicationFileAction");
