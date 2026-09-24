# Linting und Formatierung

Dieses Dokument beschreibt, welche Linter im Bier-Schneider-Fork laufen, warum,
und wie man sie lokal ausführt.

## Grundsatz: streng für eigenen Code, Harly-Code nicht fluten

Der Fork basiert auf Harly (MIT). Der geerbte Code ist nicht nach unseren Regeln
geschrieben. Würden wir alle Regeln global einschalten, gäbe es hunderte Befunde,
und jede Korrektur würde spätere Upstream-Merges erschweren (siehe
[UPSTREAM.md](UPSTREAM.md)). Deshalb gilt:

- **Harly-Code** behält die Regeln, die er schon hatte
  (`next/core-web-vitals` + `next/typescript`). Neue Regeln kommen dort nur
  dazu, wenn sie ohne einen einzigen Befund durchlaufen.
- **Eigener Code** (Liste unten) bekommt zusätzlich strenge Regeln.
- **Formatierung** (Prettier) wird nur für die eigenen Pfade geprüft und
  angewendet.

Wichtig: `pnpm lint` läuft mit `--max-warnings=0`. Eine Warnung lässt die CI
genauso scheitern wie ein Fehler. Regeln deshalb immer als `error` oder gar
nicht einschalten.

## Eigene Pfade

| Pfad                                                       | Inhalt                                   |
| ---------------------------------------------------------- | ---------------------------------------- |
| `apps/web/src/features/quick-apply/**`                     | 60-Sekunden-Bewerbung, LKW, Texte        |
| `apps/web/src/features/funnel/**`                          | Funnel-Tracking und Report               |
| `apps/web/src/features/mobile-admin/**`                    | HR-Bereich mobil (siehe MOBILE-ADMIN.md) |
| `apps/web/src/app/(public)/apply/**`                       | Bewerbungsseite (Harly-Datei, ergänzt)   |
| `apps/web/src/app/(public)/jobs/[slug]/**`                 | Stellenseite (Harly-Datei, ergänzt)      |
| `apps/web/src/app/api/public/funnel/**`                    | Funnel-API                               |
| `apps/web/src/app/(dashboard)/dashboard/reports/funnel/**` | Funnel-Report im Dashboard               |
| `apps/web/src/lib/notify/webhook-hosts*`                   | SSRF-Härtung für Webhooks                |
| `packages/db/scripts/seed-bier-schneider.ts`               | Seed-Daten (nur Prettier)                |
| `docs/bier-schneider/**`                                   | Doku (Prettier, markdownlint)            |

## Werkzeuge

| Werkzeug                         | Version | Lizenz                                                  | Prüft                                     |
| -------------------------------- | ------- | ------------------------------------------------------- | ----------------------------------------- |
| ESLint                           | 9.39    | MIT                                                     | TypeScript/React in `apps/web`            |
| eslint-config-next               | 16.2.12 | MIT                                                     | Next.js-Regeln (ganzer Code)              |
| typescript-eslint                | 8.59    | MIT                                                     | type-aware Regeln (eigener Code)          |
| eslint-plugin-jsx-a11y           | 6.10    | MIT                                                     | Barrierefreiheit, `strict` (eigener Code) |
| eslint-plugin-simple-import-sort | 14      | MIT                                                     | Import-Reihenfolge (eigener Code)         |
| eslint-plugin-i18next            | 6.1     | ISC                                                     | Klartexte in der Bewerber-Oberfläche      |
| eslint-plugin-storybook          | 10.6    | MIT                                                     | `*.stories.tsx`, `.storybook/`            |
| Prettier                         | 3.8     | MIT                                                     | Formatierung (nur eigene Pfade)           |
| Stylelint + config-standard      | 17 / 40 | MIT                                                     | `apps/web/src/features/**/*.css`          |
| markdownlint-cli2                | 0.23    | MIT                                                     | `docs/bier-schneider/**/*.md`             |
| actionlint (+ shellcheck)        | 1.7.12  | MIT (shellcheck: GPL-3.0, nur in der CI vorinstalliert) | `.github/workflows/*.yml`                 |

Hinweis: `apps/web` nutzt ESLint 9 (eigene Abhängigkeit), das Root-Paket führt
ESLint 10. Die gewählten Plugins sind laut Peer-Angaben bzw. Quellcode auch
mit ESLint 10 nutzbar.
`eslint-plugin-jsx-a11y` nennt ESLint 10 noch nicht als Peer; das Plugin wird
aber ohnehin schon von `eslint-config-next` geladen.

## Lokal ausführen

```bash
pnpm lint            # ESLint (turbo, alle Pakete) – inkl. a11y, type-aware, i18n
pnpm format:check    # Prettier, nur eigene Pfade
pnpm format          # Prettier, eigene Pfade formatieren
pnpm lint:css        # Stylelint für apps/web/src/features/**/*.css
pnpm lint:md         # markdownlint für docs/bier-schneider
pnpm lint:actions    # actionlint (Binary muss im PATH liegen, siehe unten)
```

Einzelne Dateien mit Autofix (z. B. Import-Sortierung):

```bash
cd apps/web && npx eslint --fix src/features/quick-apply
```

actionlint ist ein Go-Binary und kein npm-Paket. Installation z. B. mit dem
offiziellen Skript:

```bash
bash <(curl -sSfL https://raw.githubusercontent.com/rhysd/actionlint/v1.7.12/scripts/download-actionlint.bash) 1.7.12 ~/.local/bin
```

Ist `shellcheck` installiert, prüft actionlint auch die `run:`-Skripte. In der
CI (ubuntu-latest) ist shellcheck vorhanden, lokal sollte man es deshalb auch
installieren, sonst fallen Befunde erst in der CI auf.

