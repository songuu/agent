import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_TABLES } from "./manifest.ts";
import { jsonResponse, portableRow, profile } from "./test-helpers.ts";
import { verifyTable } from "./verify.ts";

test("notion verification hashes the URL-rewritten source expectation", async () => {
  const manifest = CONTENT_TABLES.find((table) => table.table === "notion_articles")!;
  const source = profile("source", "https://source.test", { publicUrl: "https://assets.source.test" });
  const target = profile("target", "https://target.test", { publicUrl: "https://assets.target.test" });
  const sourcePrefix = "https://assets.source.test/storage/v1/object/public/notion-assets/";
  const targetPrefix = "https://assets.target.test/storage/v1/object/public/notion-assets/";
  const sourceRow = {
    ...portableRow(manifest, "page-1"),
    status: "published",
    body_markdown: `![asset](${sourcePrefix}page/a.png)`,
    cover_image_url: `${sourcePrefix}page/cover.png`,
    metadata: { assets: [{ publicUrl: `${sourcePrefix}page/a.png` }] },
  };
  const targetRow = {
    ...sourceRow,
    body_markdown: `![asset](${targetPrefix}page/a.png)`,
    cover_image_url: `${targetPrefix}page/cover.png`,
    metadata: { assets: [{ publicUrl: `${targetPrefix}page/a.png` }] },
  };
  const report = await verifyTable({
    source,
    target,
    manifest,
    sourceRows: [sourceRow],
    targetRows: [targetRow],
    fetch: async () => jsonResponse([], { headers: { "content-range": "0-0/1" } }),
  });
  assert.equal(report.serviceRoleMatch, true);
  assert.equal(report.passed, true);
});
