#!/usr/bin/env bash
set -euo pipefail

export TZ="${CODEFATHER_INTERVIEW_TZ:-Asia/Shanghai}"

REPO_ROOT="${CODEFATHER_INTERVIEW_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${CODEFATHER_INTERVIEW_ENV_FILE:-${REPO_ROOT}/.env}"
RUNNER="${REPO_ROOT}/scripts/codefather-interview-runner.mjs"
INTERVAL_SECONDS="${CODEFATHER_INTERVIEW_INTERVAL_SECONDS:-7200}"

log() {
  printf '%s %s\n' "$(date -Iseconds)" "$1"
}

run_once() {
  local reason="$1"
  log "[codefather-interview-cron] run start reason=${reason}"
  if ! node --experimental-transform-types --env-file="$ENV_FILE" "$RUNNER"; then
    :
  fi
}

log "[codefather-interview-cron] daemon up intervalSeconds=${INTERVAL_SECONDS} tz=${TZ} limit=500 dryRun=false upsertBatch=25 upsertTimeoutMs=300000"
run_once "boot"

while true; do
  sleep "$INTERVAL_SECONDS"
  run_once "schedule"
done