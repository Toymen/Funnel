/// <reference types="@vitest/browser/providers/playwright" />
import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig } from "vitest/config";

/**
 * Führt alle Stories (inkl. play-Functions) als Tests in echtem Chromium aus.
 * Getrennt von vitest.config.ts, damit `pnpm test` unverändert (Node) bleibt.
 *
 *   pnpm --filter web test-storybook
 *
 * Chromium kommt aus `playwright install chromium`; alternativ zeigt
 * STORYBOOK_CHROMIUM_PATH auf ein vorhandenes Chromium-Binary.
 */
const executablePath = process.env.STORYBOOK_CHROMIUM_PATH || undefined;

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [storybookTest({ configDir: path.join(__dirname, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium", launch: { executablePath } }],
          },
        },
      },
    ],
  },
});
