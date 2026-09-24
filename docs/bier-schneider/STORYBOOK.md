# Storybook

Storybook zeigt die Oberflächen der öffentlichen Bier-Schneider-Seiten ohne Server,
Datenbank und Netzwerk. Zuerst ist die 60-Sekunden-Bewerbung (Kurzbewerbung) drin.
Die restlichen Seiten (Stellenliste, Stellenseite, Karriereseite, Admin-Bereiche)
kommen später dazu.

- Framework: `@storybook/nextjs-vite` 10.6 (Vite, kein Turbopack)
- Addons: Barrierefreiheit (`@storybook/addon-a11y`) und Tests (`@storybook/addon-vitest`)
- Konfiguration: `apps/web/.storybook/`

## Starten

```bash
pnpm storybook                        # im Repo-Wurzelverzeichnis, http://localhost:6006
pnpm --filter web storybook           # dasselbe direkt im Web-Paket
pnpm --filter web build-storybook     # statischer Build nach apps/web/storybook-static/
pnpm --filter web test-storybook      # alle Stories + play-Functions in Chromium
```

`test-storybook` braucht ein Chromium von Playwright
(`pnpm --filter web exec playwright install chromium`). Liegt schon eines auf der Maschine,
reicht `STORYBOOK_CHROMIUM_PATH=/pfad/zu/chrome pnpm --filter web test-storybook`.

## Sprache wechseln

In der Toolbar oben gibt es den Globus „Sprache“ mit allen 9 Sprachen der
Kurzbewerbung (Deutsch, Leichte Sprache, Englisch, Polnisch, Rumänisch, Ukrainisch,
Russisch, Türkisch, Arabisch). Ein Decorator setzt `lang` und `dir` passend, bei
Arabisch also `dir="rtl"`. Stories, die ausdrücklich Arabisch zeigen („Arabisch (RTL)“),
legen die Sprache selbst fest. Dort lässt sich die Toolbar nicht umstellen.

## Viewport wechseln

Das Viewport-Menü in der Toolbar bietet „Handy 360“, „Handy 390“, „Tablet 768“ und
„Desktop 1280“. Standard ist „Handy 390“.

## Server-Actions und Tracking

In `.storybook/preview.tsx` ersetzt `sb.mock(...)` diese Module durch die Dateien im
jeweiligen `__mocks__/`-Ordner:

| Modul | Mock |
| --- | --- |
| `src/features/quick-apply/actions.ts` | `src/features/quick-apply/__mocks__/actions.ts` |
| `src/features/funnel/client.ts` | `src/features/funnel/__mocks__/client.ts` |

Die Mocks sind Spies (`fn()` aus `storybook/test`). Ihre Aufrufe stehen im Panel
„Actions“. Das Absenden steuert eine Story über `parameters.quickApplyMock`:

```ts
parameters: {
  quickApplyMock: {
    submit: "errorDuplicate", // "success" oder ein Fehlerschlüssel aus QuickApplyErrorKey
    delayMs: 300,             // Wartezeit der Server-Action
    upload: "success",        // Ergebnis des Nachweis-Uploads auf der Danke-Seite
  },
},
```

Wichtig: In `__mocks__`-Dateien sind relative Imports nur als `import type` erlaubt.
Storybook liefert die Datei unter dem Pfad des Originalmoduls aus, deshalb würden
relative Laufzeit-Imports falsch aufgelöst.

## Neue Stories anlegen

1. Die Datei kommt neben die Komponente: `Komponente.stories.tsx`. Storybook findet alle
   `src/**/*.stories.tsx`.
2. Als Titel eine Gruppe mit Unterpunkt wählen, z. B. `title: "Stellenseite/JobList"`.
3. Die Sprache kommt aus `globals.language`, nicht aus einem eigenen Arg:

   ```tsx
   render: (args, { globals }) => {
     const language = isQuickApplyLanguage(globals.language) ? globals.language : "de";
     return <MeineKomponente {...args} language={language} />;
   },
   ```

4. Beispieldaten gehören in eine eigene `fixtures.ts` neben der Komponente. Aus
   Server-Dateien (`data.ts`, `import "server-only"`) nur Typen importieren.
5. Greift eine Komponente auf Server-Actions, DB oder `fetch` zu, braucht das Modul einen
   Mock: eine Datei in `__mocks__/` neben dem Modul und ein `sb.mock("../src/…/modul.ts")`
   in `.storybook/preview.tsx`.
6. Abläufe testen `play`-Functions mit `storybook/test` (`userEvent`, `expect`, `within`).
   `pnpm --filter web test-storybook` führt sie aus, in der CI auch der Job „Storybook build“.
7. Vor dem Commit laufen lassen: `npx tsc --noEmit -p .` und `npx eslint . --max-warnings=0`
   (in `apps/web`).

## Hinweise

- Das a11y-Addon meldet Verstöße im Panel „Accessibility“. Tests scheitern daran noch nicht
  (`a11y.test: "todo"`). Stand heute meldet es: der Fortschrittsbalken (`RoadProgress`) hat
  keinen zugänglichen Namen, und während Einblend-Animationen gibt es Kontrastwarnungen.
- Nach `build-storybook` liegt `apps/web/storybook-static/` im Web-Paket. Solange die
  ESLint-Konfiguration das Verzeichnis nicht ignoriert, prüft `eslint .` auch den Build.
  Also vorher löschen oder `--ignore-pattern "storybook-static/**"` anhängen.
