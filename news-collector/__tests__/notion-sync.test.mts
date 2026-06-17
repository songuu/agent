import assert from "node:assert/strict";
import { test } from "node:test";
import { syncNotion, type SyncDeps } from "../src/notion/sync.ts";
import { FIXTURE_SOURCE, makeNotionPage } from "../src/notion/fixtures.ts";

function baseDeps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    sources: [FIXTURE_SOURCE],
    now: new Date("2026-06-17T08:30:00.000Z"),
    dryRun: false,
    maxPages: 0,
    fullResync: true,
    cursorFor: async () => null,
    iteratePages: async function* () {
      yield makeNotionPage({ id: "be633bf1-dfa0-436d-b259-571129a590e5", title: "一" });
      yield makeNotionPage({ id: "aa11bb22-cc33-dd44-ee55-ff6677889900", title: "二" });
    },
    renderPage: async (page) => ({ markdown: `正文 ${page.id}`, assets: {} }),
    upsert: async (articles) => ({ attempted: articles.length, invalid: 0, pushed: articles.length, tableCount: `${articles.length}/*` }),
    ...overrides,
  };
}

test("dryRun never calls upsert", async () => {
  const report = await syncNotion(
    baseDeps({ dryRun: true, upsert: async () => { throw new Error("must not upsert in dryRun"); } }),
  );
  assert.equal(report.dryRun, true);
  assert.equal(report.totalPages, 2);
  assert.equal(report.upserted, 0);
});

test("live mode upserts all collected articles", async () => {
  const report = await syncNotion(baseDeps());
  assert.equal(report.totalPages, 2);
  assert.equal(report.upserted, 2);
  assert.equal(report.sources[0]?.ok, true);
});

test("per-page render failure is isolated, others still processed", async () => {
  let n = 0;
  const report = await syncNotion(
    baseDeps({
      renderPage: async (page) => {
        n += 1;
        if (n === 1) throw new Error("bad page");
        return { markdown: `正文 ${page.id}`, assets: {} };
      },
    }),
  );
  assert.equal(report.totalPages, 1);
  assert.equal(report.sources[0]?.pageErrors, 1);
  assert.equal(report.sources[0]?.ok, true);
});

test("maxPages caps pages per source", async () => {
  const report = await syncNotion(baseDeps({ maxPages: 1 }));
  assert.equal(report.totalPages, 1);
});

test("source-level failure is isolated and reported", async () => {
  const report = await syncNotion(
    baseDeps({
      iteratePages: async function* () {
        throw new Error("notion unauthorized");
        // eslint-disable-next-line no-unreachable
      },
    }),
  );
  assert.equal(report.sources[0]?.ok, false);
  assert.match(report.sources[0]?.error ?? "", /unauthorized/);
});

test("incremental: cursor from cursorFor flows to iteratePages as sinceIso", async () => {
  let receivedSince: string | null | undefined = "UNSET";
  const report = await syncNotion(
    baseDeps({
      fullResync: false,
      cursorFor: async () => "2026-06-10T00:00:00.000Z",
      iteratePages: async function* (_source, sinceIso) {
        receivedSince = sinceIso;
        yield makeNotionPage({ title: "x" });
      },
    }),
  );
  assert.equal(receivedSince, "2026-06-10T00:00:00.000Z");
  assert.equal(report.totalPages, 1);
});

test("fullResync ignores the cursor (sinceIso null = full backfill)", async () => {
  let receivedSince: string | null | undefined = "UNSET";
  await syncNotion(
    baseDeps({
      fullResync: true,
      cursorFor: async () => "2026-06-10T00:00:00.000Z",
      iteratePages: async function* (_source, sinceIso) {
        receivedSince = sinceIso;
      },
    }),
  );
  assert.equal(receivedSince, null);
});

test("articles carry collected image manifest into metadata.assets", async () => {
  const report = await syncNotion(
    baseDeps({
      renderPage: async (page) => ({
        markdown: `正文 ${page.id}`,
        assets: { b1: { blockId: "b1", storageKey: "k", publicUrl: "u", srcHash: "h" } },
      }),
    }),
  );
  const meta = report.articles[0]?.metadata as { assets?: Record<string, unknown> };
  assert.ok(meta.assets?.b1);
});
