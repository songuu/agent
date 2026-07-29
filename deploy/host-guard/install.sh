#!/usr/bin/env bash
# Install/update the host guard from a staged copy of this directory.
set -euo pipefail

readonly SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly INSTALL_DIR="/opt/agent-build/host-guard"
readonly SERVICE_NAME="agent-build-stack-guard.service"
readonly TIMER_NAME="agent-build-stack-guard.timer"

for file in agent-build-stack-guard.sh "$SERVICE_NAME" "$TIMER_NAME"; do
  [[ -f "${SOURCE_DIR}/${file}" ]] || {
    printf 'missing guard asset: %s\n' "${SOURCE_DIR}/${file}" >&2
    exit 1
  }
done

install -d -m 755 "$INSTALL_DIR"
install -m 755 "${SOURCE_DIR}/agent-build-stack-guard.sh" "$INSTALL_DIR/agent-build-stack-guard.sh"
install -m 644 "${SOURCE_DIR}/${SERVICE_NAME}" "/etc/systemd/system/${SERVICE_NAME}"
install -m 644 "${SOURCE_DIR}/${TIMER_NAME}" "/etc/systemd/system/${TIMER_NAME}"

systemctl daemon-reload
systemctl enable --now nginx pm2-root
systemctl enable --now "$TIMER_NAME"
systemctl start "$SERVICE_NAME"
result="$(systemctl show --property=Result --value "$SERVICE_NAME")"
[[ "$result" == "success" ]] || {
  systemctl --no-pager --full status "$SERVICE_NAME" || true
  exit 1
}
printf '%s completed with Result=%s\n' "$SERVICE_NAME" "$result"
