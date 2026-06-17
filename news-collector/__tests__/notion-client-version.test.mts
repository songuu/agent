import assert from "node:assert/strict";
import { test } from "node:test";
import { NOTION_API_VERSION } from "../src/notion/client.ts";

// 载荷性 pin：改动会让 notion-to-md 3.1.9 的 databases.query 失效（见 client.ts WHY）。
test("Notion client is pinned to the 2022-06-28 API contract", () => {
  assert.equal(NOTION_API_VERSION, "2022-06-28");
});
