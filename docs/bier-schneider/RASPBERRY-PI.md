# Betrieb auf dem Raspberry Pi

Entwickelt wird auf dem Mac oder PC. Der Raspberry Pi **hostet nur**: Er lädt fertige
`linux/arm64`-Images und startet sie. Auf dem Pi gibt es keinen Quellcode, kein Node und
keinen Build.

```text
Mac/PC ──git push──► GitHub (PR → CI → Merge) ──► GHCR ghcr.io/toymen/funnel:edge (arm64)
   │                                                        │
   └──── deploy/raspberry-pi/deploy.sh ──ssh──► Pi: docker compose pull && up -d
```

## Hardware

| Teil     | Empfehlung                                                          |
| -------- | ------------------------------------------------------------------- |
| Rechner  | Raspberry Pi 5, **8 GB**                                            |
| Speicher | NVMe-SSD über M.2-HAT, **Betriebssystem direkt von der SSD booten** |
| Netzteil | offizielles 27-W-USB-C-Netzteil                                     |
| Kühlung  | Active Cooler                                                       |
| System   | Raspberry Pi OS Lite (64 Bit), ohne Desktop                         |

Weil das ganze System von der SSD bootet, liegen Datenbank, Uploads, Docker-Volumes, Logs
und Backups automatisch auf der NVMe und nicht auf einer SD-Karte.

## Einmalige Einrichtung

1. Raspberry Pi OS Lite 64 Bit mit dem Raspberry Pi Imager auf die NVMe schreiben. Dabei
   im Imager SSH aktivieren und Hostname `bier-pi` sowie Benutzer `pi` setzen.
2. Auf dem Pi:

   ```bash
   git clone --depth 1 https://github.com/Toymen/Funnel /tmp/funnel
   sudo bash /tmp/funnel/deploy/raspberry-pi/install.sh
   rm -rf /tmp/funnel
   ```

   Das Skript installiert Docker, legt `/opt/funnel` an, erzeugt `/opt/funnel/.env` mit
   Zufalls-Secrets und aktiviert das tägliche Backup (03:15).

3. In `/opt/funnel/.env` die Werte `HARLY_URL`, `HARLY_DOMAIN` und
   `HARLY_INITIAL_ADMIN_EMAIL` anpassen.
4. DNS: Einen A-Eintrag für `jobs.bier-schneider.de` auf die öffentliche IP setzen. Im
   Router TCP 80/443 und UDP 443 zum Pi weiterleiten. Caddy holt das TLS-Zertifikat dann
   automatisch.
5. Ist das GitHub-Repository privat, muss der Pi einmal bei GHCR angemeldet werden. Dafür
   einen Personal Access Token mit nur `read:packages` verwenden:

   ```bash
   echo <TOKEN> | docker login ghcr.io -u Toymen --password-stdin
   ```

## Deployment (vom Mac/PC)

```bash
PI_HOST=pi@bier-pi.local deploy/raspberry-pi/deploy.sh                # aktuelles main (edge)
PI_HOST=pi@bier-pi.local deploy/raspberry-pi/deploy.sh ghcr.io/toymen/funnel:1.2.0
```

Ablauf:

1. Das Tag wird in eine unveränderliche Digest aufgelöst (wenn Docker lokal installiert ist).
2. Nur `compose.yaml`, `Caddyfile` und die Skripte werden übertragen. Die `.env` bleibt auf
   dem Pi.
3. **Backup vor jedem Update**.
4. `docker compose pull && up -d`: Der Dienst `migrate` spielt Datenbank-Migrationen ein,
   bevor die App startet.

Danach `/setup` mit dem `HARLY_SETUP_SECRET` aus der `.env` aufrufen, den ersten
Admin-Zugang anlegen und die Beispielstellen einspielen:

```bash
# einmalig, vom Mac/PC mit Tunnel zur Pi-Datenbank – oder die Stellen im Admin anlegen
pnpm --filter @harly/db db:seed:bier-schneider
```

