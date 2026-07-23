#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { writeSafeArtifact } from "../supabase-migrate/artifacts.ts";
import { parseDotenv } from "../supabase-migrate/profiles.ts";
import {
  parseMysqlMigrationTarget,
  parseSupabaseContentSource,
  runSupabaseToMysqlContentMigration,
  type ContentMysqlMigrationPhase,
} from "./mysql.ts";
import type { FetchLike, FetchRequest, FetchResponse } from "../supabase-migrate/types.ts";

export interface MysqlMigrationCliOptions {
  readonly phase: ContentMysqlMigrationPhase;
  readonly execute: boolean;
  readonly writersPaused: boolean;
  readonly sourceEnv: string;
  readonly targetEnv: string;
  readonly migrationId: string;
  readonly artifactRoot: string;
  readonly help: boolean;
}

function defaultMigrationId(now = new Date()): string {
  return `content-mysql-${now.toISOString().replace(/[:.]/g, "-")}`;
}

function requiredArgument(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

export function parseMysqlMigrationCliArgs(
  argv: readonly string[],
  now = new Date(),
): MysqlMigrationCliOptions {
  let phase: ContentMysqlMigrationPhase = "preflight";
  let execute = false;
  let writersPaused = false;
  let sourceEnv = ".env.content-source";
  let targetEnv = ".env.content-mysql";
  let migrationId = defaultMigrationId(now);
  let artifactRoot = ".content-migration";
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--execute") {
      execute = true;
    } else if (argument === "--writers-paused") {
      writersPaused = true;
    } else if (argument === "--help" || argument === "-h") {
      help = true;
    } else if (argument === "--phase") {
      const value = requiredArgument(argv, index, argument) as ContentMysqlMigrationPhase;
      if (!(["preflight", "stage", "copy", "verify", "all"] as const).includes(value)) {
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

  return { phase, execute, writersPaused, sourceEnv, targetEnv, migrationId, artifactRoot, help };
}

export function mysqlMigrationUsage(): string {
  return [
    "Usage: tsx scripts/content-migrate/mysql-cli.ts [options]",
    "",
    "Migrates only the five owned relational content tables from Supabase to MySQL.",
    "It does not copy Supabase Storage, Auth, RLS, Edge Functions, or browser config.",
    "Defaults to --phase preflight and writes nothing.",
    "  --phase preflight|stage|copy|verify|all",
    "  --execute                     required for stage, copy, and all",
    "  --writers-paused              required for copy/all; confirms content writers are stopped",
    "  --source-env <file>           default .env.content-source",
    "  --target-env <file>           default .env.content-mysql",
    "  --migration-id <id>           local artifact directory name",
    "  --artifact-root <path>        local artifact root inside this repository",
  ].join("\n");
}

const nativeFetch: FetchLike = (input: string, init?: FetchRequest) =>
  globalThis.fetch(input, init as RequestInit) as unknown as Promise<FetchResponse>;

function redact(message: string, secrets: readonly string[]): string {
  return secrets.reduce((safe, secret) => (secret ? safe.split(secret).join("[redacted]") : safe), message);
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseMysqlMigrationCliArgs(argv);
  if (options.help) {
    process.stdout.write(`${mysqlMigrationUsage()}\n`);
    return;
  }

  let secrets: string[] = [];
  try {
    const [sourceFile, targetFile] = await Promise.all([
      readFile(options.sourceEnv, "utf8"),
      readFile(options.targetEnv, "utf8"),
    ]);
    const source = parseSupabaseContentSource(parseDotenv(sourceFile));
    const target = parseMysqlMigrationTarget(parseDotenv(targetFile));
    secrets = [source.serviceRoleKey, target.password];
    const artifactPaths: string[] = [];
    const report = await runSupabaseToMysqlContentMigration({
      source,
      target,
      phase: options.phase,
      execute: options.execute,
      writersPaused: options.writersPaused,
      fetch: nativeFetch,
      reportPhase: async (phase, value) => {
        artifactPaths.push(
          await writeSafeArtifact({
            artifactRoot: options.artifactRoot,
            migrationId: options.migrationId,
            phase,
            value,
            knownSecrets: secrets,
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
  } catch (error) {
    process.stderr.write(`Content MySQL migration failed: ${redact(error instanceof Error ? error.message : String(error), secrets)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main();
}