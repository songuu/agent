import { CONTENT_TABLES } from "./manifest.ts";
import { assertDistinctProfiles, safeProfileSummary } from "./profiles.ts";
import { readAllTableRows, upsertTableRows } from "./rest.ts";
import { stageTargetSchema } from "./schema.ts";
import { copyNotionAssets, rewriteNotionArticleStorageUrls } from "./storage.ts";
import { verifyMigration, type MigrationVerification } from "./verify.ts";
import type { DbExecutor, FetchLike, MigrationPhase, ProfilePair, Row, TableManifest } from "./types.ts";

export interface CopyReport {
  readonly storage: Awaited<ReturnType<typeof copyNotionAssets>>;
  readonly tables: readonly { readonly table: string; readonly sourceRows: number; readonly upsertedRows: number }[];
}

export interface MigrationRunReport {
  readonly phases: Readonly<Record<string, unknown>>;
}

export type PhaseReporter = (phase: Exclude<MigrationPhase, "all">, report: unknown) => Promise<void> | void;

function phasesFor(phase: MigrationPhase, skipSchema: boolean): Exclude<MigrationPhase, "all">[] {
  if (phase !== "all") return [phase];
  return skipSchema ? ["preflight", "copy", "verify"] : ["preflight", "stage", "copy", "verify"];
}

function preflightReport(pair: ProfilePair): Record<string, unknown> {
  return {
    scope: {
      tables: CONTENT_TABLES.map((table) => ({
        table: table.table,
        conflictKey: table.conflictKey,
        copyFields: table.copyFields,
        keyFields: table.keyFields,
      })),
      storageBucket: "notion-assets",
      excluded: ["auth", "edge-functions", "realtime", "dashboard-settings", "unmanaged-extensions"],
    },
    source: safeProfileSummary(pair.source),
    target: safeProfileSummary(pair.target),
  };
}

async function copyContentData(options: {
  readonly profiles: ProfilePair;
  readonly manifests: readonly TableManifest[];
  readonly fetch: FetchLike;
  readonly pageSize?: number;
  readonly batchSize?: number;
}): Promise<CopyReport> {
  const storage = await copyNotionAssets({
    source: options.profiles.source,
    target: options.profiles.target,
    fetch: options.fetch,
    pageSize: options.pageSize,
  });
  const tables: Array<{ readonly table: string; readonly sourceRows: number; readonly upsertedRows: number }> = [];

  for (const manifest of options.manifests) {
    const sourceRows = await readAllTableRows({
      profile: options.profiles.source,
      manifest,
      fetch: options.fetch,
      pageSize: options.pageSize,
    });
    const rows: readonly Row[] =
      manifest.table === "notion_articles"
        ? sourceRows.map((row) => rewriteNotionArticleStorageUrls(row, options.profiles.source, options.profiles.target))
        : sourceRows;
    const upsertedRows = await upsertTableRows({
      profile: options.profiles.target,
      manifest,
      rows,
      fetch: options.fetch,
      batchSize: options.batchSize,
    });
    tables.push({ table: manifest.table, sourceRows: sourceRows.length, upsertedRows });
  }
  return { storage, tables };
}

function assertExecuteForWrites(phases: readonly Exclude<MigrationPhase, "all">[], execute: boolean, writersPaused: boolean): void {
  const writable = phases.filter((phase) => phase === "stage" || phase === "copy");
  if (writable.length > 0 && !execute) {
    throw new Error(`Phase ${writable.join(", ")} writes to the target. Re-run with --execute after reviewing preflight.`);
  }
  if (phases.includes("copy") && !writersPaused) {
    throw new Error("Copy phase requires --writers-paused to confirm source and target writers are paused.");
  }
}

export async function runMigration(options: {
  readonly profiles: ProfilePair;
  readonly phase: MigrationPhase;
  readonly execute: boolean;
  /** Explicit operational gate: no concurrent source/target writers during copy. */
  readonly writersPaused?: boolean;
  readonly fetch: FetchLike;
  readonly dbExecutor?: DbExecutor;
  readonly manifests?: readonly TableManifest[];
  readonly migrationsDirectory?: string;
  readonly migrationFiles?: readonly string[];
  readonly skipSchema?: boolean;
  readonly pageSize?: number;
  readonly batchSize?: number;
  readonly reportPhase?: PhaseReporter;
}): Promise<MigrationRunReport> {
  assertDistinctProfiles(options.profiles);
  const phases = phasesFor(options.phase, Boolean(options.skipSchema));
  assertExecuteForWrites(phases, options.execute, Boolean(options.writersPaused));
  const manifests = options.manifests ?? CONTENT_TABLES;
  const reports: Record<string, unknown> = {};

  for (const phase of phases) {
    if (phase === "preflight") {
      reports.preflight = preflightReport(options.profiles);
    } else if (phase === "stage") {
      reports.stage = await stageTargetSchema({
        target: options.profiles.target,
        executor: options.dbExecutor,
        migrationFiles: options.migrationFiles,
        migrationsDirectory: options.migrationsDirectory,
      });
    } else if (phase === "copy") {
      reports.copy = await copyContentData({
        profiles: options.profiles,
        manifests,
        fetch: options.fetch,
        pageSize: options.pageSize,
        batchSize: options.batchSize,
      });
    } else {
      const verification = await verifyMigration({
        source: options.profiles.source,
        target: options.profiles.target,
        manifests,
        fetch: options.fetch,
      });
      reports.verify = verification;
      await options.reportPhase?.(phase, verification);
      if (!verification.passed) {
        const failedTables = verification.tables.filter((table) => !table.passed).map((table) => table.table);
        if (!verification.storage.passed) failedTables.push("notion-assets");
        throw new Error(`Verification failed for: ${failedTables.join(", ")}. Target data was not altered by verify.`);
      }
      continue;
    }
    await options.reportPhase?.(phase, reports[phase]);
  }

  return { phases: reports };
}

export type { MigrationVerification };
