import assert from "node:assert/strict";
import test from "node:test";

import { toContentTableSqlValues } from "../src/data/content-mapping.ts";
import { getContentTableContract } from "../src/data/content-table-contracts.ts";

test("generic PostgreSQL roundtrip normalizes driver Date values for date columns", () => {
  const contract = getContentTableContract("news_items");
  const row = Object.fromEntries(contract.columns.map((column) => [column, "value"]));
  Object.assign(row, {
    content_fetched_at: null,
    tags: ["postgres"],
    translated_at: null,
    published_at: null,
    published_date: new Date("2026-07-24T00:00:00.000Z"),
    collected_at: new Date("2026-07-24T01:02:03.456Z"),
    collected_date: new Date("2026-07-24T00:00:00.000Z"),
    enriched: false,
    metadata: { source: "roundtrip" },
  });

  const values = toContentTableSqlValues(contract, row);

  assert.equal(values[21], "2026-07-24");
  assert.equal(values[22], "2026-07-24 01:02:03.456");
  assert.equal(values[23], "2026-07-24");
});