## Was ESLint wo prüft

Konfiguration: `apps/web/eslint.config.mjs`.

**Ganzer Code (Harly und eigener):** `next/core-web-vitals`, `next/typescript`
wie bisher. `eslint-config-next` bleibt auf 16.2.12 gepinnt, weil 16.3 im
Harly-Code neue Befunde (`no-location-assign-relative-destination`) meldet.

**Eigener Code (`OWN_CODE`):**

- `jsx-a11y` im Modus `strict` (Barrierefreiheit ist im PRD Pflicht).
- `typescript-eslint` `recommendedTypeChecked`: u. a. `no-floating-promises`,
  `no-misused-promises`, `no-unsafe-*`, `no-base-to-string`,
  `no-unnecessary-type-assertion`.
- Zusätzlich `consistent-type-imports` (inline), `consistent-type-exports`,
  `no-import-type-side-effects`, `switch-exhaustiveness-check`,
  `prefer-optional-chain`, `eqeqeq`, `no-console` (außer `warn`/`error`).
- Import-Hygiene: `simple-import-sort` (Gruppen: Seiteneffekte, Pakete mit
  `react`/`next` vorne, `@/…`, relative Importe, CSS zuletzt),
  `import/first`, `import/newline-after-import`, `import/no-duplicates`.
- Tests (`*.test.ts`) dürfen `no-unsafe-*` und `unbound-method` verletzen.

**Bewerber-Oberfläche (`APPLICANT_UI` = `features/quick-apply/**/\*.tsx`):\*\*

- `i18next/no-literal-string` (Modus `jsx-text-only`): kein sichtbarer Text im
  JSX. Erlaubt ist Text ohne Buchstaben (Zahlen, Satzzeichen, Symbole, Emoji).
  Sprachnamen kommen aus `languages.ts` über `{l.name}` und sind damit erlaubt.
- `no-restricted-syntax`: auch keine Buchstaben-Literale in sichtbaren oder
  vorgelesenen Attributen (`placeholder`, `title`, `alt`, `label`,
  `aria-label`, `aria-description`, `aria-valuetext`,
  `aria-roledescription`) und keine `{"Text"}`-Kinder.
- Neue Texte kommen in `features/quick-apply/messages.ts`, und zwar für alle
  9 Sprachen (de, de-easy, en, pl, ro, uk, ru, tr, ar). Der Test in
  `quick-apply.test.ts` prüft, dass alle Sprachen dieselben Schlüssel haben.

**Storybook:** `eslint-plugin-storybook` (`flat/recommended`) für
`*.stories.*` und `.storybook/`. Die Warn-Regeln des Plugins sind auf `error`
gehoben (wegen `--max-warnings=0`). Solange es keine Stories gibt, ist der
Block wirkungslos.

## Einen weiteren Pfad aufnehmen

1. In `apps/web/eslint.config.mjs` den Glob in `OWN_CODE` ergänzen (für
   Bewerber-Oberflächen zusätzlich in `APPLICANT_UI`). In ESLint-Globs müssen
   `[` und `]` escaped werden: `"src/app/(public)/jobs/\\[slug\\]/**"`.
2. Den Pfad in `package.json` in den Skripten `format` und `format:check`
   ergänzen (in Anführungszeichen, wenn Klammern vorkommen).
3. Soll der Pfad mit `printWidth: 120` formatiert werden (neue eigene Dateien),
   den Glob in `.prettierrc.json` unter `overrides` eintragen. In
   Prettier-Globs müssen `(`, `)`, `[` und `]` escaped werden. Von Harly
   übernommene Dateien bleiben beim Standard (80), damit Upstream-Merges klein
   bleiben.
4. `pnpm format` und `cd apps/web && npx eslint --fix <pfad>` ausführen, die
   restlichen Befunde von Hand beheben. Regeln nicht abschalten; eine
   begründete Ausnahme per `eslint-disable-next-line … -- Grund` nur, wenn es
   fachlich keine Lösung gibt (Beispiel: eigene Sprachnachricht ohne
   Untertitel in `QuickApply.tsx`).
5. `pnpm lint` muss mit 0 Fehlern und 0 Warnungen durchlaufen.

Neue CSS-Dateien unter `apps/web/src/features/` prüft Stylelint automatisch.
Klassen folgen dem Muster `bs-block__element--modifier`.

## CI

`.github/workflows/ci.yml`:

- Job **Lint**: `pnpm lint` (ESLint inkl. a11y, type-aware, i18n).
- Job **Lint (Bier-Schneider)**: `pnpm format:check`, `pnpm lint:css`,
  `pnpm lint:md` und actionlint in fester Version.

## Bewusst nicht eingerichtet

- **Pre-Commit-Hooks (lint-staged, simple-git-hooks):** `simple-git-hooks`
  schreibt bei `pnpm install` nach `.git/hooks`. Das gilt für alle
  Git-Worktrees desselben Repos und würde parallele Arbeitsstände
  überraschend verändern; außerdem läuft `pnpm install` auch im Docker-Build.
  `lint-staged` 17 verlangt zudem Node ≥ 22.22.1. Die CI deckt alle Checks ab.
  Wer lokal einen Hook möchte, kann `.git/hooks/pre-commit` selbst anlegen, z. B.
  mit `pnpm format:check && pnpm lint:css`.
- **Stylelint für `globals.css`:** Tailwind-4-Syntax (`@theme`,
  `@custom-variant`, `@apply`) würde ohne eigenes Regelwerk nur Fehlalarme
  erzeugen, außerdem ist es Harly-Code.
- **Prettier für den ganzen Code:** würde fast jede Harly-Datei ändern.
