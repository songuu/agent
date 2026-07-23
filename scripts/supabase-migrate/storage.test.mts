import assert from "node:assert/strict";
import test from "node:test";

import { copyNotionAssets, rewriteNotionArticleStorageUrls } from "./storage.ts";
import { binaryResponse, jsonResponse, profile } from "./test-helpers.ts";
import type { FetchRequest, Row } from "./types.ts";

test("recursively copies a public notion-assets bucket and creates a missing target bucket", async () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test", { publicUrl: "https://public.target.test" });
  const uploads: Array<{ path: string; init?: FetchRequest }> = [];
  const result = await copyNotionAssets({
    source,
    target,
    fetch: async (url, init) => {
      const parsed = new URL(url);
      const path = parsed.pathname;
      if (parsed.origin === source.url && path === "/storage/v1/bucket/notion-assets") {
        return jsonResponse({ id: "notion-assets", public: true });
      }
      if (parsed.origin === target.url && path === "/storage/v1/bucket/notion-assets" && init?.method === "GET") {
        return jsonResponse({}, { status: 404 });
      }
      if (parsed.origin === target.url && path === "/storage/v1/bucket" && init?.method === "POST") {
        assert.deepEqual(JSON.parse(String(init.body)), { id: "notion-assets", name: "notion-assets", public: true });
        return jsonResponse({ id: "notion-assets", public: true }, { status: 200 });
      }
      if (parsed.origin === source.url && path === "/storage/v1/object/list/notion-assets") {
        const body = JSON.parse(String(init?.body)) as { prefix: string };
        if (body.prefix === "") {
          return jsonResponse([
            { name: "pg", id: null },
            { name: "root.png", id: "root-id", metadata: { mimetype: "image/png" } },
          ]);
        }
        if (body.prefix === "pg") {
          return jsonResponse([{ name: "child.webp", id: "child-id", metadata: { mimetype: "image/webp" } }]);
        }
      }
      if (parsed.origin === source.url && path.startsWith("/storage/v1/object/notion-assets/")) {
        return binaryResponse("asset-bytes");
      }
      if (parsed.origin === target.url && path.startsWith("/storage/v1/object/notion-assets/")) {
        uploads.push({ path, init });
        return jsonResponse({ Key: path }, { status: 200 });
      }
      throw new Error(`Unexpected storage request: ${init?.method} ${url}`);
    },
  });

  assert.deepEqual(result, { bucket: "notion-assets", sourcePublic: true, targetCreated: true, copiedObjects: 2 });
  assert.deepEqual(uploads.map((upload) => upload.path).sort(), [
    "/storage/v1/object/notion-assets/pg/child.webp",
    "/storage/v1/object/notion-assets/root.png",
  ]);
  assert.ok(uploads.every((upload) => upload.init?.headers?.["x-upsert"] === "true"));
});

test("reports a missing source bucket before attempting target writes", async () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test");
  let targetTouched = false;
  await assert.rejects(
    () =>
      copyNotionAssets({
        source,
        target,
        fetch: async (url) => {
          if (url.startsWith(target.url)) targetTouched = true;
          return jsonResponse({}, { status: 404 });
        },
      }),
    /Source Storage bucket notion-assets does not exist/,
  );
  assert.equal(targetTouched, false);
});

test("rewrites only source public notion-assets URLs in body, cover, and nested metadata", () => {
  const source = profile("source", "https://source.test");
  const target = profile("target", "https://target.test", { publicUrl: "https://public.target.test" });
  const sourcePrefix = "https://source.test/storage/v1/object/public/notion-assets/";
  const targetPrefix = "https://public.target.test/storage/v1/object/public/notion-assets/";
  const row: Row = {
    body_markdown: `![asset](${sourcePrefix}pg/a.png)`,
    cover_image_url: `${sourcePrefix}cover.png?download=1`,
    metadata: {
      assets: [{ publicUrl: `${sourcePrefix}pg/a.png` }],
      nested: { url: `${sourcePrefix}pg/b.png` },
      otherBucket: "https://source.test/storage/v1/object/public/other/a.png",
      similarHost: "https://source.test.example/storage/v1/object/public/notion-assets/a.png",
    },
  };
  const rewritten = rewriteNotionArticleStorageUrls(row, source, target);
  assert.match(String(rewritten.body_markdown), new RegExp(`^!\\[asset\\]\\(${targetPrefix.replace(/[.?]/g, "\\$&")}`));
  assert.equal(rewritten.cover_image_url, `${targetPrefix}cover.png?download=1`);
  const metadata = rewritten.metadata as { assets: Array<{ publicUrl: string }>; nested: { url: string }; otherBucket: string; similarHost: string };
  assert.equal(metadata.assets[0]!.publicUrl, `${targetPrefix}pg/a.png`);
  assert.equal(metadata.nested.url, `${targetPrefix}pg/b.png`);
  assert.equal(metadata.otherBucket, "https://source.test/storage/v1/object/public/other/a.png");
  assert.equal(metadata.similarHost, "https://source.test.example/storage/v1/object/public/notion-assets/a.png");
});
