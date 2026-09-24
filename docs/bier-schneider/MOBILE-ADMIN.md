# HR-Bereich auf dem Handy

Umsetzung von PRD §11 und §11.1 für den HR-Bereich (Issue #5): alle Seiten ab
360 px ohne horizontales Scrollen, Karten statt Tabellen, wischbares Kanban mit
Statuswechsel per Auswahl, Primäraktionen in der Daumenzone und Ein-Tipp-Kontakt
im Bewerberdetail.

## Grundsatz

Der HR-Bereich ist geerbter Harly-Code. Änderungen daran bleiben klein
(meist Tailwind-Klassen mit `max-sm:`), damit Upstream-Patches selten kollidieren
(siehe [UPSTREAM.md](UPSTREAM.md)). Neue Logik und Komponenten liegen in
`apps/web/src/features/mobile-admin/`:

| Datei                       | Inhalt                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| `quick-contact.ts`          | Logik und deutsche HR-Texte: Kontaktaktionen, Badges, Parsing    |
| `QuickContact.tsx`          | Kontakt-Karte und feste Aktionsleiste (Handy) im Bewerberdetail  |
| `QuickApplyBadges.tsx`      | Badges für Sprache und Modus der Kurzbewerbung                   |
| `MobilePipelineColumns.tsx` | Kanban auf dem Handy: Scroll-Snap-Spalten, Auswahlfeld je Karte  |
| `mobile-pipeline.ts`        | Logik für Endstufen-Bestätigung und aktive Spalte                |
| `data.ts`                   | eigener Query auf `applications.snapshot->'quickApply'`          |
| `mobile-admin.css`          | Tap-Ziele ≥ 44 px für Harlys UI-Bausteine (nur Handy, nur Touch) |
| `fixtures.ts`, `*.stories`  | Beispieldaten und Stories („HR-Bereich/…“)                       |

## Audit

Gemessen mit Playwright (Chromium, `isMobile`, `hasTouch`) bei 360 × 740 und
390 × 844 px. Harlys Dashboard-`<main>` hat `overflow-y-auto` und scrollt deshalb
auch horizontal. Überlauf zeigt sich dort und nicht im Dokument. Gemessen wurde
daher `scrollWidth − clientWidth` für `document.documentElement` und für `<main>`.
Die Tabelle nennt den größeren Wert in px bei 360 / 390 px.

Tap-Ziele: Anzahl der Links, Buttons und Felder im Seiteninhalt (ohne globale
Kopfzeile) mit Trefferfläche unter 44 × 44 px bei 360 px.

| Seite                         | Überlauf vorher | Überlauf nachher | Tap-Ziele < 44 px vorher → nachher | Befund und Änderung                                                                                                    |
| ----------------------------- | --------------- | ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                  | 0 / 0           | 0 / 0            | 9 → 5                              | Kacheln stapeln sich bereits, nichts geändert                                                                          |
| `/dashboard/candidates`       | 123 / 93        | 0 / 0            | 21 → 2                             | Suchzeile lief rechts hinaus („Import candidates“ unerreichbar), bricht jetzt um; Liste ist bei Harly schon Karten     |
| `/dashboard/pipeline` (Liste) | 165 / 165       | 0 / 0            | 24 → 12                            | Umschalter Liste/Board lag außerhalb des Bildschirms, bricht jetzt um; Liste ist bei Harly schon Karten                |
| `/dashboard/pipeline` (Board) | 165 / 165       | 0 / 0            | 16 → 3                             | wie oben; Board am Handy neu als wischbare Spalten mit Auswahlfeld                                                     |
| Bewerberdetail (Kurzbew.)     | 90 / 60         | 0 / 0            | 39 → 7                             | Platzhalter-E-Mail und „View <Name>“ (Duplikate) liefen hinaus; Sticky-Kopf schnitt „Move to …“ ab                     |
| Bewerberdetail (Rückruf)      | 42 / 12         | 0 / 0            | 33 → 6                             | wie oben; neu: Kontakt-Karte mit Badges und Aktionsleiste unten                                                        |
| `/dashboard/jobs`             | 0 / 0           | 0 / 0            | 14 → 5                             | bereits Karten, nichts geändert                                                                                        |
| Stellen-Editor                | 0 / 0           | 0 / 0            | 103 → 109                          | kein Überlauf, aber Aktionen lagen über Titel und Status, Abschnitts-Chips waren ein 24-px-Streifen neben dem Formular |
| `/dashboard/reports`          | 0 / 0           | 0 / 0            | 7 → 5                              | Diagramme passen sich an, nichts geändert                                                                              |
| `/dashboard/reports/funnel`   | 170 / 140       | 0 / 0            | 0 → 0                              | Raster ohne `grid-cols-1`: lange Texte sprengten die Karten; Vergleichstabelle ist mobil schon eine Liste              |

Der Stellen-Editor liegt im Vollbild-Layout außerhalb von `main[data-mobile-admin]`.
Die Tap-Regel greift dort deshalb nicht. Die Felder selbst sind als beschriftete
Kästen mit mindestens 56 px Höhe gut treffbar, gezählt werden aber die 20 px hohen
Eingaben darin. Die Zahl steigt, weil die Abschnitts-Chips jetzt sichtbar sind.

## Kanban auf dem Handy

- Unter 640 px ersetzt `MobilePipelineColumns` Harlys Stufen-Dropdown mit Kartenliste.
- Spalten liegen nebeneinander (`snap-x snap-mandatory`, 85 % Breite), die nächste
  Spalte ist angeschnitten sichtbar. Die Stufen-Chips darüber zeigen die Anzahl und
  springen zur Spalte, der aktive Chip folgt dem Wischen.
- Jede Karte hat ein natives Auswahlfeld „Stufe für … ändern“. Endstufen
  (Eingestellt, Abgesagt, Hired, Rejected) verlangen eine Bestätigung.
- Das Verschieben nutzt Harlys `bulkMoveApplications` samt optimistischem Update.
  Am Desktop bleibt Drag & Drop unverändert.

## Ein-Tipp-Kontakt und Badges

- Aktionen: „Anrufen“ (`tel:`), „SMS“ (`sms:`), „E-Mail“ (`mailto:`).
  Platzhalter-Adressen der Kurzbewerbung (`@kurzbewerbung.invalid`) erscheinen nie.
- Hauptaktion ist „Anrufen“, sobald es eine Nummer gibt, sonst „E-Mail“.
- Auf dem Handy liegen die Aktionen als feste Leiste am unteren Rand.
  Ab 640 px stehen sie in der Kontakt-Karte.
- Badges: Sprache (Eigenname aus `quick-apply/languages.ts`, mit `lang`/`dir`) und
  Modus (Kurzbewerbung, Rückruf gewünscht · Zeitfenster, Sprachnachricht). Sie
  erscheinen im Detail, in der Bewerberliste, in der Pipeline-Liste und auf den
  Kanban-Karten.
- Bei aktiver Anonymisierung (Harlys `IdentityShield`) zeigt der Ein-Tipp-Kontakt
  keine Links.

## Prüfen

```bash
pnpm --filter web test                   # u. a. features/mobile-admin/*.test.ts(x)
pnpm --filter web test-storybook         # Stories „HR-Bereich/…“ mit play-Functions
```

Das Audit-Skript ist nicht Teil des Repos. Die CI-Prüfung bei 390 × 844 aus
PRD §11.1 steht noch aus (siehe offene Punkte).

## Offene Punkte

- Einige Harly-Elemente ohne gemeinsamen UI-Baustein bleiben unter 44 px: Tabs
  „All/Trash“, Ansichtsumschalter „List/Board“, Stufen-Filter der Pipeline-Liste,
  Textlinks („View all“, Telefonnummer im Kopf), „+ Tag“, „Change avatar“.
  Nach WCAG 2.2 AA (2.5.8, 24 px) sind sie zulässig.
- Die Icons der globalen Kopfzeile sind 36 px groß. Mit 44 px wäre kein Platz
  mehr für den Arbeitsbereich-Namen.
- „Contact details“ im Profil-Tab zeigt die Platzhalter-E-Mail weiterhin an
  (Harlys `CandidateDetailsPanel`).
- Harlys `statusForStageName` erkennt nur englische Endstufen („Hired“,
  „Rejected“). Bei den deutschen Stufen „Eingestellt“ und „Abgesagt“ setzt ein
  Wechsel den Bewerbungsstatus daher nicht automatisch.
- Die Playwright-Prüfung bei 390 × 844 läuft noch nicht in der CI.
