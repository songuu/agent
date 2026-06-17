// 图片重托管的真实 IO 绑定：下载、上传 Storage、public/ 退化。
//
// assets.ts 的 rehostImage 把这些当注入参数（便于离线测）；这里提供生产实现。

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import type { DownloadedImage } from "./assets.ts";
import { uploadObject, type StorageConfig } from "./storage.ts";

const EXT_CONTENT_TYPE: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

function guessContentType(url: string): string {
  const ext = extname(url.split("?")[0] ?? url).toLowerCase();
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
}

/** 下载图片字节 + content-type（优先响应头，回退扩展名推断）。 */
export async function downloadImage(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DownloadedImage> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`download image failed: HTTP ${response.status} ${url.slice(0, 120)}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? guessContentType(url);
  return { bytes, contentType };
}

/** 绑定一个上传到指定 bucket 的 upload 函数。 */
export function createStorageUpload(
  config: StorageConfig,
  bucket: string,
  fetchImpl: typeof fetch = fetch,
): (key: string, image: DownloadedImage) => Promise<string> {
  return (key, image) => uploadObject(config, bucket, key, image.bytes, image.contentType, fetchImpl);
}

/**
 * public/ 退化：上传失败时把图片写进 VitePress 静态目录，返回站点绝对路径。
 * basePath 必须是站点 base（VITEPRESS_BASE 归一后，形如 "/" 或 "/sub/"），否则非根部署下图片 404。
 * 注意：静态目录只在站点 rebuild 后才生效——退化路径接受这一耦合（见 sprint Plan 集成路径表）。
 */
export function createPublicDirFallback(
  publicDir: string,
  basePath = "/",
): (key: string, image: DownloadedImage) => Promise<string> {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return async (key, image) => {
    const filePath = join(publicDir, "notion-assets", key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, image.bytes);
    return `${base}notion-assets/${key}`;
  };
}
