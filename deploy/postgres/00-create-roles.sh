#!/bin/sh
set -eu

# WHY: Content API reads and cron writes must not share one credential.
# The reader remains subject to RLS; the server-only writer bypasses RLS so
# draft Notion rows and idempotent updates can be maintained without exposing
# those rows through the public Content API.
reader_password="$(cat /run/secrets/agent_build_reader_password)"
writer_password="$(cat /run/secrets/agent_build_writer_password)"

psql \
  --set=ON_ERROR_STOP=1 \
  --set=reader_password="$reader_password" \
  --set=writer_password="$writer_password" \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" <<'SQL'
SELECT 'CREATE ROLE anon NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
\gexec

SELECT 'CREATE ROLE authenticated NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
\gexec

SELECT 'CREATE ROLE service_role NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role')
\gexec

SELECT format(
  'CREATE ROLE agent_build_reader LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
  :'reader_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agent_build_reader')
\gexec

SELECT format(
  'CREATE ROLE agent_build_writer LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS PASSWORD %L',
  :'writer_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agent_build_writer')
\gexec

ALTER ROLE agent_build_reader PASSWORD :'reader_password';
ALTER ROLE agent_build_writer PASSWORD :'writer_password';
ALTER ROLE agent_build_reader SET statement_timeout = '15s';
ALTER ROLE agent_build_writer SET statement_timeout = '60s';

GRANT CONNECT ON DATABASE agent_build TO agent_build_reader, agent_build_writer;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL
