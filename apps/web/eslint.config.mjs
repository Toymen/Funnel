import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

/**
 * Lint-Strategie (siehe docs/bier-schneider/LINTING.md):
 *
 * 1. Harly-Basis (alles): unverändert `next/core-web-vitals` + `next/typescript`.
 *    Der geerbte Code soll nicht mit neuen Befunden geflutet werden.
 * 2. Eigener Bier-Schneider-Code (OWN_CODE): zusätzlich streng – jsx-a11y strict,
 *    typescript-eslint type-aware, Import-Sortierung.
 * 3. Bewerber-Oberfläche (APPLICANT_UI): keine sichtbaren Klartexte im JSX,
 *    alle Texte kommen aus `features/quick-apply/messages.ts` (9 Sprachen).
 * 4. Storybook (`*.stories.tsx`, `.storybook/**`): eslint-plugin-storybook.
 *
 * Neue eigene Pfade werden in OWN_CODE (bzw. APPLICANT_UI) ergänzt.
 * Achtung: `[` und `]` sind in Globs Zeichenklassen und müssen escaped werden.
 */
const OWN_CODE = [
  "src/features/quick-apply/**/*.{ts,tsx}",
  "src/features/funnel/**/*.{ts,tsx}",
  "src/app/(public)/apply/**/*.{ts,tsx}",
  "src/app/(public)/jobs/\\[slug\\]/**/*.{ts,tsx}",
  "src/app/api/public/funnel/**/*.{ts,tsx}",
  "src/app/(dashboard)/dashboard/reports/funnel/**/*.{ts,tsx}",
  "src/lib/notify/webhook-hosts*.ts",
];

/** Oberflächen, die Bewerberinnen und Bewerber sehen (mehrsprachig). */
const APPLICANT_UI = ["src/features/quick-apply/**/*.tsx"];

/** Attribute, deren Wert sichtbar ist oder vorgelesen wird. */
const VISIBLE_ATTRIBUTES =
  "placeholder|title|alt|label|aria-label|aria-description|aria-valuetext|aria-roledescription";
const LITERAL_TEXT_MESSAGE = "Sichtbarer Text gehört in features/quick-apply/messages.ts (alle 9 Sprachen).";

const STORIES = ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)", "**/*.story.@(ts|tsx|js|jsx|mjs|cjs)"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Eigener Code: streng ───────────────────────────────────────────────
  {
    name: "bier-schneider/own-code",
    files: OWN_CODE,
    extends: [tseslint.configs.recommendedTypeCheckedOnly],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Barrierefreiheit ist im PRD Pflicht. Das Plugin selbst registriert
      // bereits eslint-config-next, hier kommen nur die strict-Regeln dazu.
      ...jsxA11y.flatConfigs.strict.rules,

      // Typsicherheit
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // Import-Hygiene
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Seiteneffekt-Importe wie "server-only" zuerst …
            ["^\\u0000(?!.*\\.css$)"],
            // … dann Pakete (react und next vorne), @harly/* eingeschlossen,
            ["^react$", "^react-dom", "^next", "^@?\\w"],
            // App-Aliase,
            ["^@/"],
            // relative Importe
            ["^\\."],
            // und CSS zuletzt, damit die Kaskade unverändert bleibt.
            ["^\\u0000.+\\.css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",

      // Allgemein
      eqeqeq: ["error", "smart"],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Tests: Mocks und Assertions dürfen locker typisiert sein.
    name: "bier-schneider/own-code-tests",
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },

  // ── Bewerber-Oberfläche: keine Klartexte ──────────────────────────────
  {
    name: "bier-schneider/applicant-ui-i18n",
    files: APPLICANT_UI,
    plugins: { i18next },
    rules: {
      // Sichtbarer JSX-Text muss aus messages.ts kommen. Erlaubt ist Text ohne
      // Buchstaben (Zahlen, Satzzeichen, Symbole, Emoji). Sprachnamen kommen
      // aus languages.ts ({l.name}) und sind damit ebenfalls erlaubt.
      "i18next/no-literal-string": ["error", { mode: "jsx-text-only", words: { exclude: [/^[^\p{L}]*$/u] } }],
      // Ergänzung: auch Klartext in sichtbaren/vorgelesenen Attributen
      // (placeholder, aria-label, title …) und als {"Text"} im JSX verbieten.
      // Werte ohne Buchstaben (z. B. "0151 1234567") bleiben erlaubt.
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/^(${VISIBLE_ATTRIBUTES})$/] > Literal[value=/\\p{L}/u]`,
          message: LITERAL_TEXT_MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name=/^(${VISIBLE_ATTRIBUTES})$/] > JSXExpressionContainer > Literal[value=/\\p{L}/u]`,
          message: LITERAL_TEXT_MESSAGE,
        },
        {
          selector: ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > Literal[value=/\\p{L}/u]",
          message: LITERAL_TEXT_MESSAGE,
        },
      ],
    },
  },

  // ── Storybook ──────────────────────────────────────────────────────────
  // Greift erst, wenn es *.stories.tsx bzw. .storybook/ gibt; solange solche
  // Dateien fehlen, ist der Block wirkungslos.
  ...storybook.configs["flat/recommended"],
  {
    name: "bier-schneider/storybook",
    files: [...STORIES, ".storybook/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      // Stories exportieren ihre Meta als Default-Export.
      "import/no-anonymous-default-export": "off",
      // Wegen --max-warnings=0 die Storybook-Warnungen direkt als Fehler führen.
      "storybook/hierarchy-separator": "error",
      "storybook/no-redundant-story-name": "error",
      "storybook/prefer-pascal-case": "error",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook-Build
    "storybook-static/**",
  ]),
]);

export default eslintConfig;
