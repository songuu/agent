import { readFile as nodeReadFile } from "node:fs/promises";

import { NOTION_STORAGE_BUCKET } from "./manifest.ts";
import type { MigrationProfile, ProfileName, ProfilePair } from "./types.ts";

export type EnvSource = Readonly<Record<string, string | undefined>>;
export type ReadEnvFile = (path: string) => Promise<string>;

function requiredEnv(source: EnvSource, profileName: ProfileName, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required ${name} in ${profileName} profile.`);
  return value;
}

export function normalizeSupabaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SUPABASE_URL must be an absolute http(s) URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("SUPABASE_URL must use http or https.");
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

/** Minimal dotenv parser with no interpolation: profile values must stay literal and local. */
export function parseDotenv(contents: string): EnvSource {
  const values: Record<string, string> = {};
  for (const rawLine of contents.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const matched = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!matched) continue;
    const name = matched[1];
    if (!name) continue;
    let value = matched[2] ?? "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      const commentIndex = value.search(/\s+#/);
      if (commentIndex >= 0) value = value.slice(0, commentIndex);
    }
    values[name] = value.trim();
  }
  return values;
}

export function parseMigrationProfile(profileName: ProfileName, source: EnvSource): MigrationProfile {
  const schema = (source.SUPABASE_SCHEMA ?? "public").trim();
  if (schema !== "public") {
    throw new Error(`${profileName} profile SUPABASE_SCHEMA must be public; this tool only migrates owned public tables.`);
  }

  const bucket = (source.NOTION_STORAGE_BUCKET ?? NOTION_STORAGE_BUCKET).trim();
  if (bucket !== NOTION_STORAGE_BUCKET) {
    throw new Error(`${profileName} profile NOTION_STORAGE_BUCKET must be ${NOTION_STORAGE_BUCKET}.`);
  }

  return {
    name: profileName,
    url: normalizeSupabaseUrl(requiredEnv(source, profileName, "SUPABASE_URL")),
    serviceRoleKey: requiredEnv(source, profileName, "SUPABASE_SERVICE_ROLE_KEY"),
    schema: "public",
    publicUrl: normalizeSupabaseUrl(requiredEnv(source, profileName, "NEXT_PUBLIC_SUPABASE_URL")),
    anonKey: requiredEnv(source, profileName, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    databaseUrl: source.SUPABASE_DB_URL?.trim() || null,
    storageBucket: NOTION_STORAGE_BUCKET,
  };
}

export function assertDistinctProfiles(pair: ProfilePair): void {
  if (pair.source.url === pair.target.url) {
    throw new Error("Source and target SUPABASE_URL resolve to the same project; refusing a self-migration.");
  }
}

export async function loadMigrationProfile(
  profileName: ProfileName,
  path: string,
  readEnvFile: ReadEnvFile = (file) => nodeReadFile(file, "utf8"),
): Promise<MigrationProfile> {
  return parseMigrationProfile(profileName, parseDotenv(await readEnvFile(path)));
}

export async function loadProfilePair(
  sourcePath: string,
  targetPath: string,
  readEnvFile?: ReadEnvFile,
): Promise<ProfilePair> {
  const [source, target] = await Promise.all([
    loadMigrationProfile("source", sourcePath, readEnvFile),
    loadMigrationProfile("target", targetPath, readEnvFile),
  ]);
  const pair = { source, target };
  assertDistinctProfiles(pair);
  return pair;
}

/** Safe for terminal and artifact output: credentials and DB URL are absent by construction. */
export function safeProfileSummary(profile: MigrationProfile): Record<string, unknown> {
  return {
    name: profile.name,
    url: profile.url,
    publicUrl: profile.publicUrl,
    schema: profile.schema,
    storageBucket: profile.storageBucket,
    serviceRoleKeyConfigured: true,
    anonKeyConfigured: true,
    databaseUrlConfigured: Boolean(profile.databaseUrl),
  };
}

export function redactKnownSecrets(message: string, profiles: readonly MigrationProfile[]): string {
  return profiles.reduce((safe, profile) => {
    const values = [profile.serviceRoleKey, profile.anonKey, profile.databaseUrl].filter(
      (value): value is string => Boolean(value),
    );
    return values.reduce((result, secret) => result.split(secret).join("[redacted]"), safe);
  }, message);
}
