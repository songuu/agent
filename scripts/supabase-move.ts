#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { writeSafeArtifact } from "./supabase-migrate/artifacts.ts";
import { loadProfilePair, redactKnownSecrets } from "./supabase-migrate/profiles.ts";
import { runMigration } from "./supabase-migrate/runner.ts";
import { createPsqlExecutor } from "./supabase-migrate/schema.ts";
import type { FetchLike, FetchRequest, FetchResponse, ProfilePair } from "./supabase-migrate/types.ts";
import { runSupabaseCutover } from "./supabase-cutover.ts";

export const SUPABASE_MOVE_ARTIFACT_ROOT = ".supabase-migration";
export const DEFAULT_RUNTIME_CONFIG_PATH = ".vitepress/public/supabase-runtime-config.json";

export interface SupabaseMoveOptions {
  readonly sourceEnv: string;
  readonly targetEnv: string;
  readonly activeEnvPaths: readonly string[];
  readonly runtimeConfigPath: string;
  readonly migrationId: string;
  readonly artifactRoot: typeof SUPABASE_MOVE_ARTIFACT_ROOT;
  readonly execute: boolean;
  readonly confirm: string | null;
  readonly writersPaused: boolean;
  readonly skipSchema: boolean;
  readonly help: boolean;
}

export interface SupabaseMoveResult {
  readonly mode: "plan" | "moved";
  readonly migrationId: string;
  readonly completedPhases: readonly string[];
  readonly artifactPaths: readonly string[];
  readonly publicOrigin: string | null;
}

export interface SupabaseMoveDependencies {
  readonly fetch?: FetchLike;
  readonly loadProfilePair?: typeof loadProfilePair;
  readonly runMigration?: typeof runMigration;
  readonly createPsqlExecutor?: typeof createPsqlExecutor;
  readonly writeSafeArtifact?: typeof writeSafeArtifact;
  readonly runSupabaseCutover?: typeof runSupabaseCutover;
}

function defaultMigrationId(now = new Date()): string {
  return `supabase-move-${now.toISOString().replace(/[:.]/g, "-")}`;
}

function optionValue(argv: readonly string[], index: number, option: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}

/**
 * The move command intentionally has no phase selector. Its execute path is
 * one fixed sequence, so operators cannot accidentally cut over after an
 * incomplete partial run.
 */
export function parseSupabaseMoveArgs(argv: readonly string[], now = new Date()): SupabaseMoveOptions {
  let sourceEnv = ".env.supabase-source";
  let targetEnv = ".env.supabase-target";
  const activeEnvPaths: string[] = [];
  let runtimeConfigPath = DEFAULT_RUNTIME_CONFIG_PATH;
  let migrationId = defaultMigrationId(now);
  let execute = false;
  let confirm: string | null = null;
  let writersPaused = false;
  let skipSchema = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source-env") {
      sourceEnv = optionValue(argv, ++index, argument);
    } else if (argument === "--target-env") {
      targetEnv = optionValue(argv, ++index, argument);
    } else if (argument === "--active-env") {
      activeEnvPaths.push(optionValue(argv, ++index, argument));
    } else if (argument === "--runtime-config") {
      runtimeConfigPath = optionValue(argv, ++index, argument);
    } else if (argument === "--migration-id") {
      migrationId = optionValue(argv, ++index, argument);
    } else if (argument === "--confirm") {
      confirm = optionValue(argv, ++index, argument);
    } else if (argument === "--execute") {
      execute = true;
    } else if (argument === "--writers-paused") {
      writersPaused = true;
    } else if (argument === "--skip-schema") {
      skipSchema = true;
    } else if (argument === "--help" || argument === "-h") {
      help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (execute && !writersPaused) {
    throw new Error("--execute requires --writers-paused after source and target writers are stopped.");
  }
  if (execute && confirm !== migrationId) {
    throw new Error("--execute requires --confirm to exactly match --migration-id.");
  }

  return {
    sourceEnv,
    targetEnv,
    activeEnvPaths,
    runtimeConfigPath,
    migrationId,
    artifactRoot: SUPABASE_MOVE_ARTIFACT_ROOT,
    execute,
    confirm,
    writersPaused,
    skipSchema,
    help,
  };
}

export function supabaseMoveUsage(): string {
  return [
    "Usage: tsx scripts/supabase-move.ts [options]",
    "",
    "Default: read-only preflight and a redacted artifact only.",
    "Execute: preflight -> stage -> copy -> verify -> cutover.",
    "Cutover runs only when verification passed and verify.json was written.",
    "",
    "  --source-env <file>          default .env.supabase-source",
    "  --target-env <file>          default .env.supabase-target",
    "  --active-env <file>          repeatable; defaults are resolved by cutover",
    "  --runtime-config <file>      default .vitepress/public/supabase-runtime-config.json",
    "  --migration-id <id>          default timestamped identifier",
    "  --skip-schema                skip the target schema stage during execute",
    "  --execute --confirm <id> --writers-paused",
  ].join("\n");
}

