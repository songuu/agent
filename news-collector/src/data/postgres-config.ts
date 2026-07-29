import type { PostgresConnectionConfig } from "./repository-config.ts";

function parseBoolean(value: string | undefined, name: string): boolean {
  if (value === undefined || value.trim() === "") return false;
  if (/^(1|true|yes|on)$/i.test(value)) return true;
  if (/^(0|false|no|off)$/i.test(value)) return false;
  throw new Error(`${name} must be true or false`);
}

function urlName(purpose: "read" | "write"): string {
  return purpose === "read" ? "CONTENT_POSTGRES_READ_URL" : "CONTENT_POSTGRES_WRITE_URL";
}

function samePostgresEndpoint(left: string, right: string): boolean {
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    const postgresProtocols = new Set(["postgresql:", "postgres:"]);
    return (
      postgresProtocols.has(leftUrl.protocol) &&
      postgresProtocols.has(rightUrl.protocol) &&
      leftUrl.hostname.toLowerCase() === rightUrl.hostname.toLowerCase() &&
      leftUrl.port === rightUrl.port &&
      leftUrl.username === rightUrl.username &&
      leftUrl.pathname === rightUrl.pathname
    );
  } catch {
    return false;
  }
}

function assertNotSupabaseDatabaseUrl(
  value: string,
  name: string,
  source: Readonly<Record<string, string | undefined>>,
): void {
  const supabaseDbUrl = source.SUPABASE_DB_URL?.trim();
  if (supabaseDbUrl && samePostgresEndpoint(value, supabaseDbUrl)) {
    throw new Error(name + " must point to the server PostgreSQL database, not SUPABASE_DB_URL or the Supabase backing database.");
  }
}

/** Parse one private PostgreSQL URL without exposing it to browser runtime config. */
export function loadPostgresConnectionConfig(
  source: Readonly<Record<string, string | undefined>>,
  purpose: "read" | "write",
): PostgresConnectionConfig {
  const specificName = urlName(purpose);
  const specificUrl = source[specificName]?.trim();
  const commonUrl = source.CONTENT_POSTGRES_URL?.trim();
  if (specificUrl && commonUrl) {
    throw new Error(`Use either ${specificName} or CONTENT_POSTGRES_URL, not both.`);
  }
  const value = specificUrl || commonUrl;
  if (!value) throw new Error(`Missing required env var for PostgreSQL content repository: ${specificName}`);
  assertNotSupabaseDatabaseUrl(value, specificName, source);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${specificName} must be a postgresql:// URL with host, user, password, and database.`);
  }
  if (
    (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") ||
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    !parsed.pathname ||
    parsed.pathname === "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${specificName} must be a postgresql:// URL with host, user, password, and database.`);
  }
  let database: string;
  try {
    database = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error(`${specificName} is missing a valid database.`);
  }
  if (!database || database.includes("/")) {
    throw new Error(`${specificName} must contain exactly one database path segment.`);
  }
  return {
    url: parsed.toString(),
    ssl: parseBoolean(source.CONTENT_POSTGRES_SSL, "CONTENT_POSTGRES_SSL"),
  };
}
