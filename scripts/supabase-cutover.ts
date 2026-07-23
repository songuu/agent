import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { parse as parseDotenv } from "dotenv";
import {
  resolvePublicSupabaseRuntimeConfig,
  writeSupabaseRuntimeConfig,
} from "./write-supabase-runtime-config.ts";

const DEFAULT_RUNTIME_CONFIG_PATH = ".vitepress/public/supabase-runtime-config.json";
const DEFAULT_ARTIFACT_ROOT = ".supabase-migration";
const REQUIRED_VERIFIED_TABLES = [
  "frontier_ecosystem_articles",
  "interview_questions",
  "glossary_terms",
  "news_items",
  "notion_articles",
] as const;

const CUTOVER_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SCHEMA",
  "SUPABASE_DB_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NOTION_STORAGE_BUCKET",
] as const;

type CutoverKey = (typeof CUTOVER_KEYS)[number];

type TargetValues = Partial<Record<CutoverKey, string>>;

export interface CutoverOptions {
  readonly targetEnvPath: string;
  readonly activeEnvPaths: readonly string[];
  readonly runtimeConfigPath: string;
  readonly artifactRoot: string;
  readonly migrationId: string;
  readonly execute: boolean;
  readonly confirm: string | null;
  readonly rollbackPath: string | null;
}

interface CutoverRecord {
  readonly version: 1;
  readonly migrationId: string;
  readonly createdAt: string;
  readonly activeEnvBackups: ReadonlyArray<{ activePath: string; backupPath: string }>;
  readonly runtimeConfig: {
    readonly activePath: string;
    readonly backupPath: string | null;
  };
  readonly publicOrigin: string;
}

export function parseCutoverArgs(args: readonly string[]): CutoverOptions {
  let targetEnvPath = "";
  const activeEnvPaths: string[] = [];
  let runtimeConfigPath = DEFAULT_RUNTIME_CONFIG_PATH;
  let artifactRoot = DEFAULT_ARTIFACT_ROOT;
  let migrationId = "";
  let execute = false;
  let confirm: string | null = null;
  let rollbackPath: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--target-env") targetEnvPath = optionValue(args, ++index, arg);
    else if (arg === "--active-env") activeEnvPaths.push(optionValue(args, ++index, arg));
    else if (arg === "--runtime-config") runtimeConfigPath = optionValue(args, ++index, arg);
    else if (arg === "--artifact-root") artifactRoot = optionValue(args, ++index, arg);
    else if (arg === "--migration-id") migrationId = optionValue(args, ++index, arg);
    else if (arg === "--confirm") confirm = optionValue(args, ++index, arg);
    else if (arg === "--rollback") rollbackPath = optionValue(args, ++index, arg);
    else if (arg === "--execute") execute = true;
    else if (arg === "--help" || arg === "-h") {
      throw new Error(
        "Usage: tsx scripts/supabase-cutover.ts --target-env .env.supabase-target --migration-id <id> [--active-env .env] [--execute --confirm <id>] [--rollback <cutover-dir>]",
      );
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!migrationId) throw new Error("--migration-id is required.");
  if (!rollbackPath && !targetEnvPath) throw new Error("--target-env is required unless --rollback is used.");

  return {
    targetEnvPath,
    activeEnvPaths,
    runtimeConfigPath,
    artifactRoot,
    migrationId,
    execute,
    confirm,
    rollbackPath,
  };
}