const nativeFetch: FetchLike = (input: string, init?: FetchRequest) =>
  globalThis.fetch(input, init as RequestInit) as unknown as Promise<FetchResponse>;

function profileSecrets(pair: ProfilePair): string[] {
  return [
    pair.source.serviceRoleKey,
    pair.source.anonKey,
    pair.source.databaseUrl ?? "",
    pair.target.serviceRoleKey,
    pair.target.anonKey,
    pair.target.databaseUrl ?? "",
  ];
}

function assertPassedVerification(value: unknown): void {
  if (!value || typeof value !== "object" || (value as { readonly passed?: unknown }).passed !== true) {
    throw new Error("Verification did not pass; refusing Supabase config cutover.");
  }
}

/**
 * Executes one bounded migration transaction from the application's point of
 * view. Database/storage writes remain retry-safe, while the final local
 * configuration flip is withheld until the exact verification artifact exists.
 */
export async function runSupabaseMove(
  options: SupabaseMoveOptions,
  dependencies: SupabaseMoveDependencies = {},
): Promise<SupabaseMoveResult> {
  if (options.artifactRoot !== SUPABASE_MOVE_ARTIFACT_ROOT) {
    throw new Error(`Supabase move artifacts must use ${SUPABASE_MOVE_ARTIFACT_ROOT}.`);
  }
  if (options.execute && !options.writersPaused) {
    throw new Error("--execute requires --writers-paused after source and target writers are stopped.");
  }
  if (options.execute && options.confirm !== options.migrationId) {
    throw new Error("--execute requires --confirm to exactly match --migration-id.");
  }

  const loadProfiles = dependencies.loadProfilePair ?? loadProfilePair;
  const executeMigration = dependencies.runMigration ?? runMigration;
  const makePsqlExecutor = dependencies.createPsqlExecutor ?? createPsqlExecutor;
  const saveArtifact = dependencies.writeSafeArtifact ?? writeSafeArtifact;
  const cutover = dependencies.runSupabaseCutover ?? runSupabaseCutover;
  const profiles = await loadProfiles(options.sourceEnv, options.targetEnv);
  const artifactPaths: string[] = [];
  let verifyArtifactPath: string | null = null;

  const report = await executeMigration({
    profiles,
    phase: options.execute ? "all" : "preflight",
    execute: options.execute,
    writersPaused: options.writersPaused,
    skipSchema: options.execute ? options.skipSchema : false,
    fetch: dependencies.fetch ?? nativeFetch,
    dbExecutor: options.execute ? makePsqlExecutor() : undefined,
    reportPhase: async (phase, value) => {
      const artifactPath = await saveArtifact({
        artifactRoot: options.artifactRoot,
        migrationId: options.migrationId,
        phase,
        value,
        knownSecrets: profileSecrets(profiles),
      });
      artifactPaths.push(artifactPath);
      if (phase === "verify") verifyArtifactPath = artifactPath;
    },
  });

  if (!options.execute) {
    return {
      mode: "plan",
      migrationId: options.migrationId,
      completedPhases: Object.keys(report.phases),
      artifactPaths,
      publicOrigin: null,
    };
  }

  assertPassedVerification(report.phases.verify);
  if (!verifyArtifactPath) {
    throw new Error("Verification artifact was not written; refusing Supabase config cutover.");
  }

  const cutoverResult = await cutover({
    targetEnvPath: options.targetEnv,
    activeEnvPaths: options.activeEnvPaths,
    runtimeConfigPath: options.runtimeConfigPath,
    artifactRoot: options.artifactRoot,
    migrationId: options.migrationId,
    execute: true,
    confirm: options.confirm,
    rollbackPath: null,
  });
  if (cutoverResult.mode !== "cutover") {
    throw new Error("Supabase config cutover did not complete; source configuration remains authoritative.");
  }

  return {
    mode: "moved",
    migrationId: options.migrationId,
    completedPhases: Object.keys(report.phases),
    artifactPaths,
    publicOrigin: cutoverResult.publicOrigin,
  };
}

function safeErrorMessage(error: unknown, profiles: ProfilePair | null): string {
  const message = error instanceof Error ? error.message : String(error);
  return profiles ? redactKnownSecrets(message, [profiles.source, profiles.target]) : message;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseSupabaseMoveArgs(argv);
  if (options.help) {
    process.stdout.write(`${supabaseMoveUsage()}\n`);
    return;
  }

  let profiles: ProfilePair | null = null;
  try {
    profiles = await loadProfilePair(options.sourceEnv, options.targetEnv);
    const result = await runSupabaseMove(options, {
      loadProfilePair: async () => profiles!,
    });
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: result.mode,
          migrationId: result.migrationId,
          completedPhases: result.completedPhases,
          artifactPaths: result.artifactPaths,
          publicOrigin: result.publicOrigin,
        },
        null,
        2,
      )}\n`,
    );
  } catch (error: unknown) {
    process.stderr.write(`Supabase move failed: ${safeErrorMessage(error, profiles)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main();
}
