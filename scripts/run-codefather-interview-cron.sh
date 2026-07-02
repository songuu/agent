#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${CODEFATHER_INTERVIEW_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$REPO_ROOT"
exec node --env-file=.env scripts/codefather-interview-cron.ts "$@"