export async function runSupabaseCutover(options: CutoverOptions): Promise<{
  readonly mode: "plan" | "cutover" | "rollback";
  readonly migrationId: string;
  readonly activeEnvPaths: readonly string[];
  readonly publicOrigin: string | null;
}> {
  assertMigrationId(options.migrationId);
  const activeEnvPaths = resolveActiveEnvPaths(options.activeEnvPaths);
  const runtimeConfigPath = assertWorkspacePath(options.runtimeConfigPath, "runtime config");
  const artifactRoot = assertWorkspacePath(options.artifactRoot, "artifact root");
  const targetEnvPath = options.rollbackPath
    ? null
    : assertWorkspacePath(options.targetEnvPath, "target env");
  const rollbackPath = options.rollbackPath
    ? assertWorkspacePath(options.rollbackPath, "rollback")
    : null;

  if (!options.execute) {
    const origin = rollbackPath ? null : publicOriginFromTarget(await readTargetValues(targetEnvPath!));
    return {
      mode: "plan",
      migrationId: options.migrationId,
      activeEnvPaths,
      publicOrigin: origin,
    };
  }
  if (options.confirm !== options.migrationId) {
    throw new Error("--execute requires --confirm to exactly match --migration-id.");
  }

  if (rollbackPath) {
    await rollbackCutover(rollbackPath, activeEnvPaths, runtimeConfigPath, options.migrationId);
    return { mode: "rollback", migrationId: options.migrationId, activeEnvPaths, publicOrigin: null };
  }

  await assertSuccessfulVerification(artifactRoot, options.migrationId);
  const targetValues = await readTargetValues(targetEnvPath!);
  const runtimeConfig = resolvePublicSupabaseRuntimeConfig(targetValues);
  if (!runtimeConfig?.supabase) {
    throw new Error("Target profile is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const artifactDirectory = assertPathWithin(
    artifactRoot,
    resolve(artifactRoot, options.migrationId, "cutover"),
    "artifact directory",
  );
  await mkdir(artifactDirectory, { recursive: true });
  const record = await createCutoverBackups({
    activeEnvPaths,
    runtimeConfigPath,
    artifactDirectory,
    migrationId: options.migrationId,
    publicOrigin: new URL(runtimeConfig.supabase.url).origin,
  });

  try {
    for (const activeEnvPath of activeEnvPaths) {
      const current = await readFile(activeEnvPath, "utf8");
      await writeAtomically(activeEnvPath, updateEnvText(current, targetValues));
    }
    await writeSupabaseRuntimeConfig({ env: targetValues, outputPath: runtimeConfigPath });
    await writeAtomically(
      resolve(artifactDirectory, "cutover.json"),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  } catch (error) {
    await restoreCutoverRecord(record);
    throw error;
  }

  return {
    mode: "cutover",
    migrationId: options.migrationId,
    activeEnvPaths,
    publicOrigin: record.publicOrigin,
  };
}

export function updateEnvText(source: string, values: TargetValues): string {
  const normalizedSource = source.replace(/\r\n/g, "\n");
  const seen = new Set<string>();
  const lines = normalizedSource.split("\n").map((line) => {
    const match = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$/.exec(line);
    if (!match) return line;
    const [, prefix, key, separator] = match;
    if (!key || !isCutoverKey(key) || values[key] === undefined) return line;
    seen.add(key);
    return `${prefix}${key}${separator}${encodeEnvValue(values[key] ?? "")}`;
  });

  for (const key of CUTOVER_KEYS) {
    const value = values[key];
    if (value === undefined || seen.has(key)) continue;
    lines.push(`${key}=${encodeEnvValue(value)}`);
  }

  return `${lines.join("\n").replace(/\n*$/, "")}\n`;
}

async function readTargetValues(targetEnvPath: string): Promise<TargetValues> {
  const parsed = parseDotenv(await readFile(targetEnvPath, "utf8"));
  const values: TargetValues = {};
  for (const key of CUTOVER_KEYS) {
    const value = parsed[key]?.trim();
    if (value) values[key] = value;
  }

  for (const required of [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ] as const) {
    if (!values[required]) throw new Error(`Target profile is missing ${required}.`);
  }
  values.SUPABASE_SCHEMA ??= "public";
  values.NOTION_STORAGE_BUCKET ??= "notion-assets";
  return values;
}

function publicOriginFromTarget(values: TargetValues): string {
  const config = resolvePublicSupabaseRuntimeConfig(values);
  if (!config?.supabase) throw new Error("Target profile is missing public Supabase config.");
  return new URL(config.supabase.url).origin;
}

async function assertSuccessfulVerification(artifactRoot: string, migrationId: string): Promise<void> {
  const verificationPath = assertPathWithin(
    artifactRoot,
    resolve(artifactRoot, migrationId, "verify.json"),
    "verification artifact",
  );
  let value: unknown;
  try {
    value = JSON.parse(await readFile(verificationPath, "utf8"));
  } catch {
    throw new Error(
      `Cutover requires a successful verification artifact at ${verificationPath}. Run the migration verify/all phase first.`,
    );
  }
  if (!hasSuccessfulVerification(value)) {
    throw new Error(
      `Cutover requires ${verificationPath} to report passed=true for every scoped table and notion-assets.`,
    );
  }
}

function hasSuccessfulVerification(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const verification = value as Record<string, unknown>;
  if (verification.passed !== true || !Array.isArray(verification.tables)) return false;
  const verifiedTables = new Set<string>();
  for (const table of verification.tables) {
    if (!table || typeof table !== "object") return false;
    const result = table as Record<string, unknown>;
    if (typeof result.table !== "string" || result.passed !== true) return false;
    verifiedTables.add(result.table);
  }
  const storage = verification.storage;
  if (!storage || typeof storage !== "object" || (storage as Record<string, unknown>).passed !== true) {
    return false;
  }
  return (
    verifiedTables.size === REQUIRED_VERIFIED_TABLES.length &&
    REQUIRED_VERIFIED_TABLES.every((table) => verifiedTables.has(table))
  );
}

async function createCutoverBackups(input: {
  activeEnvPaths: readonly string[];
  runtimeConfigPath: string;
  artifactDirectory: string;
  migrationId: string;
  publicOrigin: string;
}): Promise<CutoverRecord> {
  const activeEnvBackups: Array<{ activePath: string; backupPath: string }> = [];
  for (const [index, activePath] of input.activeEnvPaths.entries()) {
    const backupPath = resolve(input.artifactDirectory, `active-${index}.env`);
    await copyFile(activePath, backupPath);
    activeEnvBackups.push({ activePath, backupPath });
  }

  let runtimeBackupPath: string | null = null;
  if (existsSync(input.runtimeConfigPath)) {
    runtimeBackupPath = resolve(input.artifactDirectory, "supabase-runtime-config.json");
    await copyFile(input.runtimeConfigPath, runtimeBackupPath);
  }

  return {
    version: 1,
    migrationId: input.migrationId,
    createdAt: new Date().toISOString(),
    activeEnvBackups,
    runtimeConfig: { activePath: input.runtimeConfigPath, backupPath: runtimeBackupPath },
    publicOrigin: input.publicOrigin,
  };
}

async function rollbackCutover(
  rollbackPath: string,
  expectedActivePaths: readonly string[],
  runtimeConfigPath: string,
  migrationId: string,
): Promise<void> {
  const recordPath = assertPathWithin(rollbackPath, resolve(rollbackPath, "cutover.json"), "rollback record");
  const raw = await readFile(recordPath, "utf8");
  const record = JSON.parse(raw) as CutoverRecord;
  if (record.version !== 1 || record.migrationId !== migrationId) {
    throw new Error("Rollback record does not match the requested migration id.");
  }
  const recordedPaths = record.activeEnvBackups.map((item) => item.activePath).sort();
  const expectedPaths = [...expectedActivePaths].sort();
  if (JSON.stringify(recordedPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("Rollback active env paths do not match the original cutover record.");
  }
  if (record.runtimeConfig.activePath !== runtimeConfigPath) {
    throw new Error("Rollback runtime config path does not match the original cutover record.");
  }
  for (const backup of record.activeEnvBackups) {
    assertPathWithin(rollbackPath, backup.backupPath, "rollback env backup");
  }
  if (record.runtimeConfig.backupPath) {
    assertPathWithin(rollbackPath, record.runtimeConfig.backupPath, "rollback runtime backup");
  }
  await restoreCutoverRecord(record);
}

async function restoreCutoverRecord(record: CutoverRecord): Promise<void> {
  for (const backup of record.activeEnvBackups) {
    await copyFile(backup.backupPath, backup.activePath);
  }
  if (record.runtimeConfig.backupPath) {
    await copyFile(record.runtimeConfig.backupPath, record.runtimeConfig.activePath);
  } else {
    await rm(record.runtimeConfig.activePath, { force: true });
  }
}

function resolveActiveEnvPaths(input: readonly string[]): string[] {
  const candidates = input.length > 0 ? input : [".env", "news-collector/.env"];
  const paths = candidates.map((path) => assertWorkspacePath(path, "active env"));
  if (input.length > 0) {
    const missing = paths.filter((path) => !existsSync(path));
    if (missing.length > 0) throw new Error(`Explicit active env file does not exist: ${missing.join(", ")}`);
  }
  const existingPaths = paths.filter((path) => existsSync(path));
  if (existingPaths.length === 0) throw new Error("No active env file found. Pass --active-env explicitly.");
  return [...new Set(existingPaths)];
}

function assertWorkspacePath(path: string, label: string): string {
  const workspace = resolve();
  const absolute = resolve(path);
  return assertPathWithin(workspace, absolute, `${label} must stay within the workspace: ${path}`);
}

function assertPathWithin(root: string, candidate: string, label: string): string {
  const relativePath = relative(root, candidate);
  const escapedRoot = relativePath === ".." || relativePath.startsWith(`..\\`) || relativePath.startsWith("../") || isAbsolute(relativePath);
  if (escapedRoot) throw new Error(label);
  return candidate;
}

function assertMigrationId(migrationId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(migrationId)) {
    throw new Error("migration id must contain only letters, numbers, dot, underscore, or hyphen.");
  }
}

function isCutoverKey(value: string): value is CutoverKey {
  return (CUTOVER_KEYS as readonly string[]).includes(value);
}

function encodeEnvValue(value: string): string {
  if (/[\r\n]/.test(value)) throw new Error("Supabase env values cannot contain line breaks.");
  return /\s|[#'"\\]/.test(value) ? JSON.stringify(value) : value;
}

async function writeAtomically(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, path);
}

function optionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}

async function main(): Promise<void> {
  const options = parseCutoverArgs(process.argv.slice(2));
  const result = await runSupabaseCutover(options);
  const prefix = result.mode === "plan" ? "PLAN" : result.mode.toUpperCase();
  process.stdout.write(
    `${prefix} migration=${result.migrationId} activeEnvFiles=${result.activeEnvPaths.length}${result.publicOrigin ? ` publicOrigin=${result.publicOrigin}` : ""}\n`,
  );
}

const invokedPath = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (invokedPath.endsWith("/supabase-cutover.ts")) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
