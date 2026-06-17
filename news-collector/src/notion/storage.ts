// Supabase Storage REST（service_role，仅 Node 侧）：建 public bucket + 上传对象 + 取公开 URL。
//
// 沿用仓库"裸 fetch + service_role"约定（见 ../store.ts / scripts/push-*），不引入 @supabase/storage-js。
// public bucket 的对象任何人可匿名 GET、永不过期，正好用来托管 Notion 那些 1 小时过期的临时图片 URL。
// 安全不变量：service_role 只在此（Node 同步路径）使用，前端 bundle 只见到最终的 public URL 字符串。

import type { SupabaseConfig } from "../config.ts";

export interface StorageConfig {
  readonly url: string;
  readonly serviceRoleKey: string;
}

export function storageConfigFrom(supabase: SupabaseConfig): StorageConfig {
  return { url: supabase.url, serviceRoleKey: supabase.serviceRoleKey };
}

function authHeaders(config: StorageConfig): Record<string, string> {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
  };
}

function baseUrl(config: StorageConfig): string {
  return config.url.replace(/\/+$/, "");
}

/** 对象 key 按路径段编码，保留分隔的斜杠。 */
function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

/** 建 public bucket；已存在（409 / already exists）视为成功，幂等。 */
export async function ensureBucket(
  config: StorageConfig,
  bucket: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(`${baseUrl(config)}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  if (response.ok || response.status === 409) return;
  const detail = await response.text();
  if (/already exists/i.test(detail)) return;
  throw new Error(
    `ensureBucket(${bucket}) failed: HTTP ${response.status} ${detail.slice(0, 300)}`,
  );
}

/** 公开读取 URL（不过期、无需鉴权）。 */
export function publicUrl(
  config: StorageConfig,
  bucket: string,
  key: string,
): string {
  return `${baseUrl(config)}/storage/v1/object/public/${bucket}/${encodeKey(key)}`;
}

/** 上传对象（x-upsert：同 key 覆盖而非重复），返回 public URL。 */
export async function uploadObject(
  config: StorageConfig,
  bucket: string,
  key: string,
  // <ArrayBuffer> 收紧：TS5.7 下默认 Uint8Array<ArrayBufferLike> 不匹配 fetch BodyInit。
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(
    `${baseUrl(config)}/storage/v1/object/${bucket}/${encodeKey(key)}`,
    {
      method: "POST",
      headers: {
        ...authHeaders(config),
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: bytes,
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `uploadObject(${bucket}/${key}) failed: HTTP ${response.status} ${detail.slice(0, 300)}`,
    );
  }
  return publicUrl(config, bucket, key);
}
