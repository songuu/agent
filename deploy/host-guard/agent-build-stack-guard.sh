#!/usr/bin/env bash
# Verify and recover the host services that this machine can prove locally.
# PM2 restores its dump on boot; this guard additionally detects stale "online"
# entries by probing each owned endpoint and restarts the corresponding process.
set -euo pipefail

readonly PM2_BIN="${PM2_BIN:-/usr/lib/node_modules/pm2/bin/pm2}"
readonly RETRIES="${AGENT_BUILD_GUARD_RETRIES:-12}"
readonly RETRY_DELAY_SECONDS="${AGENT_BUILD_GUARD_RETRY_DELAY_SECONDS:-1}"
# A single local curl timeout is not proof that an otherwise-online process is
# broken: under host-wide I/O or memory pressure every sibling probe can miss
# one deadline. Require several consecutive liveness failures before killing a
# PM2 process, because a restart discards warm database connections as well.
readonly PROBE_FAILURE_THRESHOLD="${AGENT_BUILD_GUARD_PROBE_FAILURE_THRESHOLD:-3}"
readonly PROBE_RETRY_DELAY_SECONDS="${AGENT_BUILD_GUARD_PROBE_RETRY_DELAY_SECONDS:-2}"
readonly CONTENT_API_PROBE_MAX_TIME="${AGENT_BUILD_CONTENT_API_PROBE_MAX_TIME:-20}"
readonly REQUIRED_PM2_APPS=(
  agent-build-runner
  agent-build-content-api
  news-collector
  codefather-interview-sync
  aicrew-studio
  dm-web
  dm-api
  agent-demo-spiffe
)

log() {
  printf '[agent-build-stack-guard] %s\n' "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

wait_for() {
  local description="$1"
  shift
  local attempt
  for ((attempt = 1; attempt <= RETRIES; attempt += 1)); do
    if "$@"; then
      return 0
    fi
    sleep "$RETRY_DELAY_SECONDS"
  done
  fail "timed out waiting for ${description}"
}

ensure_systemd_service() {
  local service="$1"
  if systemctl is-active --quiet "$service"; then
    return 0
  fi
  log "restarting systemd service: ${service}"
  systemctl restart "$service"
  wait_for "$service" systemctl is-active --quiet "$service"
}

pm2_is_online() {
  local app="$1"
  "$PM2_BIN" jlist | node -e '
    let processes;
    try { processes = JSON.parse(require("node:fs").readFileSync(0, "utf8")); } catch { process.exit(2); }
    const app = process.argv[1];
    process.exit(processes.some((process) => process.name === app && process.pm2_env?.status === "online") ? 0 : 1);
  ' "$app"
}

ensure_pm2_app() {
  local app="$1"
  if pm2_is_online "$app"; then
    return 0
  fi
  log "restarting PM2 app: ${app}"
  "$PM2_BIN" restart "$app"
  wait_for "PM2 app ${app}" pm2_is_online "$app"
}

ensure_probe() {
  local app="$1"
  local label="$2"
  shift 2
  local attempt
  for ((attempt = 1; attempt <= PROBE_FAILURE_THRESHOLD; attempt += 1)); do
    if "$@"; then
      return 0
    fi
    if (( attempt < PROBE_FAILURE_THRESHOLD )); then
      log "probe failed (${label}; ${attempt}/${PROBE_FAILURE_THRESHOLD}); retrying before restart"
      sleep "$PROBE_RETRY_DELAY_SECONDS"
    fi
  done
  log "probe failed ${PROBE_FAILURE_THRESHOLD} consecutive times (${label}); restarting PM2 app: ${app}"
  "$PM2_BIN" restart "$app"
  wait_for "$label" "$@"
}

probe_content_api_liveness() {
  curl --fail --silent --show-error --output /dev/null --max-time "$CONTENT_API_PROBE_MAX_TIME" \
    -H 'Host: songuu.top' http://127.0.0.1:5180/healthz
}

probe_dm_api_connection() {
  local status
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 5 http://127.0.0.1:4000/ 2>/dev/null || true)"
  [[ "$status" != "000" && -n "$status" ]]
}

main() {
  [[ -x "$PM2_BIN" ]] || fail "PM2 executable not found: ${PM2_BIN}"
  command -v node >/dev/null || fail "node is required to inspect PM2 status"
  command -v curl >/dev/null || fail "curl is required for endpoint probes"

  ensure_systemd_service nginx
  ensure_systemd_service pm2-root

  local app
  for app in "${REQUIRED_PM2_APPS[@]}"; do
    ensure_pm2_app "$app"
  done

  ensure_probe agent-build-runner runner-health \
    curl --fail --silent --show-error --output /dev/null --max-time 5 \
      -H 'Host: songuu.top' -H 'X-Demo-Runner: 1' \
      http://127.0.0.1:5174/api/health
  # `/healthz` is deliberately liveness-only. Database readability is observed
  # separately and must never turn a transient slow query into a restart loop.
  ensure_probe agent-build-content-api content-api-health probe_content_api_liveness
  ensure_probe aicrew-studio aicrew-http \
    curl --fail --silent --show-error --output /dev/null --max-time 5 http://127.0.0.1:3101/aicrew/
  ensure_probe dm-web deploy-management-web \
    curl --fail --silent --show-error --output /dev/null --max-time 5 http://127.0.0.1:3000/
  ensure_probe dm-api deploy-management-api probe_dm_api_connection
  wait_for agent-build-static \
    curl --fail --silent --show-error --output /dev/null --insecure --max-time 8 \
      --resolve songuu.top:443:127.0.0.1 https://songuu.top/agent-build/

  log "all managed services are healthy"
}

main "$@"
