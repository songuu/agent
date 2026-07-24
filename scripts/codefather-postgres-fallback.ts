import {
  synchronizeCodefatherRowsOnConfiguredPostgres,
} from "./codefather-postgres-store.ts";
import type {
  CodefatherSyncReport,
  StoredCodefatherRow,
} from "./sync-codefather-interview-to-supabase.ts";

function errorText(error: unknown): string {
  return error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 500) : String(error);
}

function sampleUrl(row: StoredCodefatherRow | undefined): string {
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const values = (metadata as Record<string, unknown>).sourceUrls;
  return Array.isArray(values) && typeof values[0] === "string" ? values[0] : "";
}

export async function buildCodefatherPostgresFallbackReport(input: {
  readonly started: Date;
  readonly limit: number;
  readonly pageSize: number;
  readonly tag: string;
  readonly sourceError: unknown;
  readonly findDuplicateSlugs: (rows: readonly StoredCodefatherRow[]) => readonly string[];
}): Promise<CodefatherSyncReport> {
  const state = await synchronizeCodefatherRowsOnConfiguredPostgres({
    findDuplicateSlugs: input.findDuplicateSlugs,
  });
  const remainingDuplicates = input.findDuplicateSlugs(state.storedRows);
  if (
    remainingDuplicates.length > 0 ||
    state.writerCount < input.limit ||
    state.readerCount < input.limit
  ) {
    throw new Error(
      `Codefather source fetch failed and PostgreSQL readback fallback is below target ` +
      `writer=${state.writerCount} reader=${state.readerCount} ` +
      `duplicates=${remainingDuplicates.length} target=${input.limit}; source=${errorText(input.sourceError)}`,
    );
  }

  const finished = new Date();
  const sample = state.storedRows[0];
  return {
    startedAt: input.started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - input.started.getTime(),
    sourceFetchStatus: "fallback-readback",
    sourceFetchError: errorText(input.sourceError),
    limit: input.limit,
    pageSize: input.pageSize,
    tag: input.tag,
    dryRun: false,
    fetched: 0,
    rowsBeforeDedupe: state.storedRows.length,
    rows: state.storedRows.length,
    duplicatesSkipped: 0,
    duplicateSlugCount: 0,
    duplicateSourceUrlCount: 0,
    duplicateTitleCount: 0,
    remoteDuplicatesDeleted: state.duplicatesDeleted,
    sampleQuestion: typeof sample?.question === "string" ? sample.question : "<readback-fallback>",
    sampleUrl: sampleUrl(sample),
    serviceCount: state.writerCount,
    anonCount: state.readerCount,
  };
}
