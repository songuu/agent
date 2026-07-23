import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_TABLES } from "./manifest.ts";
import { readAllTableRows, upsertTableRows } from "./rest.ts";
import { jsonResponse, portableRow, profile } from "./test-helpers.ts";
import type { FetchRequest } from "./types.ts";

test("service-role reads use deterministic Range pagination", async () => {
  const manifest = CONTENT_TABLES[2]!;
  const rows = [portableRow(manifest, "a"), portableRow(manifest, "b"), portableRow(manifest, "c")];
  const calls: Array<{ url: string; init?: FetchRequest }> = [];
  const fetched = await readAllTableRows({
    profile: profile("source", "https://source.test"),
    manifest,
    pageSize: 2,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const range = init?.headers?.Range;
      if (range === "0-1") return jsonResponse(rows.slice(0, 2), { headers: { "content-range": "0-1/3" } });
      if (range === "2-3") return jsonResponse(rows.slice(2), { headers: { "content-range": "2-2/3" } });
      throw new Error(`Unexpected range: ${range}`);
    },
  });

  assert.deepEqual(fetched.map((row) => row.slug), ["a", "b", "c"]);
  assert.equal(calls.length, 2);
  assert.match(calls[0]!.url, /select=/);
  assert.equal(calls[0]!.init?.headers?.Authorization, "Bearer source-service-secret");
  assert.equal(calls[0]!.init?.headers?.["Accept-Profile"], "public");
});

test("batch upserts use manifest conflict key and project out ids/generated fields", async () => {
  const manifest = CONTENT_TABLES[1]!;
  const rows = ["a", "b", "c"].map((slug) => ({ ...portableRow(manifest, slug), id: `id-${slug}`, search_text: "generated" }));
  const calls: Array<{ url: string; init?: FetchRequest }> = [];
  const written = await upsertTableRows({
    profile: profile("target", "https://target.test"),
    manifest,
    rows,
    batchSize: 2,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse(null, { status: 201 });
    },
  });

  assert.equal(written, 3);
  assert.equal(calls.length, 2);
  assert.match(calls[0]!.url, /on_conflict=slug/);
  assert.equal(calls[0]!.init?.headers?.Prefer, "resolution=merge-duplicates,return=minimal");
  const firstPayload = JSON.parse(String(calls[0]!.init?.body)) as Array<Record<string, unknown>>;
  assert.equal(firstPayload.length, 2);
  assert.equal("id" in firstPayload[0]!, false);
  assert.equal("search_text" in firstPayload[0]!, false);
  assert.equal(firstPayload[0]!.slug, "a");
});
