# Abhängigkeiten & Dependabot

Konfiguration: [`.github/dependabot.yml`](../../.github/dependabot.yml) (gegen das
SchemaStore-Schema `dependabot-2.0` validiert).

## Regeln

| Regel | Umsetzung | Warum |
|---|---|---|
| **Mindestalter 7 Tage** | `cooldown` 7 Tage für Patch/Minor, 14 Tage für Major, in allen Ökosystemen | Frische Releases werden öfter zurückgezogen oder sind kompromittiert (Supply-Chain-Angriffe). Sicherheitsupdates sind **ausgenommen** und kommen sofort. |
| **Immer LTS** | Node-Image und `@types/node`: ungerade Hauptversionen (23, 25, 27 …) ignoriert; `.nvmrc` = 22; `engines.node >= 22` | Der Raspberry Pi läuft produktiv – nur Versionen mit Langzeit-Support. |
| **Gruppierung** | Minor/Patch je Ökosystem als ein PR; Sicherheitsupdates als eigene Gruppe; alle Actions in einem PR | Wenige, gut reviewbare PRs statt Dutzender Einzel-PRs. |
| **Planbarkeit** | Montag 06:00 Europe/Berlin, PR-Limit 3–5 | Updates kommen gebündelt zum Wochenstart. |
| **Saubere Historie** | Conventional-Commit-Präfixe (`deps`, `deps-dev`, `ci`, `docker`) mit Scope, Labels je Ökosystem | Lesbare `git log`-Historie, filterbare PRs. |
| **Konsistente Manifeste** | `versioning-strategy: increase` | `package.json`-Ranges und Lockfile passen immer zusammen. |
| **Bewusste Majors** | `next`/`eslint-config-next` und PostgreSQL-Majors werden ignoriert | Next-Major gemeinsam mit Harly-Upstream; Postgres-Major braucht Dump/Restore. |

Reviewer werden über [`CODEOWNERS`](../../.github/CODEOWNERS) zugewiesen (die frühere
`reviewers`-Option in `dependabot.yml` ist veraltet).

## Umgang mit Dependabot-PRs

1. CI muss grün sein (Lint, Typecheck, Tests, Build, Migrationskette, Image, CodeQL).
2. Gruppen-PRs per **Rebase** mergen (lineare Historie).
3. Major-Updates: Changelog lesen, lokal `pnpm build` + `pnpm test`, ggf. eigenes Issue.
4. Node-LTS-Wechsel (z. B. 22 → 24): `.nvmrc`, `engines`, `Dockerfile`, CI-`node-version` gemeinsam in einem PR.
