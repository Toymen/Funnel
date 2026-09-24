#!/usr/bin/env bash
# Einmalige Einrichtung auf dem Host – Raspberry Pi oder Workstation (Linux).
# Aufruf auf dem Host:  sudo bash install.sh [pi|workstation]
# Installiert Docker, legt /opt/funnel an und erzeugt .env mit Zufalls-Secrets
# und den Ressourcen-Limits des Host-Profils. Ohne Argument wird das Profil aus
# der Architektur geraten: aarch64 → pi, sonst workstation.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/funnel}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -m)" in
  aarch64 | arm64) default_profile=pi ;;
  x86_64 | amd64) default_profile=workstation ;;
  *)
    echo "Nicht unterstützte Architektur: $(uname -m) (nur arm64 und amd64)" >&2
    exit 1
    ;;
esac
PROFILE="${1:-$default_profile}"
if [[ ! -f "$SCRIPT_DIR/profile-$PROFILE.env" ]]; then
  echo "Unbekanntes Profil '$PROFILE' – erlaubt: pi, workstation" >&2
  exit 1
fi
echo "→ Host-Profil: $PROFILE"

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
  done < <(cat "$SCRIPT_DIR/env.example"; echo; cat "$SCRIPT_DIR/profile-$PROFILE.env") > "$APP_DIR/.env"
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

echo "Fertig. Nächster Schritt vom Mac/PC aus: DEPLOY_HOST=<user@host> deploy/selfhost/deploy.sh"