### Image lokal bauen (ohne GitHub Actions)

Auf Apple Silicon läuft das nativ, auf einem x86-PC über QEMU (langsamer):

```bash
docker buildx build --platform linux/arm64 -t ghcr.io/toymen/funnel:local --push .
PI_HOST=pi@bier-pi.local deploy/raspberry-pi/deploy.sh ghcr.io/toymen/funnel:local
```

Ohne Registry geht es auch direkt per SSH:

```bash
docker buildx build --platform linux/arm64 -t funnel:local --load .
docker save funnel:local | ssh pi@bier-pi.local docker load
```

Anschließend in der `.env` auf dem Pi `HARLY_IMAGE=funnel:local` setzen.

## Speicherbudget (Pi 5, 8 GB)

| Dienst        |      Limit | Zweck                                  |
| ------------- | ---------: | -------------------------------------- |
| app (Next.js) |     1,5 GB | Webseite und API                       |
| postgres      |       1 GB | Datenbank                              |
| scheduler     |     256 MB | Löschfristen, E-Mails, Hintergrundjobs |
| caddy         |     128 MB | HTTPS                                  |
| migrate       |     512 MB | läuft nur kurz beim Start              |
| **Summe**     | **≈ 3 GB** | Rest für OS, Page-Cache, optionale KI  |

Die Werte stehen in `.env` (`HARLY_*_MEMORY`) und lassen sich dort anpassen.

## Backups

- **Wann:** täglich um 03:15 über den systemd-Timer `funnel-backup.timer` und zusätzlich vor
  jedem Deployment
- **Was:** Datenbank (`pg_dump`, custom format), Uploads-Volume, `.env`, `compose.yaml`,
  `Caddyfile` und Prüfsummen (`SHA256SUMS`)
- **Wo:** `/opt/funnel/backups/JJJJ-MM-TT-HHMM/`, Aufbewahrung `BACKUP_KEEP_DAYS` (14 Tage)
- **Kopie außerhalb des Pi:** `BACKUP_REMOTE=user@nas:/volume1/funnel` setzen, dann schreibt
  das Skript per `rsync` dorthin. Die Backups enthalten Bewerberdaten und die `.env` mit
  Secrets. Das Ziel muss deshalb verschlüsselt und zugriffsbeschränkt sein.

```bash
ssh pi@bier-pi.local
cd /opt/funnel
./backup.sh                                  # manuell
systemctl list-timers funnel-backup.timer    # nächster Lauf
./restore.sh backups/2026-09-24-0315         # Wiederherstellung (fragt nach)
```

Einen Restore regelmäßig testen, am besten auf einem zweiten Pi oder in einer VM.

## Betrieb

| Aufgabe      | Befehl (auf dem Pi, in `/opt/funnel`)              |
| ------------ | -------------------------------------------------- |
| Status       | `docker compose ps`                                |
| Logs         | `docker compose logs -f app`                       |
| Health       | `curl -fsS http://127.0.0.1:3000/api/health/ready` |
| Neustart     | `docker compose restart app scheduler`             |
| Speicher/CPU | `docker stats --no-stream`                         |
| Plattenplatz | `df -h / && du -sh backups`                        |

Bewerberdaten erscheinen nicht in den Logs (PRD v1 §44).

## Sicherheit

- Die App lauscht nur auf `127.0.0.1:3000`, öffentlich erreichbar ist ausschließlich Caddy
  (HTTPS, HSTS).
- App und Scheduler laufen mit read-only Dateisystem. Nur die Uploads liegen in einem
  eigenen Volume.
- Die `Permissions-Policy` erlaubt das Mikrofon für die Sprachnachricht; Kamera und
  Standort sind gesperrt.
- Für den SSH-Zugang nur Schlüssel verwenden (`PasswordAuthentication no`), dazu
  automatische Sicherheitsupdates: `sudo apt install unattended-upgrades`.
