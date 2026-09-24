#!/usr/bin/env bash
# Deployment vom Mac/PC auf den Raspberry Pi – auf dem Pi wird nichts gebaut.
#
#   deploy/raspberry-pi/deploy.sh [image]
#
#   image  Tag oder Digest, Standard: ghcr.io/toymen/funnel:edge (linux/arm64,
#          gebaut von GitHub Actions bei jedem Merge auf main)
#
# Umgebung:
#   PI_HOST  SSH-Ziel, Standard: pi@bier-pi.local
#   PI_DIR   Zielverzeichnis, Standard: /opt/funnel
set -euo pipefail

PI_HOST="${PI_HOST:-pi@bier-pi.local}"
PI_DIR="${PI_DIR:-/opt/funnel}"
IMAGE="${1:-ghcr.io/toymen/funnel:edge}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Tag → unveränderliche Digest auflösen, wenn Docker lokal verfügbar ist.
if [[ "$IMAGE" != *@sha256:* ]] && command -v docker >/dev/null 2>&1; then
  if digest="$(docker buildx imagetools inspect "$IMAGE" --format '{{json .Manifest.Digest}}' 2>/dev/null | tr -d '"')" && [[ -n "$digest" ]]; then
    IMAGE="${IMAGE%%:*}@${digest}"
  fi
fi
VERSION="${IMAGE##*[:@]}"
VERSION="${VERSION:0:19}"

echo "→ Ziel: $PI_HOST:$PI_DIR"
echo "→ Image: $IMAGE"

# Nur Laufzeit-Dateien übertragen – kein Quellcode, kein Node auf dem Pi.
# shellcheck disable=SC2029  # Pfad soll lokal expandiert werden.
ssh "$PI_HOST" "mkdir -p '$PI_DIR'"
scp -q \
  "$ROOT/compose.yaml" \
  "$ROOT/Caddyfile" \
  "$ROOT/deploy/raspberry-pi/backup.sh" \
  "$ROOT/deploy/raspberry-pi/restore.sh" \
  "$PI_HOST:$PI_DIR/"

# shellcheck disable=SC2087  # Variablen sollen lokal expandiert werden.
ssh "$PI_HOST" bash -s <<REMOTE
set -euo pipefail
cd '$PI_DIR'
test -f .env || { echo "Fehlt: $PI_DIR/.env – zuerst install.sh auf dem Pi ausführen" >&2; exit 1; }
chmod +x backup.sh restore.sh
sed -i -e 's#^HARLY_IMAGE=.*#HARLY_IMAGE=$IMAGE#' -e 's#^HARLY_VERSION=.*#HARLY_VERSION=$VERSION#' .env
# Vor jedem Update ein Backup (nur wenn schon eine Datenbank läuft).
if docker compose ps --status running --services 2>/dev/null | grep -qx postgres; then
  ./backup.sh
fi
docker compose pull --quiet
docker compose up -d --remove-orphans
docker compose ps
docker image prune -f >/dev/null
REMOTE

echo "✓ Deployment abgeschlossen. Prüfen: https://<HARLY_DOMAIN>/api/health/ready"
