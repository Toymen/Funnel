#!/usr/bin/env bash
# Einmalige Einrichtung auf dem Raspberry Pi (Raspberry Pi OS Lite 64 Bit).
# Aufruf auf dem Pi:  sudo bash install.sh
# Installiert Docker, legt /opt/funnel an und erzeugt .env mit Zufalls-Secrets.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/funnel}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "Warnung: erwartet aarch64 (Raspberry Pi OS 64 Bit), gefunden: $(uname -m)" >&2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "→ Docker installieren (offizielles Convenience-Skript)"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null

# Nicht-root-Benutzer darf Docker nutzen (wirksam nach erneutem Login).
if [[ -n "${SUDO_USER:-}" ]]; then
  usermod -aG docker "$SUDO_USER"
fi

install -d -m 0750 "$APP_DIR" "$APP_DIR/backups"
if [[ -n "${SUDO_USER:-}" ]]; then
  chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR"
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "→ $APP_DIR/.env mit Zufalls-Secrets erzeugen"
  umask 077
  while IFS= read -r line; do
    if [[ "$line" == *"__GENERATE__"* ]]; then
      line="${line//__GENERATE__/$(openssl rand -hex 32)}"
    fi
    printf '%s\n' "$line"
  done < "$SCRIPT_DIR/env.example" > "$APP_DIR/.env"
  [[ -n "${SUDO_USER:-}" ]] && chown "$SUDO_USER:$SUDO_USER" "$APP_DIR/.env"
  echo "   Bitte HARLY_URL, HARLY_DOMAIN und HARLY_INITIAL_ADMIN_EMAIL in $APP_DIR/.env prüfen."
else
  echo "→ $APP_DIR/.env existiert bereits – unverändert gelassen"
fi

# Tägliches Backup per systemd-Timer
if [[ -d /etc/systemd/system ]]; then
  install -m 0644 "$SCRIPT_DIR/funnel-backup.service" /etc/systemd/system/funnel-backup.service
  install -m 0644 "$SCRIPT_DIR/funnel-backup.timer" /etc/systemd/system/funnel-backup.timer
  systemctl daemon-reload
  systemctl enable --now funnel-backup.timer
  echo "→ Backup-Timer aktiv: $(systemctl list-timers funnel-backup.timer --no-legend | head -1)"
fi

echo "Fertig. Nächster Schritt vom Mac/PC aus: deploy/raspberry-pi/deploy.sh"
