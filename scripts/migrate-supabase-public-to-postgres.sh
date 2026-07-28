#!/usr/bin/env bash
# Complete the public-schema data migration from a Supabase PostgreSQL database
# into the self-hosted PostgreSQL container without overwriting the five tables
# that are already live on the target.
set -euo pipefail

source_url_file="${1:?Usage: $0 <source-db-url-file> [target-container] [target-db]}"
target_container="${2:-agent-build-postgres}"
target_db="${3:-agent_build}"
backup_dir="${BACKUP_DIR:-/opt/agent-build/shared/postgres/backups}"
work_dir="${WORK_DIR:-/opt/agent-build/shared/postgres/work}"

if [[ ! -r "$source_url_file" ]]; then
  echo "Source database URL file is not readable: $source_url_file" >&2
  exit 2
fi

for command in docker sed date mkdir; do
  command -v "$command" >/dev/null || {
    echo "Missing required command: $command" >&2
    exit 2
  }
done

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir" "$work_dir"

source_url="$(tr -d '\r\n' < "$source_url_file")"
if [[ -z "$source_url" ]]; then
  echo "Source database URL is empty." >&2
  exit 2
fi

# These are already live on the target. Keeping them out of the restore
# preserves post-cutover writes while all other public tables are restored.
live_tables=(
  frontier_ecosystem_articles
  glossary_terms
  interview_questions
  news_items
  notion_articles
)

exclude_args=()
for table in "${live_tables[@]}"; do
  exclude_args+=("--exclude-table=public.${table}")
done

target_backup="$backup_dir/${target_db}-before-full-public-${timestamp}.dump"
source_dump="$work_dir/supabase-public-missing-${timestamp}.sql"
prepared_dump="$work_dir/supabase-public-missing-${timestamp}.prepared.sql"

echo "Creating rollback backup: $target_backup"
docker exec -u postgres "$target_container" \
  pg_dump -d "$target_db" --format=custom --no-owner --no-privileges > "$target_backup"

echo "Exporting source public schema and data, preserving live target tables"
docker exec "$target_container" \
  pg_dump "$source_url" --schema=public --no-owner --no-privileges "${exclude_args[@]}" > "$source_dump"

for table in "${live_tables[@]}"; do
  if grep -qE "^CREATE TABLE public\\.${table} " "$source_dump"; then
    echo "Safety check failed: dump contains live target table $table" >&2
    exit 3
  fi
done

# The source dump contains trigger functions for the five excluded tables.
# Replacing an existing function is safe and preserves dependent triggers.
sed -E \
  -e '/^CREATE SCHEMA public;$/d' \
  -e 's/^CREATE FUNCTION /CREATE OR REPLACE FUNCTION /' \
  "$source_dump" > "$prepared_dump"

echo "Installing the minimal auth.role compatibility contract required by source RLS policies"
docker exec -i -u postgres "$target_container" psql -d "$target_db" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$ SELECT current_user::text $$;
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.role() TO PUBLIC;
COMMIT;
SQL

echo "Restoring missing public tables in one transaction"
docker exec -i -u postgres "$target_container" \
  psql -d "$target_db" -v ON_ERROR_STOP=1 --single-transaction < "$prepared_dump"

echo "Granting the existing private writer role access to restored tables"
docker exec -i -u postgres "$target_container" psql -d "$target_db" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
GRANT USAGE ON SCHEMA public TO agent_build_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agent_build_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agent_build_writer;
COMMIT;
SQL

echo "Migration complete"
echo "ROLLBACK_BACKUP=$target_backup"
echo "SOURCE_DUMP=$source_dump"
echo "PREPARED_DUMP=$prepared_dump"
