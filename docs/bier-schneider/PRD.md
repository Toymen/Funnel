# Product Requirements Document – Recruiting Funnel Bier-Schneider

**Version:** 2.0 (September 2026)
**Status:** MVP in Umsetzung – Pull Request „Recruiting-Funnel Bier-Schneider auf Basis von Harly“
**Plattform:** Raspberry Pi 5 (Hosting) · Entwicklung auf Mac/PC
**Basis:** Fork von [Harly](https://github.com/Vytral/harly) (MIT)
**Unternehmen:** Bier-Schneider GmbH & Co. KG, Mülheim-Kärlich

---

## 0. Was ist neu gegenüber Version 1.0?

| Thema                 | v1.0                                                  | v2.0                                                                                                                                              |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codebasis             | Eigenentwicklung (React-SPA + Fastify)                | **Fork von Harly** (Next.js, Drizzle, PostgreSQL 16, MIT). HR-Backend, Pipeline, Reports und DSGVO-Werkzeuge sind schon vorhanden                 |
| Zielgruppe Bewerbende | Standard-Formular                                     | **Barrierearm**: wenig Deutschkenntnisse, sehr kurze Aufmerksamkeitsspanne                                                                        |
| Sprachen              | Phase 2                                               | **MVP**: DE, Leichte Sprache, EN, PL, RO, UK, RU, TR, AR (RTL)                                                                                    |
| Bewerbung             | 4 Schritte, viele Pflichtfelder                       | **60-Sekunden-Bewerbung**: eine Frage pro Bildschirm. Pflicht sind nur Vorname und Telefon _oder_ E-Mail. Alternativ Rückruf oder Sprachnachricht |
| Gestaltung            | neutral                                               | **verspielt**: Ein LKW fährt über Button und Seite, sobald eine Eingabe gemacht wurde                                                             |
| KI                    | ausgeschlossen                                        | **optional einbindbar** (Scaffold), nie notwendig, nie zur Bewerberbewertung                                                                      |
| Deployment            | Build auf dem Pi (`git pull && docker compose build`) | **Build auf Mac/PC bzw. in GitHub Actions**, der Pi zieht nur fertige arm64-Images                                                                |
| Mobile                | nicht spezifiziert                                    | **Bewerber- und Admin-Ansicht mobil erstklassig** (ab 360 px)                                                                                     |
| Projektorganisation   | –                                                     | GitHub: Issues, Pull Requests, CI, CodeQL, Dependabot, Push Protection, GHCR                                                                      |

---

## 1. Produktvision

Bier-Schneider betreibt eine eigene Recruiting-Plattform auf einem Raspberry Pi. Offene Stellen werden veröffentlicht, Bewerbungen entgegengenommen und Bewerbende durch einen definierten Prozess geführt. Gleichzeitig wird gemessen, **an welcher Stelle Interessierte abspringen**.

Leitsatz für die Bewerberseite:

> **Wer einen LKW fahren kann, muss sich auch in einer Minute bewerben können – in seiner Sprache, am Handy, ohne Lebenslauf.**

## 2. Problemstellung

Unverändert gegenüber v1.0 (fehlende Transparenz über Aufrufe, Starts, Abschlüsse, Phasen, Dauer und Kanäle). Hinzu kommt:

- Viele geeignete Kandidaten für Fahrer- und Lagerjobs sprechen wenig Deutsch.
- Klassische Formulare mit Anschreiben und Lebenslauf schrecken ab und werden am Handy abgebrochen.
- Zur Zielgruppe gehören auch Menschen mit geringer Lese- und Schreibkompetenz sowie Menschen mit sehr kurzer Aufmerksamkeitsspanne.

## 3. Produktziel und Funnel

Der zentrale Funnel bleibt:

```text
Stellenanzeige gesehen → Stellendetails geöffnet → Bewerbung begonnen → Bewerbung abgeschickt
→ Bewerbung geprüft → Kontakt aufgenommen → Vorstellungsgespräch → Angebot → Einstellung
```

Neu hinzu kommen Zwischenstufen innerhalb der Bewerbung (Drop-off pro Frage), siehe §9.

## 4. Benutzergruppen

| Gruppe                 | Zugang                                 | Neu in v2                                           |
| ---------------------- | -------------------------------------- | --------------------------------------------------- |
| Bewerbende             | ohne Account                           | Sprachwahl, Kurzbewerbung, Rückruf, Sprachnachricht |
| Personalabteilung (HR) | Login (Harly: Passwort, MFA, Passkeys) | mobile Nutzung vom Handy aus, Ein-Tipp-Rückruf      |
| Administrator          | Login, Rolle Owner/Admin               | –                                                   |

Harly bringt zusätzlich Rollen wie Hiring Manager, eigene Rollen und SSO mit. Sie werden im MVP nicht aktiv genutzt.

---

## 5. Barrierearme Bewerbung („60-Sekunden-Bewerbung“)

### 5.1 Prinzipien

1. **Eine Frage pro Bildschirm.** Nie mehr als ein Eingabeelement gleichzeitig sichtbar.
2. **Bilder vor Text.** Jede Frage hat ein Piktogramm. Ja/Nein-Fragen sind zwei große Karten (👍/👎) statt Radio-Buttons.
3. **Große Ziele.** Tap-Flächen mindestens 56 × 56 px, Schrift mindestens 18 px, hoher Kontrast (WCAG 2.2 AA).
4. **Minimal-Pflicht.** Pflicht sind nur **Vorname** und **Telefon oder E-Mail** sowie die Bestätigung des Datenschutzhinweises. Alles andere ist optional.
5. **Maximal 4 Schritte** bis zum Absenden, sichtbar als Straße mit LKW.
6. **Nichts geht verloren.** Autosave im Browser. Wer abbricht und zurückkommt, macht weiter, wo er aufgehört hat.
7. **Vorlesen.** Ein 🔊-Button pro Frage liest den Text vor (Browser-SpeechSynthesis, offline, kostenlos).
8. **Fehlertexte sagen, was zu tun ist,** in der gewählten Sprache und ohne Fachbegriffe.

### 5.2 Ablauf

```text
[Sprache wählen]  →  [Wie möchten Sie sich bewerben?]
                          ├─ ⚡ Schnell (Name + Telefon, 2–3 Ja/Nein-Fragen)
                          ├─ 📞 Ruft mich an (Name + Telefon + Wunschzeit)
                          └─ 🎤 Sprachnachricht (max. 60 s statt Tippen)
                     →  [Fragen zur Stelle, je 1 Bildschirm]
                     →  [Datenschutz bestätigen + Absenden]
                     →  🚚 LKW fährt über die Seite → „Danke! Wir rufen Sie an.“
```

Optional nach dem Absenden: „Möchten Sie noch etwas hochladen?“ Hier sind Lebenslauf und Führerschein-Foto möglich, direkt mit der Handykamera (`capture="environment"`).

### 5.3 Sprachen

| Code      | Sprache         | Hinweis                                             |
| --------- | --------------- | --------------------------------------------------- |
| `de`      | Deutsch         | Standard                                            |
| `de-easy` | Leichte Sprache | kurze Sätze, ein Gedanke pro Satz                   |
| `en`      | English         |                                                     |
| `pl`      | Polski          |                                                     |
| `ro`      | Română          |                                                     |
| `uk`      | Українська      |                                                     |
| `ru`      | Русский         |                                                     |
| `tr`      | Türkçe          |                                                     |
| `ar`      | العربية         | **RTL-Layout**, der LKW fährt von rechts nach links |

- Sprachwahl erfolgt über **Sprachnamen in eigener Schreibweise**, keine Flaggen (Flaggen stehen für Länder, nicht für Sprachen).
- Die Sprache wird aus `Accept-Language` vorgeschlagen und kann jederzeit gewechselt werden.
- Übersetzungen der Oberfläche liegen als Code-Dateien im Repo und werden von Muttersprachlern geprüft (Issue-Vorlage „Übersetzung prüfen“).
- Die gewählte Sprache wird an der Bewerbung gespeichert. HR sieht sie als Badge und weiß, in welcher Sprache sie zurückrufen sollte.

### 5.4 Stellenseite

Oben, ohne Scrollen sichtbar:

```text
[Illustration / Piktogramm LKW]
LKW-Fahrer
💶 ab 3.100 €   🕐 Mo–Fr ab 6 Uhr   📍 Mülheim-Kärlich
[ 🚚 Jetzt in 1 Minute bewerben ]
```

Erst darunter folgen Aufgaben, Anforderungen und Leistungen als kurze Listen mit Icons.

---

## 6. Verspielte Gestaltung

### 6.1 Der LKW

- Ein eigener **SVG-LKW** im Bier-Schneider-Stil mit Getränkekisten auf der Ladefläche.
- **Nach jeder abgeschlossenen Eingabe** fährt der LKW auf der Fortschrittsstraße eine Station weiter.
- **Beim Absenden** fährt er einmal quer über die ganze Seite, mit Abgaswölkchen. Danach erscheint die Bestätigung.
- **Beim Tippen auf „Jetzt bewerben“** rollt ein Mini-LKW über den Button, bevor die Bewerbung startet.
- Umsetzung mit CSS und der Web Animations API. Keine schwere Animationsbibliothek, damit die Seite auch auf alten Handys flüssig läuft.
- `prefers-reduced-motion: reduce` → keine Fahrt, stattdessen ein statischer Haken.
- Die Animation blockiert nie die Eingabe (max. 900 ms, jederzeit überspringbar).

### 6.2 Designrichtung

Die Gestaltung folgt dem Skill `.claude/skills/frontend-design` (Apache-2.0):

- **Farben aus der Welt des Unternehmens:** Kisten-Gelb, Brauerei-Blau, Asphalt-Grau, Fahrbahn-Weiß. Keine generischen Verläufe.
- **Schrift:** Atkinson Hyperlegible (OFL, speziell für Lesbarkeit entwickelt) für Fließtext. Arabisch/Kyrillisch per System- bzw. Noto-Fallback. Alle Schriften selbst gehostet, keine Google-Fonts-Einbindung (DSGVO).
- **Ein mutiges Element:** die Straße mit dem LKW. Alles andere bleibt ruhig.

### 6.3 Illustrationen mit offenen Modellen

- Stellen-Illustrationen werden **einmalig auf dem Mac/PC** mit offenen Bildmodellen von Hugging Face erzeugt, z. B. [Z-Image-Turbo](https://hf.co/Tongyi-MAI/Z-Image-Turbo) oder [FLUX.1-schnell](https://hf.co/black-forest-labs/FLUX.1-schnell), beide Apache-2.0.
- SVG-Icons können zusätzlich mit [OmniSVG](https://hf.co/OmniSVG/OmniSVG1.1_4B) (Apache-2.0) erzeugt werden.
- Die Ergebnisse werden als WebP bzw. SVG ins Repo übernommen. Zur Laufzeit wird **keine** KI benötigt.
- Fallback: handgebaute SVG-Illustrationen.
- Modelle mit nicht-kommerzieller Lizenz (z. B. `-NC`) sind ausgeschlossen.

---

## 7. Öffentlicher Bereich (Mapping auf Harly)

| PRD           | Route          | Harly                                                                                   |
| ------------- | -------------- | --------------------------------------------------------------------------------------- |
| Karriereseite | `/jobs`        | vorhanden, wird um Sprachwahl und Piktogramme erweitert                                 |
| Stellendetail | `/jobs/:slug`  | vorhanden, Kopfbereich nach §5.4                                                        |
| Bewerbung     | `/apply/:slug` | Harly-Formular bleibt als „ausführliche Bewerbung“, **neu:** Kurzbewerbung als Standard |
| Rechtstexte   | `/legal/:page` | vorhanden (Workspace-Rechtstexte)                                                       |

## 8. Bewerbungs-ID

Harly vergibt UUIDs. Zusätzlich wird für die Anzeige die laufende Nummer `BS-2026-000001` erzeugt (siehe v1 §12).

## 9. Funnel-Tracking

### 9.1 Ereignisse

Browser-Ereignisse, anonym:

```text
page_view, job_view, language_selected, application_started, quick_apply_chosen,
callback_requested, voice_recorded, step_viewed, application_step_completed
```

Server-Ereignisse:

```text
application_submitted, candidate_reviewed, candidate_contacted, interview_scheduled,
interview_completed, offer_created, hired, rejected, withdrawn
```

Die Server-Ereignisse der HR-Phasen werden aus Harlys `application_stage_history` abgeleitet (Stage-Typ → Funnel-Stufe).

### 9.2 Datenmodell `funnel_events`

```text
id, workspace_id, session_id, job_id, application_id, event_type,
utm_source, utm_medium, utm_campaign, metadata (jsonb: step, language, mode), created_at
```

- **Keine personenbezogenen Daten.** Die `session_id` ist eine zufällige UUID aus dem `sessionStorage` des Browsers, ohne Cookie und ohne IP-Speicherung.
- Erst beim Absenden entsteht eine Bewerbung. Diese übernimmt `utm_*` in Harlys Feld `applications.source`.
- Kernprinzip bleibt: **Bewerbung ≠ Funnel-Event.**

### 9.3 Quellen und QR-Codes

UTM-Parameter wie in v1 §20/§21. Neu kommt ein **QR-Link-Generator** im Admin-Bereich für LKW-Planen, Flyer und Getränkemärkte (`utm_medium=qr`).

## 10. Auswertung

- Harly-Reports bleiben bestehen.
- **Neuer Report „Funnel“** mit Stufen, Conversion Rates (Berechnung wie v1 §46), **Drop-off pro Frage**, Quellenvergleich, Stellenvergleich und Zeitraumfilter (heute, 7 Tage, 30 Tage, Jahr, benutzerdefiniert).
- Mobil als gestapelte Balken, auf dem Desktop als Trichter.

---

## 11. HR-Bereich (Harly)

Vorhanden und für das MVP genutzt:

- Stellenverwaltung (erstellen, bearbeiten, veröffentlichen, pausieren, archivieren, duplizieren)
- Bewerbungsfragen je Stelle
- Pipeline/Kanban mit Stufen, historisierten Statuswechseln und Audit-Log
- Bewerberliste mit Suche und Filtern
- Bewerberdetail mit Dokumenten, Historie und Notizen
- Dashboard

Ergänzungen:

- Badges für **Sprache** und **Modus** (Schnell, Rückruf, Sprachnachricht)
- **Ein-Tipp-Aktionen** „Anrufen“ (`tel:`) und „SMS“ (`sms:`), bei Rückrufwunsch mit der Wunschzeit
- **Audioplayer** für Sprachnachrichten, optional mit Transkript (§13)
- Übersetzbare Bewerbungsfragen: Fragetext je Sprache

### 11.1 Mobile Anforderungen (Admin und Bewerbende)

- Alle Seiten ab **360 px** Breite nutzbar, ohne horizontales Scrollen der Seite.
- Tabellen werden auf dem Handy zu Karten.
- Kanban auf dem Handy als wischbare Spalten (Scroll-Snap). Der Statuswechsel läuft über ein Auswahlfeld statt Drag & Drop.
- Primäraktionen sind mit dem Daumen erreichbar (untere Bildschirmhälfte).
- Geprüft wird automatisiert per Playwright-Screenshots bei 390 × 844 in der CI.

Umsetzung, Audit (vorher/nachher) und offene Punkte: [MOBILE-ADMIN.md](MOBILE-ADMIN.md).

## 12. Datenmodell

Harlys Schema bleibt maßgeblich (`packages/db/src/schema.ts`). Ergänzungen:

| Tabelle                 | Feld                   | Zweck                                                          |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| `applications`          | `language`             | gewählte Sprache                                               |
| `applications`          | `apply_mode`           | `quick` \| `full` \| `callback` \| `voice`                     |
| `applications`          | `callback_window`      | `morning` \| `midday` \| `afternoon` \| `evening` \| `anytime` |
| `applications`          | `display_number`       | `BS-2026-000001`                                               |
| `application_questions` | `translations` (jsonb) | Fragetext je Sprache                                           |
| `application_questions` | `icon`                 | Piktogramm-Schlüssel                                           |
| `jobs`                  | `translations` (jsonb) | Titel und Kurztexte je Sprache                                 |
| neu                     | `funnel_events`        | siehe §9.2                                                     |

## 13. Optionale KI (Scaffold)

- **Standard: aus.** Alle Funktionen der Seite laufen ohne KI.
- Harly unterstützt bereits KI-Anbieter mit eigener `baseURL`. Damit lässt sich ein **lokaler OpenAI-kompatibler Server auf dem Pi** anbinden, z. B. `llama.cpp` mit [Qwen3-1.7B-GGUF](https://hf.co/Qwen/Qwen3-1.7B-GGUF) (Apache-2.0, ca. 1,1 GB).
- Vorgesehene Hilfen, immer mit menschlicher Prüfung:
  - Stellentext in Leichte Sprache umformulieren bzw. übersetzen (HR-Seite)
  - Sprachnachricht transkribieren mit [faster-whisper-small](https://hf.co/Systran/faster-whisper-small) (MIT) über einen OpenAI-kompatiblen Transkriptionsserver
- **Ausgeschlossen:** automatische Bewertung, Ranking oder Aussortieren von Bewerbenden. Das wäre Hochrisiko-KI nach EU AI Act und ist nicht gewollt. Harlys Matching- und Bewertungsfunktionen bleiben deaktiviert.
- Auf dem Pi läuft die KI als eigenes Compose-Profil `ai`. Ohne dieses Profil wird nichts gestartet.

---

## 14. Technische Architektur

```text
Mac/PC (Entwicklung)                 GitHub                          Raspberry Pi 5 (Hosting)
────────────────────                 ──────                          ────────────────────────
pnpm dev (Next.js + Postgres)  ──►  PR → CI (Typen, Tests, Build,   docker compose pull
                                     Migrationen, CodeQL)            docker compose up -d
                                     merge → GHCR-Image linux/arm64 ─►  caddy ─► app (Next.js)
                                                                              ├─ scheduler
                                                                              ├─ postgres 16
                                                                              └─ [ai-Profil: llama.cpp, whisper]
```

- **Frontend und Backend:** Next.js App Router (Harly). Die öffentliche API liegt unter `/api/...`.
- **Datenbank:** PostgreSQL 16 mit Drizzle-Migrationen.
- **Speicher:** `STORAGE_PROVIDER=local`, Volume auf NVMe-SSD. Kein S3 nötig.
- **Reverse Proxy:** Caddy mit automatischem HTTPS (Compose-Profil `proxy`).
- **Speicherbudget Pi 5 / 8 GB:** Postgres 768 MB, App 1,5 GB, Scheduler 256 MB, Caddy 256 MB. Das ergibt etwa 3 GB, dazu optional KI mit etwa 2,5 GB.

## 15. Entwicklung und Deployment

- **Entwicklung auf Mac/PC:** `pnpm install`, `pnpm dev` (startet Postgres per Docker, Migrationen, Next.js). Siehe `docs/bier-schneider/ENTWICKLUNG.md`.
- **Build:** GitHub Actions baut bei jedem Merge auf `main` das Image `ghcr.io/toymen/funnel:edge` für `linux/arm64`. Versions-Tags `v*` bauen `amd64` und `arm64`, mit SBOM, Provenance und Trivy-Scan.
- **Alternativ lokal:** `docker buildx build --platform linux/arm64 -t ghcr.io/toymen/funnel:dev --push .`. Auf Apple Silicon läuft das nativ ohne Emulation.
- **Pi:** Nur `compose.yaml`, `.env` und `Caddyfile` liegen dort. Ein Update ist `docker compose pull && docker compose up -d`. Kein Node, kein Git, kein Build auf dem Pi. Siehe `docs/bier-schneider/BETRIEB.md`.
- **Workstation als Ausweichhost:** Das Image ist Multi-Arch (arm64 + amd64). Reicht der Pi nicht, laufen dieselben Container mit dem Host-Profil `workstation` (größere Limits) auf einer Workstation; Umzug per Backup/Restore.
- **Hardware:** Raspberry Pi 5 mit 8 GB und NVMe-SSD. Raspberry Pi OS Lite 64 Bit.

## 16. Projektorganisation auf GitHub

| Funktion                          | Einsatz                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Issues + Unter-Issues             | Backlog, Epic #1 mit Arbeitspaketen                                                     |
| Issue-Vorlagen                    | Bug, Feature, Bewerber-Feedback, Übersetzung prüfen                                     |
| Pull Requests                     | jede Änderung per PR mit Vorlage, CODEOWNERS-Review                                     |
| GitHub Actions CI                 | Lint, Typecheck, Tests, Production-Build, Postgres-Migrationskette, Image-Build + Trivy |
| CodeQL                            | Sicherheitsanalyse bei jedem PR und wöchentlich                                         |
| Dependabot                        | wöchentliche Updates für npm, Actions und Docker, gruppiert, mit Cooldown               |
| Secret Scanning / Push Protection | aktiv. Hat bereits ein fremdes Token in der Harly-Historie abgefangen                   |
| GHCR                              | arm64-Images für den Pi, mit Attestierung                                               |
| Labels als Code                   | `.github/labels.yml` + Workflow                                                         |

## 17. Sicherheit, Datenschutz, Betrieb

Die Anforderungen aus v1 §37–§45 gelten weiter. Harly deckt sie weitgehend ab: Argon2/Better Auth, MFA, Rate-Limits, Audit-Log, Einwilligungsnachweise, Aufbewahrungsfristen, Export, Löschung, Backups per CLI, Health-Checks.

Ergänzend:

- Sprachnachrichten sind personenbezogene Daten. Sie unterliegen derselben Löschfrist wie Dokumente, und im Datenschutzhinweis wird eigens auf die Aufnahme hingewiesen.
- Funnel-Events enthalten keine IP-Adressen und setzen keine Cookies. Deshalb ist kein Cookie-Banner nötig; eine rechtliche Prüfung erfolgt über Issue #9.
- Schriften, Icons und Illustrationen werden selbst gehostet. Die Seite lädt keine Drittanbieter-Ressourcen.

## 18. Open-Source-Komponenten

| Komponente                                                     | Lizenz             |
| -------------------------------------------------------------- | ------------------ |
| Harly (Basis)                                                  | MIT                |
| Next.js, React, Tailwind CSS, Drizzle ORM                      | MIT / Apache-2.0   |
| PostgreSQL                                                     | PostgreSQL License |
| Caddy                                                          | Apache-2.0         |
| Atkinson Hyperlegible, Noto Sans Arabic                        | SIL OFL 1.1        |
| Lucide Icons                                                   | ISC                |
| frontend-design-Skill                                          | Apache-2.0         |
| Qwen3-1.7B-GGUF (optional)                                     | Apache-2.0         |
| faster-whisper-small (optional)                                | MIT                |
| llama.cpp (optional)                                           | MIT                |
| Z-Image-Turbo / FLUX.1-schnell / OmniSVG (nur Asset-Erzeugung) | Apache-2.0         |

## 19. MVP-Umfang

**Bewerbende:** Karriereseite, Stellendetail, 60-Sekunden-Bewerbung in 9 Sprachen, Rückruf, Sprachnachricht, optionaler Upload, Bestätigung, LKW-Animation.
**HR:** Harly-Funktionen (Login, Stellen, Pipeline, Liste, Detail, Notizen, Dokumente) plus Sprach- und Modus-Badges, Ein-Tipp-Rückruf, mobile Ansicht.
**Analytics:** Funnel-Report mit Aufrufen, Starts, Abschlüssen, Interviews, Angeboten, Einstellungen, Conversion Rates, Drop-off pro Frage und Quellen.

**Nicht im MVP:** KI-Bewertung und Ranking (dauerhaft ausgeschlossen), WhatsApp-Business-API, Microsoft-365-/AD-Integration, Terminbuchung, Arbeitsverträge und E-Signatur (in Harly vorhanden, bleibt deaktiviert), Lohnbuchhaltung.

## 20. Akzeptanzkriterien MVP

1. Die Kriterien 1–16 aus v1 §61 sind erfüllt.
2. Eine Bewerbung ist auf einem 360-px-Handy **in unter 60 Sekunden** abschickbar (gemessen im Playwright-Test).
3. Alle 9 Sprachen sind wählbar, Arabisch wird korrekt von rechts nach links dargestellt.
4. Pflicht sind nur Vorname und Telefon oder E-Mail.
5. Rückruf-Bewerbung und Sprachnachricht funktionieren ohne KI.
6. Der LKW fährt nach jeder Eingabe weiter und beim Absenden über die Seite. Bei `prefers-reduced-motion` gibt es keine Bewegung.
7. Der Funnel-Report zeigt den Drop-off pro Frage.
8. HR kann alle Kernaufgaben am Handy erledigen (390 px, CI-Screenshot-Test).
9. Der Pi betreibt die Anwendung ausschließlich aus vorgebauten arm64-Images.
10. Die Anwendung startet und funktioniert vollständig mit `AI` deaktiviert.

## 21. Produkt in einem Satz

**Der Bier-Schneider Recruiting Funnel ist eine selbst gehostete, mehrsprachige und verspielte Recruiting-Plattform auf einem Raspberry Pi. Menschen bewerben sich damit in einer Minute am Handy, HR verwaltet sie unterwegs, und die Conversion wird zwischen allen Recruiting-Stufen bis hinunter auf die einzelne Frage messbar.**
