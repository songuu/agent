/**
 * Public binary assets are deliberately restricted to the single migrated
 * Notion bucket. This keeps the Content API from turning into a generic
 * database file browser while preserving the former public Storage contract.
 */
export const PUBLIC_ASSET_BUCKET = "notion-assets";
export const CONTENT_ASSET_PATH_PREFIX = "/api/content/v1/assets/";
export const PUBLIC_ASSET_CONTENT_TYPES = [
  "image/png", "image/svg+xml", "image/jpeg", "image/gif", "image/webp", "image/avif",
] as const;
export type PublicAssetContentType = (typeof PUBLIC_ASSET_CONTENT_TYPES)[number];

export function isPublicAssetContentType(value: unknown): value is PublicAssetContentType {
  return typeof value === "string" && (PUBLIC_ASSET_CONTENT_TYPES as readonly string[]).includes(value);
}

export interface ContentAssetRequest {
  readonly bucket: typeof PUBLIC_ASSET_BUCKET;
  readonly objectKey: string;
}

export interface ContentAsset {
  readonly contentType: PublicAssetContentType;
  readonly bytes: Uint8Array;
}

export interface ContentAssetReadRepository {
  readAsset(request: ContentAssetRequest): Promise<ContentAsset | null>;
}

/**
 * Returns null when the request is for regular JSON content. Invalid asset
 * URLs throw so callers do not collapse malformed paths into a cached 404.
 */
export function parseContentAssetRequest(url: URL): ContentAssetRequest | null {
  if (!url.pathname.startsWith(CONTENT_ASSET_PATH_PREFIX)) return null;

  const rawPath = url.pathname.slice(CONTENT_ASSET_PATH_PREFIX.length);
  const rawSegments = rawPath.split("/");
  if (rawSegments.length < 2 || rawSegments[0] !== PUBLIC_ASSET_BUCKET) {
    throw new ContentAssetRequestError("unknown_asset");
  }

  const objectKey = rawSegments.slice(1).map(decodePathSegment).join("/");
  if (!objectKey) throw new ContentAssetRequestError("invalid_asset_path");
  return { bucket: PUBLIC_ASSET_BUCKET, objectKey };
}

/** Use this same encoder when generating durable markdown URLs for a new upload. */
export function contentAssetPublicUrl(
  baseUrl: string,
  bucket: typeof PUBLIC_ASSET_BUCKET,
  objectKey: string,
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  if (!normalizedBase.startsWith("/") || normalizedBase.startsWith("//") || /[?#]/.test(normalizedBase)) {
    throw new Error("Content asset public base URL must be a same-origin absolute path.");
  }
  const encodedKey = objectKey.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${normalizedBase}/${encodeURIComponent(bucket)}/${encodedKey}`;
}

function decodePathSegment(raw: string): string {
  if (!raw) throw new ContentAssetRequestError("invalid_asset_path");
  let segment: string;
  try {
    segment = decodeURIComponent(raw);
  } catch {
    throw new ContentAssetRequestError("invalid_asset_path");
  }
  if (
    !segment ||
    segment === "." ||
    segment === ".." ||
    segment.includes("/") ||
    segment.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(segment)
  ) {
    throw new ContentAssetRequestError("invalid_asset_path");
  }
  return segment;
}

export class ContentAssetRequestError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
