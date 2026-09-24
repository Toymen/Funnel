import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { sb } from "storybook/test";

import { languageInfo, QUICK_APPLY_LANGUAGES, type QuickApplyLanguage } from "@/features/quick-apply/languages";

import { configureQuickApplyMock, type QuickApplyMockConfig } from "./mocks/quick-apply";

import "../src/app/globals.css";
import "../src/features/quick-apply/quick-apply.css";

// Server-Actions (DB, Storage) und Funnel-Tracking (fetch/sendBeacon) nie echt
// laden: Storybook ersetzt die Module durch die Dateien in `__mocks__/`.
sb.mock("../src/features/quick-apply/actions.ts");
sb.mock("../src/features/funnel/client.ts");

/** Setzt `lang`/`dir` passend zur Toolbar-Sprache (ar → rtl). */
const withLanguage: Decorator = (Story, context) => {
  const language = (context.globals.language ?? "de") as QuickApplyLanguage;
  const { dir } = languageInfo(language);
  const lang = language === "de-easy" ? "de" : language;
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }
  return (
    <div lang={lang} dir={dir}>
      <Story />
    </div>
  );
};

const viewports = {
  mobile360: { name: "Handy 360", styles: { width: "360px", height: "740px" }, type: "mobile" },
  mobile390: { name: "Handy 390", styles: { width: "390px", height: "844px" }, type: "mobile" },
  tablet: { name: "Tablet 768", styles: { width: "768px", height: "1024px" }, type: "tablet" },
  desktop: { name: "Desktop 1280", styles: { width: "1280px", height: "800px" }, type: "desktop" },
} as const;

const preview: Preview = {
  globalTypes: {
    language: {
      description: "Sprache der Oberfläche",
      toolbar: {
        title: "Sprache",
        icon: "globe",
        items: QUICK_APPLY_LANGUAGES.map((l) => ({
          value: l.code,
          title: l.name,
          right: l.dir === "rtl" ? "RTL" : undefined,
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    language: "de",
    viewport: { value: "mobile390", isRotated: false },
  },
  decorators: [withLanguage],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: { options: viewports },
    controls: {
      matchers: { color: /(background|color)$/i },
    },
    a11y: {
      // Verstöße im a11y-Panel anzeigen, Tests aber nicht daran scheitern lassen.
      test: "todo",
    },
  },
  beforeEach: ({ parameters }) => {
    configureQuickApplyMock(parameters.quickApplyMock as Partial<QuickApplyMockConfig> | undefined);
    // Autosave-Entwurf und Funnel-Session aus vorherigen Stories verwerfen.
    try {
      for (const key of Object.keys(window.sessionStorage)) {
        if (key.startsWith("bs_")) window.sessionStorage.removeItem(key);
      }
    } catch {
      // sessionStorage gesperrt – dann gibt es auch nichts aufzuräumen.
    }
  },
};

export default preview;
