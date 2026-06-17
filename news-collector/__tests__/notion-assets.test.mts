import assert from "node:assert/strict";
import { test } from "node:test";
import { createImageTransformer, rehostImage, type DownloadedImage } from "../src/notion/assets.ts";
import { srcHashOf } from "../src/notion/asset-manifest.ts";

const IMG: DownloadedImage = { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" };

function deps(overrides: Record<string, unknown> = {}) {
  return {
    pageId: "pg",
    existing: {},
    download: async () => IMG,
    upload: async (key: string) => `https://store.example.com/${key}`,
    ...overrides,
  };
}

test("external image passes through untouched, no upload", async () => {
  let uploaded = false;
  const result = await rehostImage(
    { blockId: "b1", type: "external", url: "https://cdn.example.com/x.png" },
    deps({ upload: async () => { uploaded = true; return "x"; } }) as never,
  );
  assert.equal(result.action, "external");
  assert.equal(result.url, "https://cdn.example.com/x.png");
  assert.equal(uploaded, false);
});

test("file image uploads once with stable key, returns public url", async () => {
  const result = await rehostImage(
    { blockId: "b1", type: "file", url: "https://notion.s3/img.png?sig=A" },
    deps() as never,
  );
  assert.equal(result.action, "uploaded");
  assert.match(result.url, /store\.example\.com\/pg\/b1-/);
  assert.equal(result.entry?.srcHash, srcHashOf("https://notion.s3/img.png?sig=A"));
});

test("manifest hit (same srcHash) reuses, skips download+upload", async () => {
  let touched = false;
  const srcHash = srcHashOf("https://notion.s3/img.png?sig=OLD");
  const result = await rehostImage(
    { blockId: "b1", type: "file", url: "https://notion.s3/img.png?sig=NEW" },
    deps({
      existing: { b1: { blockId: "b1", storageKey: "pg/b1-x.png", publicUrl: "https://store/keep.png", srcHash } },
      download: async () => { touched = true; return IMG; },
      upload: async () => { touched = true; return "x"; },
    }) as never,
  );
  // querystring 变化不改 srcHash → 命中复用，不重传。
  assert.equal(result.action, "reused");
  assert.equal(result.url, "https://store/keep.png");
  assert.equal(touched, false);
});

test("upload failure falls back to public/ dir, never throws an expiring url", async () => {
  const result = await rehostImage(
    { blockId: "b1", type: "file", url: "https://notion.s3/img.png?sig=A" },
    deps({
      upload: async () => { throw new Error("storage down"); },
      fallback: async (key: string) => `/notion-assets/${key}`,
    }) as never,
  );
  assert.equal(result.action, "fallback");
  assert.match(result.url, /^\/notion-assets\/pg\/b1-/);
});

test("image transformer emits markdown + collects manifest entry", async () => {
  const collected: Record<string, never> = {};
  const transformer = createImageTransformer(deps({ collected }) as never);
  const block = {
    type: "image",
    id: "b9",
    image: { type: "file", file: { url: "https://notion.s3/p.png?sig=A" }, caption: [{ plain_text: "图说" }] },
  };
  const md = await transformer(block);
  assert.match(md as string, /^!\[图说\]\(https:\/\/store\.example\.com\/pg\/b9-/);
  assert.ok((collected as Record<string, unknown>).b9);
});

test("transformer returns false for non-image blocks", async () => {
  const transformer = createImageTransformer(deps({ collected: {} }) as never);
  assert.equal(await transformer({ type: "paragraph", id: "p1" }), false);
});
