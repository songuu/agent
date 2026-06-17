import assert from "node:assert/strict";
import { test } from "node:test";
import { FIXTURE_SOURCES, fixtureFetchFeed, readFixture } from "../src/fixtures.ts";
import { parseFeedString } from "../src/rss.ts";
import type { NewsSource } from "../src/types.ts";

test("parses an RSS 2.0 fixture", async () => {
  const items = await parseFeedString(readFixture("qbitai-sample.xml"));
  assert.ok(items.length >= 3, "expected >= 3 items");
  assert.ok(items[0].title.length > 0);
  assert.ok(items[0].link.startsWith("http"));
});

test("parses an Atom fixture (link href + id + summary)", async () => {
  const items = await parseFeedString(readFixture("atom-sample.xml"));
  assert.ok(items.length >= 2, "expected >= 2 entries");
  assert.ok(items[0].link.startsWith("http"));
  assert.ok(
    (items[0].contentSnippet ?? items[0].content ?? items[0].summary ?? "").length > 0,
  );
});

test("malformed feed makes parseFeedString reject", async () => {
  await assert.rejects(() => parseFeedString(readFixture("malformed.xml")));
});

test("fixtureFetchFeed never throws; unknown source → ok:false", async () => {
  const unknown: NewsSource = {
    key: "does-not-exist",
    name: "x",
    url: "fixture://x",
    kind: "en-media",
    lang: "en",
    enabled: true,
  };
  const result = await fixtureFetchFeed(unknown);
  assert.equal(result.ok, false);
  assert.equal(result.items.length, 0);
});

test("fixtureFetchFeed parses a known fixture source", async () => {
  const result = await fixtureFetchFeed(FIXTURE_SOURCES[0]);
  assert.equal(result.ok, true);
  assert.ok(result.items.length >= 3);
});
