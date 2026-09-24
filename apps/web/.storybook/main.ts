import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook für die öffentlichen Bier-Schneider-Seiten (zuerst die
 * 60-Sekunden-Bewerbung). Stories liegen neben den Komponenten.
 * Server-Actions und Tracking werden in preview.tsx per `sb.mock` ersetzt.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  // Schriften (public/fonts/bier-schneider) und andere statische Dateien.
  staticDirs: ["../public"],
  viteFinal: (viteConfig) => {
    // "use client"/"use server" sind in Storybook bedeutungslos – die
    // Rollup-Warnung dazu erscheint sonst für jede Client-Komponente.
    const build = (viteConfig.build ??= {});
    const rollupOptions = (build.rollupOptions ??= {});
    const previous = rollupOptions.onwarn;
    rollupOptions.onwarn = (warning, warn) => {
      if (warning.code === "MODULE_LEVEL_DIRECTIVE" || warning.code === "SOURCEMAP_ERROR") return;
      if (previous) previous(warning, warn);
      else warn(warning);
    };
    build.chunkSizeWarningLimit = 2048;
    return viteConfig;
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
};

export default config;
