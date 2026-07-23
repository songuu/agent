import { tableManifest } from "../supabase-migrate/manifest.ts";

export type ContentResource = "news" | "frontier" | "interviews" | "notion" | "glossary";
export type ContentFilterOperator = "eq";
export type ContentSortDirection = "asc" | "desc";

export interface ContentFilter {
  readonly field: string;
  readonly operator: ContentFilterOperator;
  readonly value: string;
}

export interface ContentSort {
  readonly field: string;
  readonly direction: ContentSortDirection;
}

export interface ContentReadRequest {
  readonly resource: ContentResource;
  readonly fields: readonly string[];
  readonly filters: readonly ContentFilter[];
  readonly sort: readonly ContentSort[];
  readonly limit: number;
  readonly offset: number;
  readonly includeTotal: boolean;
}

export interface ContentPage {
  readonly items: readonly Record<string, unknown>[];
  readonly totalCount: number | null;
  readonly hasMore: boolean;
}

export interface ContentReadRepository {
  read(request: ContentReadRequest): Promise<ContentPage>;
}

export const CONTENT_RESOURCE_TABLES: Readonly<Record<ContentResource, string>> = {
  news: "news_items",
  frontier: "frontier_ecosystem_articles",
  interviews: "interview_questions",
  notion: "notion_articles",
  glossary: "glossary_terms",
};

const MAX_PAGE_SIZE = 1_000;
const MAX_OFFSET = 100_000;

export function contentTable(resource: ContentResource): string {
  return CONTENT_RESOURCE_TABLES[resource];
}

export function contentFields(resource: ContentResource): readonly string[] {
  return tableManifest(contentTable(resource)).copyFields;
}

export function parseContentReadRequest(url: URL): ContentReadRequest {
  const supportedParameters = new Set(["fields", "filter", "sort", "limit", "offset", "count"]);
  for (const key of url.searchParams.keys()) {
    if (!supportedParameters.has(key)) {
      throw new ContentRequestError("unknown_parameter", `Unsupported query parameter: ${key}`);
    }
  }
  const resource = parseResource(url.pathname);
  const allowedFields = new Set(contentFields(resource));
  const fields = parseFields(url.searchParams.get("fields"), allowedFields);
  const requestedFilters = url.searchParams.getAll("filter").map((value) => parseFilter(value, allowedFields));
  const filters = enforcePublicReadPolicy(resource, requestedFilters);
  const sort = url.searchParams.getAll("sort").map((value) => parseSort(value, allowedFields));

  return {
    resource,
    fields,
    filters,
    sort,
    limit: parseBoundedInteger(url.searchParams.get("limit"), 100, 1, MAX_PAGE_SIZE, "limit"),
    offset: parseBoundedInteger(url.searchParams.get("offset"), 0, 0, MAX_OFFSET, "offset"),
    includeTotal: url.searchParams.get("count") !== "none",
  };
}

function parseResource(pathname: string): ContentResource {
  const resource = pathname.split("/").filter(Boolean).at(-1);
  if (resource && Object.hasOwn(CONTENT_RESOURCE_TABLES, resource)) {
    return resource as ContentResource;
  }
  throw new ContentRequestError("unknown_resource", "Unsupported content resource.");
}

/**
 * Supabase previously enforced published-only Notion access through RLS. The
 * Content API uses a server credential, so that policy has to move here and
 * remain true for every future provider.
 */
function enforcePublicReadPolicy(
  resource: ContentResource,
  requestedFilters: readonly ContentFilter[],
): readonly ContentFilter[] {
  if (resource !== "notion") return requestedFilters;

  const statusFilters = requestedFilters.filter((filter) => filter.field === "status");
  if (statusFilters.some((filter) => filter.value !== "published")) {
    throw new ContentRequestError("forbidden_filter", "Notion public reads only allow status=published.");
  }
  return statusFilters.length > 0
    ? requestedFilters
    : [...requestedFilters, { field: "status", operator: "eq", value: "published" }];
}
function parseFields(value: string | null, allowedFields: ReadonlySet<string>): readonly string[] {
  if (!value) throw new ContentRequestError("missing_fields", "fields is required.");
  const fields = value.split(",").map((field) => field.trim()).filter(Boolean);
  if (fields.length === 0) throw new ContentRequestError("missing_fields", "fields is required.");
  if (new Set(fields).size !== fields.length) {
    throw new ContentRequestError("duplicate_field", "fields must not contain duplicates.");
  }
  for (const field of fields) assertAllowedField(field, allowedFields);
  return fields;
}

function parseFilter(value: string, allowedFields: ReadonlySet<string>): ContentFilter {
  const [field, operator, ...parts] = value.split(":");
  const filterValue = parts.join(":");
  if (!field || operator !== "eq" || !filterValue) {
    throw new ContentRequestError("invalid_filter", "filter must be field:eq:value.");
  }
  assertAllowedField(field, allowedFields);
  return { field, operator: "eq", value: filterValue };
}

function parseSort(value: string, allowedFields: ReadonlySet<string>): ContentSort {
  const [field, direction] = value.split(":");
  if (!field || (direction !== "asc" && direction !== "desc")) {
    throw new ContentRequestError("invalid_sort", "sort must be field:asc or field:desc.");
  }
  assertAllowedField(field, allowedFields);
  return { field, direction };
}

function assertAllowedField(field: string, allowedFields: ReadonlySet<string>): void {
  if (!allowedFields.has(field)) {
    throw new ContentRequestError("unsupported_field", `Unsupported field: ${field}`);
  }
}

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  field: string,
): number {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new ContentRequestError("invalid_pagination", `${field} must be an integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ContentRequestError("invalid_pagination", `${field} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export class ContentRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

