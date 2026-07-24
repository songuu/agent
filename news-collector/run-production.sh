#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${NEWS_COLLECTOR_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${NEWS_COLLECTOR_ENV_FILE:-${REPO_ROOT}/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "news-collector: env file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$REPO_ROOT"
exec node --experimental-transform-types --env-file="$ENV_FILE" news-collector/src/cron.ts
