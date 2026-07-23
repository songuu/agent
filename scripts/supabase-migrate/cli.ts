#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { writeSafeArtifact } from "./artifacts.ts";
import { loadProfilePair, redactKnownSecrets } from "./profiles.ts";
import { runMigration } from "./runner.ts";
import { createPsqlExecutor } from "./schema.ts";
import type { FetchLike, FetchRequest, FetchResponse, MigrationPhase, ProfilePair } from "./types.ts";

export interface CliOptions {
  readonly phase: MigrationPhase;
  readonly execute: boolean;
  readonly writersPaused: boolean;
  readonly sourceEnv: string;
  readonly targetEnv: string;
  readonly migrationId: string;
  readonly artifactRoot: string;
  readonly skipSchema: boolean;
  readonly help: boolean;
}

function defaultMigrationId(now = new Date()): string {
  return `supabase-${now.toISOString().replace(/[:.]/g, "-")}`;
}

function requiredArgument(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

export function parseCliArgs(argv: readonly string[], now = new Date()): CliOptions {
  let phase: MigrationPhase = "preflight";
  let execute = false;
  let writersPaused = false;
  let sourceEnv = ".env.supabase-source";
  let targetEnv = ".env.supabase-target";
  let migrationId = defaultMigrationId(now);
  let artifactRoot = ".supabase-migration";
  let skipSchema = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--execute") {
      execute = true;
    } else if (argument === "--writers-paused") {
      writersPaused = true;
    } else if (argument === "--skip-schema") {
      skipSchema = true;
    } else if (argument === "--help" || argument === "-h") {
      help = true;
    } else if (argument === "--phase") {
      const value = requiredArgument(argv, index, argument) as MigrationPhase;
      if (!["preflight", "stage", "copy", "verify", "all"].includes(value)) {
        throw new Error("--phase must be preflight, stage, copy, verify, or all.");
      }
      phase = value;
      index += 1;
    } else if (argument === "--source-env") {
      sourceEnv = requiredArgument(argv, index, argument);
      index += 1;
    } else if (argument === "--target-env") {
      targetEnv = requiredArgument(argv, index, argument);
      index += 1;
    } else if (argument === "--migration-id") {
      migrationId = requiredArgument(argv, index, argument);
      index += 1;
    } else if (argument === "--artifact-root") {
      artifactRoot = requiredArgument(argv, index, argument);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (skipSchema && phase !== "all") throw new Error("--skip-schema is only valid with --phase all.");
  return { phase, execute, writersPaused, sourceEnv, targetEnv, migrationId, artifactRoot, skipSchema, help };
}

export function usage(): string {
  return [
    "Usage: tsx scripts/supabase-migrate/cli.ts [options]",
    "",
    "Defaults to --phase preflight and does not write to the target.",
    "  --phase preflight|stage|copy|verify|all",
    "  --execute                     required for stage, copy, and all",
    "  --writers-paused              required for copy/all; confirms source and target writers are paused",
    "  --source-env <file>           default .env.supabase-source",
    "  --target-env <file>           default .env.supabase-target",
    "  --migration-id <id>           local artifact directory name",
    "  --skip-schema                 only with --phase all; target schema was staged separately",
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

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  let profiles: ProfilePair | undefined;
  try {
    profiles = await loadProfilePair(options.sourceEnv, options.targetEnv);
    const artifactPaths: string[] = [];
    const report = await runMigration({
      profiles,
      phase: options.phase,
      execute: options.execute,
      writersPaused: options.writersPaused,
      skipSchema: options.skipSchema,
      fetch: nativeFetch,
      dbExecutor: options.execute ? createPsqlExecutor() : undefined,
      reportPhase: async (phase, value) => {
        artifactPaths.push(
          await writeSafeArtifact({
            artifactRoot: options.artifactRoot,
            migrationId: options.migrationId,
            phase,
            value,
            knownSecrets: profileSecrets(profiles!),
          }),
        );
      },
    });
    process.stdout.write(
      `${JSON.stringify(
        {
          migrationId: options.migrationId,
          phase: options.phase,
          execute: options.execute,
          writersPaused: options.writersPaused,
          artifactPaths,
          report: report.phases,
        },
        null,
        2,
      )}\n`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const safeMessage = profiles ? redactKnownSecrets(message, [profiles.source, profiles.target]) : message;
    process.stderr.write(`Supabase migration failed: ${safeMessage}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main();
}
