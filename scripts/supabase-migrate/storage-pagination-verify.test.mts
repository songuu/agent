import assert from "node:assert/strict";
import test from "node:test";

import {
  listStorageObjects,
  rewriteStoragePublicUrl,
  verifyNotionAssets,
} from "./storage.ts";
import { jsonResponse, profile } from "./test-helpers.ts";

test("Storage listing advances offset until every page is exhausted", async () => {
  const source = profile("source", "https://source.test");
  const offsets: number[] = [];
  const objects = await listStorageObjects({
    profile: source,
    pageSize: 1,
    fetch: async (_url, init) => {
      const request = JSON.parse(String(init?.body)) as { prefix: string; offset: number };
      assert.equal(request.prefix, "");
      offsets.push(request.offset);
      if (request.offset === 0) return jsonResponse([{ name: "a.png", id: "a", metadata: { mimetype: "image/png" } }]);
      if (request.offset === 1) return jsonResponse([{ name: "b.png", id: "b", metadata: { mimetype: "image/png" } }]);
      if (request.offset === 2) return jsonResponse([]);
      throw new Error(`Unexpected offset ${request.offset}`);
    },
  });
  assert.deepEqual(offsets, [0, 1, 2]);
  assert.deepEqual(objects.map((object) => object.path), ["a.png", "b.png"]);
});

test("rewrite recognizes only exact source service and browser public prefixes", () => {
  const source = profile("source", "https://source.internal.test", { publicUrl: "https://assets.source.test" });
  const target = profile("target", "https://target.internal.test", { publicUrl: "https://assets.target.test" });
  const sourceService = "https://source.internal.test/storage/v1/object/public/notion-assets/a.png";
  const sourceBrowser = "https://assets.source.test/storage/v1/object/public/notion-assets/b.png";
  const similar = "https://assets.source.test.example/storage/v1/object/public/notion-assets/c.png";
  const rewritten = rewriteStoragePublicUrl(`${sourceService}|${sourceBrowser}|${similar}`, source, target);
  assert.equal(
    rewritten,
    "https://assets.target.test/storage/v1/object/public/notion-assets/a.png|https://assets.target.test/storage/v1/object/public/notion-assets/b.png|https://assets.source.test.example/storage/v1/object/public/notion-assets/c.png",
  );
});

test("Storage verification compares the full object-key set with a stable hash", async () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test");
  const fetch = async (url: string) => {
    const origin = new URL(url).origin;
    return jsonResponse(
      origin === source.url
        ? [{ name: "a.png", id: "a", metadata: {} }]
        : origin === target.url
          ? [{ name: "a.png", id: "a", metadata: {} }]
          : [],
    );
  };
  const report = await verifyNotionAssets({ source, target, fetch, pageSize: 10 });
  // The fixture's folder has no children, so the recursively visited key set is stable on both sides.
  assert.equal(report.sourceCount, 1);
  assert.equal(report.targetCount, 1);
  assert.equal(report.sourcePathHash, report.targetPathHash);
  assert.equal(report.passed, true);
});
