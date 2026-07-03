#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${CODEFATHER_INTERVIEW_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${CODEFATHER_INTERVIEW_ENV_FILE:-${REPO_ROOT}/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  LATEST_RELEASE_ENV="$(find /opt/agent-build/releases -mindepth 2 -maxdepth 2 -name .env -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-)"
  if [[ -n "$LATEST_RELEASE_ENV" && -f "$LATEST_RELEASE_ENV" ]]; then
    ENV_FILE="$LATEST_RELEASE_ENV"
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "node: .env: not found" >&2
  exit 1
fi

cd "$REPO_ROOT"
exec node --env-file="$ENV_FILE" scripts/codefather-interview-cron.ts "$@"
