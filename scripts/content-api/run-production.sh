#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${CONTENT_API_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ENV_FILE="${CONTENT_API_ENV_FILE:-${REPO_ROOT}/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "content-api: env file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$REPO_ROOT"
exec node --experimental-transform-types --env-file="$ENV_FILE" scripts/content-api/start-production.ts
