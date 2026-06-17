// 图片重托管：把 Notion 临时 S3 图片落到 Supabase Storage public bucket，回写稳定 URL。
//
// - external 类型图片是永久 URL，直接透传不动。
// - file 类型是 ~1h 过期的临时 URL：下载 → 上传 Storage → 用 public URL 替换。
// - 幂等：按 blockId+srcHash 命中既有 manifest 则跳过上传（见 asset-manifest.ts）。
// - 故障隔离：单图上传失败回退 public/ 目录（若提供 fallback），绝不把会过期的 URL 写进库。

import type { AssetEntry, AssetManifest } from "./asset-manifest.ts";
import { srcHashOf, storageKeyFor } from "./asset-manifest.ts";
import type { NotionImageTransformer } from "./convert.ts";

export interface ImageInput {
  readonly blockId: string;
  readonly type: "external" | "file";
  readonly url: string;
}

export interface DownloadedImage {
  // <ArrayBuffer> 收紧：下游 fetch BodyInit / Blob 需要 ArrayBuffer-backed（TS5.7 泛型化）。
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly contentType: string;
}

export interface RehostDeps {
  readonly pageId: string;
  /** 既有 manifest（上次同步留下），命中 srcHash 即复用、跳过上传。 */
  readonly existing: AssetManifest;
  readonly download: (url: string) => Promise<DownloadedImage>;
  /** 上传成功返回 public URL。 */
  readonly upload: (key: string, image: DownloadedImage) => Promise<string>;
  /** 可选 public/ 退化：上传失败时写静态目录，返回站点绝对路径。 */
  readonly fallback?: (key: string, image: DownloadedImage) => Promise<string>;
}

export type RehostAction = "external" | "reused" | "uploaded" | "fallback";

export interface RehostResult {
  /** markdown 用的最终 URL（稳定，永不过期）。 */
  readonly url: string;
  /** 新建/复用的 manifest 条目（external 透传时无）。 */
  readonly entry?: AssetEntry;
  readonly action: RehostAction;
}

/** 单图重托管（纯逻辑，IO 全注入，便于离线测）。 */
export async function rehostImage(
  input: ImageInput,
  deps: RehostDeps,
): Promise<RehostResult> {
  if (input.type === "external") {
    return { url: input.url, action: "external" };
  }

  const srcHash = srcHashOf(input.url);
  const existing = deps.existing[input.blockId];
  if (existing && existing.srcHash === srcHash) {
    // 同一底层图片（querystring 变化不影响 srcHash），复用已上传对象，不重传。
    return { url: existing.publicUrl, entry: existing, action: "reused" };
  }

  const key = storageKeyFor(deps.pageId, input.blockId, input.url);
  const image = await deps.download(input.url);

  try {
    const publicUrl = await deps.upload(key, image);
    const entry: AssetEntry = { blockId: input.blockId, storageKey: key, publicUrl, srcHash };
    return { url: publicUrl, entry, action: "uploaded" };
  } catch (error: unknown) {
    if (deps.fallback) {
      const url = await deps.fallback(key, image);
      const entry: AssetEntry = { blockId: input.blockId, storageKey: key, publicUrl: url, srcHash };
      return { url, entry, action: "fallback" };
    }
    throw error;
  }
}

interface NotionImageBlockLike {
  readonly id?: unknown;
  readonly type?: unknown;
  readonly image?: {
    readonly type?: unknown;
    readonly external?: { readonly url?: unknown };
    readonly file?: { readonly url?: unknown };
    readonly caption?: ReadonlyArray<{ readonly plain_text?: unknown }>;
  };
}

/** 从 notion-to-md 传入的 block 安全窄化出图片输入与 caption。 */
function asImageInput(
  block: unknown,
): { readonly input: ImageInput; readonly caption: string } | null {
  const candidate = block as NotionImageBlockLike;
  if (!candidate || candidate.type !== "image" || typeof candidate.id !== "string") {
    return null;
  }
  const image = candidate.image;
  if (!image) return null;

  const caption = Array.isArray(image.caption)
    ? image.caption
        .map((item) => (typeof item.plain_text === "string" ? item.plain_text : ""))
        .join("")
        .trim()
    : "";

  if (image.type === "external" && typeof image.external?.url === "string") {
    return { input: { blockId: candidate.id, type: "external", url: image.external.url }, caption };
  }
  if (image.type === "file" && typeof image.file?.url === "string") {
    return { input: { blockId: candidate.id, type: "file", url: image.file.url }, caption };
  }
  return null;
}

function markdownImage(caption: string, url: string): string {
  return `![${caption}](${url})`;
}

export interface ImageTransformerContext {
  readonly pageId: string;
  readonly existing: AssetManifest;
  readonly download: RehostDeps["download"];
  readonly upload: RehostDeps["upload"];
  readonly fallback?: RehostDeps["fallback"];
  /** 转换过程中收集的新/复用 manifest 条目（按 blockId），同步完成后写回 metadata.assets。 */
  readonly collected: Record<string, AssetEntry>;
}

/**
 * 构造 notion-to-md 的图片 transformer：重托管图片并回写稳定 URL，
 * 把 manifest 条目收集进 ctx.collected。返回 false 时回退默认渲染（不应发生于受支持图片）。
 */
export function createImageTransformer(
  ctx: ImageTransformerContext,
): NotionImageTransformer {
  return async (block: unknown): Promise<string | false> => {
    const parsed = asImageInput(block);
    if (!parsed) return false;

    const result = await rehostImage(parsed.input, {
      pageId: ctx.pageId,
      existing: ctx.existing,
      download: ctx.download,
      upload: ctx.upload,
      fallback: ctx.fallback,
    });
    if (result.entry) ctx.collected[result.entry.blockId] = result.entry;
    return markdownImage(parsed.caption, result.url);
  };
}
