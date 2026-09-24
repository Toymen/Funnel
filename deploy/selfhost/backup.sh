#!/usr/bin/env bash
# Tägliches Backup auf dem Pi (PRD v1 §43): Datenbank + Uploads + Konfiguration.
# Läuft per systemd-Timer (funnel-backup.timer) und vor jedem Deployment.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PROJECT="${COMPOSE_PROJECT_NAME:-harly}"
STAMP="$(date +%Y-%m-%d-%H%M)"
TARGET="$BACKUP_DIR/$STAMP"

umask 077
mkdir -p "$TARGET"

echo "→ Datenbank sichern"
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner \
  > "$TARGET/database.dump"

echo "→ Uploads sichern"
docker run --rm \
  -v "${PROJECT}_uploads:/data/uploads:ro" \
  -v "$TARGET:/backup" \
  alpine:3 tar czf /backup/uploads.tar.gz -C /data uploads

echo "→ Konfiguration sichern"
cp .env "$TARGET/env"
cp compose.yaml Caddyfile "$TARGET/"

( cd "$TARGET" && sha256sum ./* > SHA256SUMS )
test -s "$TARGET/database.dump" || { echo "Datenbank-Dump ist leer" >&2; exit 1; }

echo "→ Alte Backups löschen (> $KEEP_DAYS Tage)"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} +

if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  echo "→ Kopie nach $BACKUP_REMOTE"
  rsync -a --delete "$BACKUP_DIR/" "$BACKUP_REMOTE/"
fi

echo "✓ Backup: $TARGET ($(du -sh "$TARGET" | cut -f1))"
