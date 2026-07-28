import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentAssetRequestError,
  contentAssetPublicUrl,
  parseContentAssetRequest,
} from "./assets.ts";

test("parses a nested public asset key without allowing a second bucket", () => {
  assert.deepEqual(
    parseContentAssetRequest(new URL("https://content.test/api/content/v1/assets/notion-assets/page-1/image%20one.svg")),
    { bucket: "notion-assets", objectKey: "page-1/image one.svg" },
  );
});

test("rejects traversal, encoded separators, and non-public buckets", () => {
  for (const path of [
    "/api/content/v1/assets/notion-assets/../secret.png",
    "/api/content/v1/assets/notion-assets/%2Fsecret.png",
    "/api/content/v1/assets/other-bucket/a.png",
  ]) {
    assert.throws(
      () => parseContentAssetRequest(new URL(`https://content.test${path}`)),
      ContentAssetRequestError,
    );
  }
});

test("generates a same-origin, segment-encoded durable asset URL", () => {
  assert.equal(
    contentAssetPublicUrl("/agent-build/api/content/v1/assets/", "notion-assets", "page/a b.svg"),
    "/agent-build/api/content/v1/assets/notion-assets/page/a%20b.svg",
  );
  assert.throws(
    () => contentAssetPublicUrl("https://cdn.example/assets", "notion-assets", "a.png"),
    /same-origin/,
  );
});
