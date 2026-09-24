#!/usr/bin/env bash
# Wiederherstellung eines Backups auf dem Pi.
#   ./restore.sh backups/2026-09-24-0300
# Stoppt App und Scheduler, spielt Datenbank und Uploads zurück, startet neu.
set -euo pipefail

SRC="${1:?Backup-Verzeichnis angeben, z. B. backups/2026-09-24-0300}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env
set +a
PROJECT="${COMPOSE_PROJECT_NAME:-harly}"
SRC="$(cd "$SRC" && pwd)"

( cd "$SRC" && sha256sum --check --quiet SHA256SUMS )
read -r -p "Aktuelle Daten werden durch $SRC ersetzt. Fortfahren? [ja/NEIN] " answer
[[ "$answer" == "ja" ]] || { echo "Abgebrochen."; exit 1; }

docker compose stop app scheduler
docker compose up -d postgres

echo "→ Datenbank zurückspielen"
docker compose exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner \
  < "$SRC/database.dump"

echo "→ Uploads zurückspielen"
docker run --rm \
  -v "${PROJECT}_uploads:/data/uploads" \
  -v "$SRC:/backup:ro" \
  alpine:3 sh -c 'rm -rf /data/uploads/* && tar xzf /backup/uploads.tar.gz -C /data'

docker compose up -d
echo "✓ Wiederhergestellt aus $SRC"
