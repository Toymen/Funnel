/**
 * Stylelint für eigenes CSS (siehe docs/bier-schneider/LINTING.md).
 *
 * Geprüft wird nur `src/features/**\/*.css` (Skript `lint:css`). globals.css
 * nutzt Tailwind-4-Syntax (@theme, @custom-variant, @apply …) und bleibt
 * bewusst außen vor.
 *
 * @type {import("stylelint").Config}
 */
const config = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["src/app/globals.css", "**/node_modules/**", ".next/**", "storybook-static/**"],
  rules: {
    // Klassen folgen BEM mit Präfix: bs-block__element--modifier
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: (selector) => `Klasse "${selector}" bitte als bs-block__element--modifier schreiben` },
    ],
  },
};

export default config;
