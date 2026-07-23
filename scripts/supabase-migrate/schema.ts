import { spawn as nodeSpawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

import type { DbExecutionRequest, DbExecutor, MigrationProfile } from "./types.ts";

export type MigrationFileReader = (directory: string) => Promise<readonly string[]>;

export async function readMigrationFiles(
  directory = resolve("supabase/migrations"),
  readDirectory: MigrationFileReader = async (path) => {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  },
): Promise<string[]> {
  const entries = await readDirectory(directory);
  const files = entries
    .filter((entry) => entry.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => (entry.includes("/") || entry.includes("\\") ? entry : resolve(directory, entry)));
  if (files.length === 0) throw new Error("No SQL migrations were found for the target schema stage.");
  return files;
}

export async function stageTargetSchema(options: {
  readonly target: MigrationProfile;
  readonly executor?: DbExecutor;
  readonly migrationFiles?: readonly string[];
  readonly migrationsDirectory?: string;
  readonly readDirectory?: MigrationFileReader;
}): Promise<{ readonly appliedMigrations: readonly string[] }> {
  if (!options.target.databaseUrl) {
    throw new Error("Target SUPABASE_DB_URL is required for schema stage; no target schema changes were made.");
  }
  if (!options.executor) {
    throw new Error("Schema stage requires a database executor; no target schema changes were made.");
  }
  const migrationFiles = options.migrationFiles
    ? [...options.migrationFiles]
    : await readMigrationFiles(options.migrationsDirectory, options.readDirectory);
  if (migrationFiles.length === 0) throw new Error("No SQL migrations were supplied for the target schema stage.");
  await options.executor({ databaseUrl: options.target.databaseUrl, migrationFiles });
  return { appliedMigrations: migrationFiles.map((file) => basename(file)) };
}

export interface SpawnProcessOptions {
  /** Kept out of argv so a connection URL cannot appear in process listings. */
  readonly env: NodeJS.ProcessEnv;
}

export type SpawnProcess = (command: string, args: readonly string[], options: SpawnProcessOptions) => Promise<number>;

export const spawnPsql: SpawnProcess = (command, args, options) =>
  new Promise((resolvePromise, reject) => {
    const child = nodeSpawn(command, [...args], { stdio: "inherit", windowsHide: true, env: options.env });
    child.once("error", () => reject(new Error("Could not start psql for the schema stage.")));
    child.once("exit", (code) => resolvePromise(code ?? 1));
  });

/** Production executor used by the CLI; failures name only the migration file, never the DB URL. */
export function createPsqlExecutor(runProcess: SpawnProcess = spawnPsql): DbExecutor {
  return async (request: DbExecutionRequest): Promise<void> => {
    for (const migrationFile of request.migrationFiles) {
      const exitCode = await runProcess("psql", [
        "--set",
        "ON_ERROR_STOP=1",
        "--single-transaction",
        "--file",
        migrationFile,
      ], {
        env: { ...process.env, PGDATABASE: request.databaseUrl },
      });
      if (exitCode !== 0) throw new Error(`psql failed while applying ${basename(migrationFile)} (exit ${exitCode}).`);
    }
  };
}
