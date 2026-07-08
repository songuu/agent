type InterviewQuestionCategory = "principle" | "engineering" | "project";

interface CodefatherUser {
  readonly userName?: unknown;
  readonly direction?: unknown;
  readonly graduationYear?: unknown;
  readonly jobStatus?: unknown;
}

interface CodefatherFaq {
  readonly question?: unknown;
  readonly answer?: unknown;
}

interface CodefatherAnswerVariant {
  readonly title: string;
  readonly answer: string;
  readonly kind: "summary" | "section" | "faq";
}

interface CodefatherContentSection {
  readonly heading: string;
  readonly body: string;
  readonly level: number;
}

export interface CodefatherPost {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly content?: unknown;
  readonly description?: unknown;
  readonly plainTextDescription?: unknown;
  readonly category?: unknown;
  readonly tags?: unknown;
  readonly faqList?: unknown;
  readonly viewNum?: unknown;
  readonly thumbNum?: unknown;
  readonly favourNum?: unknown;
  readonly commentNum?: unknown;
  readonly createTime?: unknown;
  readonly updateTime?: unknown;
  readonly user?: CodefatherUser;
}

interface CodefatherListResponse {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly data?: {
    readonly records?: unknown;
    readonly total?: unknown;
    readonly pages?: unknown;
  };
}

export interface InterviewQuestionRow {
  readonly question_id: string;
  readonly slug: string;
  readonly category: InterviewQuestionCategory;
  readonly category_label: string;
  readonly question: string;
  readonly related_chapters: readonly string[];
  readonly answer_source: string;
  readonly collected_date: string;
  readonly collected_at: string;
  readonly sort_order: number;
  readonly tags: readonly string[];
  readonly metadata: Record<string, unknown>;
}

interface FetchOptions {
  readonly limit: number;
  readonly pageSize: number;
  readonly tag: string;
  readonly fetchImpl?: typeof fetch;
}

interface UpsertOptions {
  readonly baseUrl: string;
  readonly serviceRoleKey: string;
  readonly schema: string;
  readonly batchSize?: number;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

interface ReadOptions {
  readonly baseUrl: string;
  readonly key: string;
  readonly schema: string;
  readonly fetchImpl?: typeof fetch;
}

interface DeleteOptions {
  readonly baseUrl: string;
  readonly serviceRoleKey: string;
  readonly schema: string;
  readonly fetchImpl?: typeof fetch;
}

export interface StoredCodefatherRow {
  readonly slug?: unknown;
  readonly question?: unknown;
  readonly collected_date?: unknown;
  readonly sort_order?: unknown;
  readonly metadata?: unknown;
}

interface CliOptions {
  readonly limit: number;
  readonly pageSize: number;
  readonly tag: string;
  readonly dryRun: boolean;
}

export interface CodefatherSyncOptions {
  readonly limit?: number;
  readonly pageSize?: number;
  readonly tag?: string;
  readonly dryRun?: boolean;
  readonly baseUrl?: string;
  readonly serviceRoleKey?: string;
  readonly anonKey?: string;
  readonly schema?: string;
  readonly batchSize?: number;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
  readonly now?: Date;
}

export interface CodefatherDedupeReport {
  readonly inputRows: number;
  readonly outputRows: number;
  readonly duplicateSlugCount: number;
  readonly duplicateSourceUrlCount: number;
  readonly duplicateTitleCount: number;
  readonly skippedRows: readonly string[];
}

export interface CodefatherSyncReport {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly limit: number;
  readonly pageSize: number;
  readonly tag: string;
  readonly dryRun: boolean;
  readonly fetched: number;
  readonly rowsBeforeDedupe: number;
  readonly rows: number;
  readonly duplicatesSkipped: number;
  readonly duplicateSlugCount: number;
  readonly duplicateSourceUrlCount: number;
  readonly duplicateTitleCount: number;
  readonly remoteDuplicatesDeleted: number;
  readonly sampleQuestion: string;
  readonly sampleUrl: string;
  readonly serviceCount: number | null;
  readonly anonCount: number | null;
}

const CODEFATHER_POST_LIST_ENDPOINT = "https://api.codefather.cn/api/post/list/page/vo";
const DEFAULT_LIMIT = 500;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_TAG = "面试题";
const CODEFATHER_SORT_OFFSET = 100000;
const CODEFATHER_RELATED_CHAPTER = "external-codefather";
const SUPABASE_WRITE_MAX_ATTEMPTS = 3;
const DEFAULT_UPSERT_BATCH_SIZE = 25;
const DEFAULT_UPSERT_TIMEOUT_MS = 300_000;
const RETRYABLE_HTTP_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);
const CATEGORY_LABELS: Record<InterviewQuestionCategory, string> = {
  principle: "原理类",
  engineering: "工程类",
  project: "项目深挖类",
};

const INTERVIEW_TERMS = [
  "面试",
  "面试题",
  "面经",
  "八股",
  "简历",
  "求职",
  "校招",
  "春招",
  "秋招",
  "实习",
  "offer",
  "面向问题学习",
];

export async function fetchCodefatherInterviewPosts({
  limit,
  pageSize,
  tag,
  fetchImpl = fetch,
}: FetchOptions): Promise<CodefatherPost[]> {
  const normalizedLimit = normalizePositiveInteger(limit, DEFAULT_LIMIT);
  const normalizedPageSize = Math.min(normalizePositiveInteger(pageSize, DEFAULT_PAGE_SIZE), 20);
  const records: CodefatherPost[] = [];
  const seen = new Set<string>();
  let current = 1;
  let pages: number | null = null;

  while (records.length < normalizedLimit && (pages === null || current <= pages)) {
    const requestBody = JSON.stringify({
      current,
      pageSize: normalizedPageSize,
      reviewStatus: 1,
      hiddenContent: false,
      needCursor: false,
      needFilterVipContent: true,
      tags: [tag],
      sorterList: [{ field: "createTime", asc: false }],
    });
    const response = await fetchWithRetries({
      label: `Codefather list page=${current}`,
      endpoint: CODEFATHER_POST_LIST_ENDPOINT,
      fetchImpl,
      createRequestInit: () => ({
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Content-Type": "application/json",
          Origin: "https://ai.codefather.cn",
          Referer: "https://ai.codefather.cn/essay",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        body: requestBody,
      }),
    });

    const payload = (await response.json()) as CodefatherListResponse;
    if (payload.code !== 0) {
      throw new Error(`Codefather list failed: code=${String(payload.code)} ${String(payload.message ?? "")}`);
    }

    pages = numberValue(payload.data?.pages, pages ?? current);
    const pageRecords = arrayValue<CodefatherPost>(payload.data?.records);
    if (pageRecords.length === 0) break;

    for (const record of pageRecords) {
      const id = stringValue(record.id);
      if (!id || seen.has(id)) continue;
      if (!isInterviewRelevant(record, tag)) continue;
      seen.add(id);
      records.push(record);
      if (records.length >= normalizedLimit) break;
    }

    current += 1;
  }

  return records;
}

export function toInterviewQuestionRows(
  posts: readonly CodefatherPost[],
  now = new Date(),
): InterviewQuestionRow[] {
  const collectedDate = chinaDate(now);
  const collectedAt = now.toISOString();
  return posts.map((post, index) => {
    const id = requiredString(post.id, "post.id");
    const title = firstNonEmpty(post.title, post.plainTextDescription, post.description, `Codefather 面试文章 ${id}`);
    const sourceUrl = codefatherPostUrl(post);
    const category = inferCategory(post);
    const sourceTags = stringArrayValue(post.tags);
    const faqList = faqListValue(post.faqList);
    const sourceTitles = [title];
    const contentMarkdown = normalizeContentMarkdown(firstNonEmpty(post.content, post.description, post.plainTextDescription, ""));
    const contentSections = extractContentSections(contentMarkdown);
    const summaryText = extractSummaryText(contentMarkdown, firstNonEmpty(post.plainTextDescription, post.description, title));
    const answerVariants = buildAnswerVariants({ title, summaryText, faqList, contentSections });

    return {
      question_id: `codefather-${id}`,
      slug: `codefather-interview-${id}`,
      category,
      category_label: CATEGORY_LABELS[category],
      question: title,
      related_chapters: [CODEFATHER_RELATED_CHAPTER],
      answer_source: `来源：鱼皮 AI 导航公开「${DEFAULT_TAG}」标签；原文 ${sourceUrl}`,
      collected_date: collectedDate,
      collected_at: collectedAt,
      sort_order: CODEFATHER_SORT_OFFSET + index + 1,
      tags: uniqueStrings(["codefather", DEFAULT_TAG, ...sourceTags]),
      metadata: {
        source: "codefather",
        sourceId: id,
        sourceCategory: stringValue(post.category),
        sourceTags,
        sourceTitles,
        sourceUrls: [sourceUrl],
        sourceListUrl: "https://ai.codefather.cn/essay",
        plainTextDescription: truncate(summaryText, 1200),
        contentMarkdown: truncate(contentMarkdown, 30000),
        contentSections,
        answerVariants,
        faqList,
        stats: {
          viewNum: numberValue(post.viewNum, 0),
          thumbNum: numberValue(post.thumbNum, 0),
          favourNum: numberValue(post.favourNum, 0),
          commentNum: numberValue(post.commentNum, 0),
        },
        authorSnapshot: {
          userName: stringValue(post.user?.userName),
          direction: stringValue(post.user?.direction),
          graduationYear: numberOrNull(post.user?.graduationYear),
          jobStatus: stringValue(post.user?.jobStatus),
        },
        sourceCreatedAt: timestampToIso(post.createTime),
        sourceUpdatedAt: timestampToIso(post.updateTime),
        confidence: "high",
        rationale: "来自 Codefather 公开列表 API 的面试题标签记录；标题、完整正文分段、FAQ 与原文链接一并存入 metadata，详情页可直接展示多个答案与完整解析。",
      },
    };
  });
}

export function dedupeInterviewQuestionRows(rows: readonly InterviewQuestionRow[]): {
  readonly rows: InterviewQuestionRow[];
  readonly report: CodefatherDedupeReport;
} {
  const seenSlugs = new Set<string>();
  const seenSourceUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const dedupedRows: InterviewQuestionRow[] = [];
  const skippedRows: string[] = [];
  let duplicateSlugCount = 0;
  let duplicateSourceUrlCount = 0;
  let duplicateTitleCount = 0;

  for (const row of rows) {
    const sourceUrl = firstSourceUrl(row);
    const titleKey = `${stringValue(row.metadata.source) || "codefather"}:${row.collected_date}:${normalizeText(row.question)}`;

    if (seenSlugs.has(row.slug)) {
      duplicateSlugCount += 1;
      skippedRows.push(`${row.slug}:duplicate-slug`);
      continue;
    }
    if (sourceUrl && seenSourceUrls.has(sourceUrl)) {
      duplicateSourceUrlCount += 1;
      skippedRows.push(`${row.slug}:duplicate-source-url`);
      continue;
    }
    if (titleKey && seenTitles.has(titleKey)) {
      duplicateTitleCount += 1;
      skippedRows.push(`${row.slug}:duplicate-title`);
      continue;
    }

    seenSlugs.add(row.slug);
    if (sourceUrl) seenSourceUrls.add(sourceUrl);
    if (titleKey) seenTitles.add(titleKey);
    dedupedRows.push(row);
  }

  return {
    rows: dedupedRows,
    report: {
      inputRows: rows.length,
      outputRows: dedupedRows.length,
      duplicateSlugCount,
      duplicateSourceUrlCount,
      duplicateTitleCount,
      skippedRows,
    },
  };
}

export async function upsertInterviewQuestionRows(
  rows: readonly InterviewQuestionRow[],
  { baseUrl, serviceRoleKey, schema, batchSize, timeoutMs, fetchImpl = fetch }: UpsertOptions,
): Promise<void> {
  if (rows.length === 0) return;
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/rest/v1/interview_questions?on_conflict=slug`;
  const normalizedBatchSize = normalizePositiveInteger(batchSize ?? DEFAULT_UPSERT_BATCH_SIZE, DEFAULT_UPSERT_BATCH_SIZE);
  const normalizedTimeoutMs = normalizePositiveInteger(timeoutMs ?? DEFAULT_UPSERT_TIMEOUT_MS, DEFAULT_UPSERT_TIMEOUT_MS);
  const batches = chunk(rows, normalizedBatchSize);

  for (let index = 0; index < batches.length; index += 1) {
    const payload = JSON.stringify(batches[index]);
    const label =
      batches.length === 1 ? "interview_questions upsert" : `interview_questions upsert batch=${index + 1}/${batches.length}`;

    await fetchWithRetries({
      label,
      endpoint,
      fetchImpl,
      createRequestInit: () => ({
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          "Content-Profile": schema,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: payload,
        signal: AbortSignal.timeout(normalizedTimeoutMs),
      }),
    });
  }
}

export async function readCodefatherCount({
  baseUrl,
  key,
  schema,
  fetchImpl = fetch,
}: ReadOptions): Promise<number> {
  const url = `${baseUrl.replace(/\/+$/, "")}/rest/v1/interview_questions?select=slug&slug=like.codefather-interview-*`;
  const response = await fetchImpl(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Accept-Profile": schema,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`interview_questions read failed: HTTP ${response.status} ${detail.slice(0, 300)}`);
  }
  return parseContentRangeTotal(response.headers.get("content-range"));
}

export async function readCodefatherRows({
  baseUrl,
  key,
  schema,
  fetchImpl = fetch,
}: ReadOptions): Promise<StoredCodefatherRow[]> {
  const rows: StoredCodefatherRow[] = [];
  const pageSize = 1000;
  let offset = 0;
  let total: number | null = null;

  while (total === null || offset < total) {
    const url = `${baseUrl.replace(/\/+$/, "")}/rest/v1/interview_questions?select=slug,question,collected_date,sort_order,metadata&slug=like.codefather-interview-*&order=sort_order.asc`;
    const response = await fetchImpl(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Accept-Profile": schema,
        Prefer: "count=exact",
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`interview_questions row read failed: HTTP ${response.status} ${detail.slice(0, 300)}`);
    }

    total = parseContentRangeTotal(response.headers.get("content-range"));
    const pageRows = arrayValue<StoredCodefatherRow>(await response.json());
    rows.push(...pageRows);
    if (pageRows.length === 0) break;
    offset += pageRows.length;
  }

  return rows;
}

export function findDuplicateCodefatherStoredSlugs(rows: readonly StoredCodefatherRow[]): string[] {
  const sortedRows = [...rows].sort((left, right) => {
    const leftOrder = numberValue(left.sort_order, Number.MAX_SAFE_INTEGER);
    const rightOrder = numberValue(right.sort_order, Number.MAX_SAFE_INTEGER);
    return leftOrder - rightOrder || stringValue(left.slug).localeCompare(stringValue(right.slug));
  });
  const seenSourceUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const duplicateSlugs = new Set<string>();

  for (const row of sortedRows) {
    const slug = stringValue(row.slug);
    if (!slug) continue;
    const sourceUrl = firstStoredSourceUrl(row);
    const titleKey = storedTitleKey(row);

    if (sourceUrl && seenSourceUrls.has(sourceUrl)) {
      duplicateSlugs.add(slug);
      continue;
    }
    if (titleKey && seenTitles.has(titleKey)) {
      duplicateSlugs.add(slug);
      continue;
    }

    if (sourceUrl) seenSourceUrls.add(sourceUrl);
    if (titleKey) seenTitles.add(titleKey);
  }

  return [...duplicateSlugs];
}

export async function deleteCodefatherRowsBySlug(
  slugs: readonly string[],
  { baseUrl, serviceRoleKey, schema, fetchImpl = fetch }: DeleteOptions,
): Promise<void> {
  for (const batch of chunk(slugs, 100)) {
    if (batch.length === 0) continue;
    const params = new URLSearchParams({ slug: `in.(${batch.map(quotePostgrestInValue).join(",")})` });
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/rest/v1/interview_questions?${params.toString()}`;
    const response = await fetchImpl(endpoint, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Profile": schema,
        Prefer: "return=minimal",
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`interview_questions duplicate delete failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
    }
  }
}
export async function runCodefatherInterviewSync(options: CodefatherSyncOptions = {}): Promise<CodefatherSyncReport> {
  const started = new Date();
  const limit = normalizePositiveInteger(options.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT);
  const pageSize = Math.min(normalizePositiveInteger(options.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE), 20);
  const tag = options.tag || DEFAULT_TAG;
  const dryRun = options.dryRun ?? false;
  const schema = options.schema || process.env.SUPABASE_SCHEMA || "public";
  const fetchImpl = options.fetchImpl ?? fetch;

  const fetchLimit = limit + Math.min(100, Math.max(20, Math.ceil(limit * 0.2)));
  const posts = await fetchCodefatherInterviewPosts({ limit: fetchLimit, pageSize, tag, fetchImpl });
  const rawRows = toInterviewQuestionRows(posts, options.now ?? new Date());
  const { rows: dedupedRows, report: dedupeReport } = dedupeInterviewQuestionRows(rawRows);
  const rows = dedupedRows.slice(0, limit);
  const sample = rows[0];

  if (rows.length < limit) {
    throw new Error(
      `Expected at least ${limit} unique rows, got ${rows.length}; fetched=${posts.length}; duplicatesSkipped=${dedupeReport.inputRows - dedupeReport.outputRows}`,
    );
  }

  let serviceCount: number | null = null;
  let anonCount: number | null = null;
  let remoteDuplicatesDeleted = 0;

  if (!dryRun) {
    const baseUrl = options.baseUrl || requireEnv("SUPABASE_URL");
    const serviceRoleKey = options.serviceRoleKey || requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = options.anonKey || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    await upsertInterviewQuestionRows(rows, {
      baseUrl,
      serviceRoleKey,
      schema,
      batchSize: options.batchSize,
      timeoutMs: options.timeoutMs,
      fetchImpl,
    });
    const storedRows = await readCodefatherRows({ baseUrl, key: serviceRoleKey, schema, fetchImpl });
    const duplicateSlugs = findDuplicateCodefatherStoredSlugs(storedRows);
    if (duplicateSlugs.length > 0) {
      await deleteCodefatherRowsBySlug(duplicateSlugs, { baseUrl, serviceRoleKey, schema, fetchImpl });
      remoteDuplicatesDeleted = duplicateSlugs.length;
    }
    serviceCount = await readCodefatherCount({ baseUrl, key: serviceRoleKey, schema, fetchImpl });
    anonCount = await readCodefatherCount({ baseUrl, key: anonKey, schema, fetchImpl });

    if (serviceCount < limit || anonCount < limit) {
      throw new Error(`Readback below target: service=${serviceCount}, anon=${anonCount}, target=${limit}`);
    }
  }

  const finished = new Date();
  return {
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - started.getTime(),
    limit,
    pageSize,
    tag,
    dryRun,
    fetched: posts.length,
    rowsBeforeDedupe: rawRows.length,
    rows: rows.length,
    duplicatesSkipped: dedupeReport.inputRows - dedupeReport.outputRows,
    duplicateSlugCount: dedupeReport.duplicateSlugCount,
    duplicateSourceUrlCount: dedupeReport.duplicateSourceUrlCount,
    duplicateTitleCount: dedupeReport.duplicateTitleCount,
    remoteDuplicatesDeleted,
    sampleQuestion: sample?.question ?? "<empty>",
    sampleUrl: sample ? firstSourceUrl(sample) : "",
    serviceCount,
    anonCount,
  };
}

export function formatCodefatherSyncReport(report: CodefatherSyncReport): string {
  const lines = [
    `[codefather-interview] ${report.startedAt} -> ${report.finishedAt} (${report.durationMs}ms)${report.dryRun ? " [DRY-RUN]" : ""}`,
    `  fetched=${report.fetched} rows=${report.rows} rowsBeforeDedupe=${report.rowsBeforeDedupe} target=${report.limit} pageSize=${report.pageSize} tag=${report.tag}`,
    `  dedupe skipped=${report.duplicatesSkipped} slug=${report.duplicateSlugCount} sourceUrl=${report.duplicateSourceUrlCount} title=${report.duplicateTitleCount}`,
    `  remoteDedupe deleted=${report.remoteDuplicatesDeleted}`,
    `  readback service=${report.serviceCount ?? "n/a"} anon=${report.anonCount ?? "n/a"}`,
    `  sample=${report.sampleQuestion}`,
  ];
  if (report.sampleUrl) lines.push(`  sampleUrl=${report.sampleUrl}`);
  return lines.join("\n");
}

export function formatCodefatherSyncFailure(error: unknown): string {
  if (error instanceof Error) {
    const causeText = formatErrorCause(error);
    return `[codefather-interview] run failed: ${error.message}${causeText}\n${error.stack ?? "<no stack>"}`;
  }
  return `[codefather-interview] run failed: ${String(error)}`;
}

function isInterviewRelevant(record: CodefatherPost, tag: string): boolean {
  if (stringArrayValue(record.tags).includes(tag)) return true;
  const text = [record.title, record.description, record.plainTextDescription, record.content]
    .map((value) => stringValue(value).toLowerCase())
    .join(" ");
  return INTERVIEW_TERMS.some((term) => text.includes(term.toLowerCase()));
}

function inferCategory(record: CodefatherPost): InterviewQuestionCategory {
  const text = [record.title, record.plainTextDescription, record.description, record.content]
    .map((value) => stringValue(value))
    .join(" ");
  if (/简历|求职|校招|春招|秋招|offer|实习|项目/.test(text)) return "project";
  if (/原理|底层|为什么|源码|机制/.test(text)) return "principle";
  return "engineering";
}

function codefatherPostUrl(post: CodefatherPost): string {
  const id = requiredString(post.id, "post.id");
  const category = stringValue(post.category);
  if (category === "笔记") return `https://ai.codefather.cn/note/${id}`;
  if (category === "问答") return `https://ai.codefather.cn/qa/${id}`;
  return `https://ai.codefather.cn/post/${id}`;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let limit = DEFAULT_LIMIT;
  let pageSize = DEFAULT_PAGE_SIZE;
  let tag = DEFAULT_TAG;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--limit") {
      limit = normalizePositiveInteger(Number(argv[index + 1]), DEFAULT_LIMIT);
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      limit = normalizePositiveInteger(Number(arg.slice("--limit=".length)), DEFAULT_LIMIT);
      continue;
    }
    if (arg === "--page-size") {
      pageSize = normalizePositiveInteger(Number(argv[index + 1]), DEFAULT_PAGE_SIZE);
      index += 1;
      continue;
    }
    if (arg.startsWith("--page-size=")) {
      pageSize = normalizePositiveInteger(Number(arg.slice("--page-size=".length)), DEFAULT_PAGE_SIZE);
      continue;
    }
    if (arg === "--tag") {
      tag = argv[index + 1] || DEFAULT_TAG;
      index += 1;
      continue;
    }
    if (arg.startsWith("--tag=")) {
      tag = arg.slice("--tag=".length) || DEFAULT_TAG;
    }
  }

  return { limit, pageSize, tag, dryRun };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizePositiveInteger(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requiredString(value: unknown, field: string): string {
  const result = stringValue(value);
  if (!result) throw new Error(`Missing required field: ${field}`);
  return result;
}

function firstNonEmpty(...values: readonly unknown[]): string {
  for (const value of values) {
    const text = stringValue(value);
    if (text) return text;
  }
  return "";
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function numberOrNull(value: unknown): number | null {
  const parsed = numberValue(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function faqListValue(value: unknown): Array<{ question: string; answer: string }> {
  return arrayValue<CodefatherFaq>(value)
    .map((item) => ({
      question: stringValue(item.question),
      answer: truncate(stringValue(item.answer), 2400),
    }))
    .filter((item) => item.question || item.answer)
    .slice(0, 20);
}

function normalizeContentMarkdown(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

function extractSummaryText(contentMarkdown: string, fallback: string): string {
  const cleaned = stripMarkdown(contentMarkdown);
  if (cleaned) return truncate(cleaned, 1200);
  return truncate(stripMarkdown(fallback), 1200);
}

function extractContentSections(contentMarkdown: string): CodefatherContentSection[] {
  const normalized = normalizeContentMarkdown(contentMarkdown);
  if (!normalized) return [];
  const lines = normalized.split("\n");
  const sections: CodefatherContentSection[] = [];
  let current: { heading: string; level: number; body: string[] } | null = null;

  const pushCurrent = () => {
    if (!current) return;
    const body = current.body.join("\n").trim();
    if (body) sections.push({ heading: current.heading, body: truncate(body, 8000), level: current.level });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      pushCurrent();
      current = { heading: stripMarkdown(headingMatch[2]), level: headingMatch[1].length, body: [] };
      continue;
    }
    if (!current) current = { heading: "概览", level: 2, body: [] };
    current.body.push(line);
  }

  pushCurrent();
  return sections.slice(0, 16);
}

function buildAnswerVariants(input: {
  title: string;
  summaryText: string;
  faqList: readonly { question: string; answer: string }[];
  contentSections: readonly CodefatherContentSection[];
}): CodefatherAnswerVariant[] {
  const variants: CodefatherAnswerVariant[] = [];
  const seen = new Set<string>();

  const pushVariant = (title: string, answer: string, kind: "summary" | "section" | "faq") => {
    const normalizedAnswer = normalizeText(stripMarkdown(answer));
    const normalizedTitle = normalizeText(stripMarkdown(title));
    if (!normalizedTitle || !normalizedAnswer) return;
    const key = normalizedTitle + '::' + normalizedAnswer;
    if (seen.has(key)) return;
    seen.add(key);
    variants.push({ title: normalizedTitle, answer: truncate(normalizedAnswer, 900), kind });
  };

  pushVariant("这道题怎么答", input.summaryText, "summary");
  for (const faq of input.faqList) pushVariant(faq.question, faq.answer, "faq");
  for (const section of input.contentSections) {
    if (section.heading !== "概览") pushVariant(section.heading, section.body, "section");
  }
  if (variants.length === 0 && input.contentSections[0]) pushVariant(input.title, input.contentSections[0].body, "section");
  return variants.slice(0, 10);
}

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[>*_~|]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function chinaDate(date: Date): string {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function timestampToIso(value: unknown): string | null {
  const timestamp = numberValue(value, Number.NaN);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return new Date(timestamp).toISOString();
}

function parseContentRangeTotal(value: string | null): number {
  const match = value?.match(/\/(\d+)$/);
  if (!match) throw new Error(`Missing content-range total: ${value ?? "<null>"}`);
  return Number(match[1]);
}

function firstStoredSourceUrl(row: StoredCodefatherRow): string {
  const metadata = metadataRecord(row.metadata);
  const sourceUrls = metadata.sourceUrls;
  return Array.isArray(sourceUrls) && typeof sourceUrls[0] === "string" ? sourceUrls[0].trim() : "";
}

function storedTitleKey(row: StoredCodefatherRow): string {
  const title = normalizeText(stringValue(row.question));
  if (!title) return "";
  const source = stringValue(metadataRecord(row.metadata).source) || "codefather";
  const collectedDate = stringValue(row.collected_date);
  return `${source}:${collectedDate}:${title}`;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function quotePostgrestInValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}
function firstSourceUrl(row: InterviewQuestionRow): string {
  const sourceUrls = row.metadata.sourceUrls;
  return Array.isArray(sourceUrls) && typeof sourceUrls[0] === "string" ? sourceUrls[0].trim() : "";
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

async function fetchWithRetries(input: {
  label: string;
  endpoint: string;
  fetchImpl: typeof fetch;
  createRequestInit: () => RequestInit;
}): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= SUPABASE_WRITE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await input.fetchImpl(input.endpoint, input.createRequestInit());
      if (response.ok) return response;

      const detail = (await response.text()).slice(0, 500);
      const retryable = RETRYABLE_HTTP_STATUS_CODES.has(response.status);
      if (!retryable || attempt === SUPABASE_WRITE_MAX_ATTEMPTS) {
        throw new Error(
          `${input.label} failed: HTTP ${response.status} retryable=${retryable} attempt=${attempt}/${SUPABASE_WRITE_MAX_ATTEMPTS} endpoint=${input.endpoint} detail=${detail}`,
        );
      }

      lastError = new Error(
        `${input.label} transient HTTP ${response.status} attempt=${attempt}/${SUPABASE_WRITE_MAX_ATTEMPTS} endpoint=${input.endpoint} detail=${detail}`,
      );
    } catch (error) {
      lastError = error;
      if (!isRetryableFetchError(error) || attempt === SUPABASE_WRITE_MAX_ATTEMPTS) {
        throw annotateFetchFailure(
          `${input.label} threw attempt=${attempt}/${SUPABASE_WRITE_MAX_ATTEMPTS} endpoint=${input.endpoint}`,
          error,
        );
      }
    }

    await delay(attempt * 1000);
  }

  throw annotateFetchFailure(
    `${input.label} exhausted retries attempts=${SUPABASE_WRITE_MAX_ATTEMPTS} endpoint=${input.endpoint}`,
    lastError,
  );
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  const message = error.message.toLowerCase();
  if (
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("eai_again") ||
    message.includes("enotfound") ||
    message.includes("socket") ||
    message.includes("network")
  ) {
    return true;
  }
  const causeCode = stringValue((error).cause?.code).toLowerCase();
  return ["econnreset", "etimedout", "eai_again", "enotfound", "econnrefused"].includes(causeCode);
}

function annotateFetchFailure(prefix: string, error: unknown): Error {
  const details = error instanceof Error ? `${prefix}; ${error.message}${formatErrorCause(error)}` : `${prefix}; ${String(error)}`;
  return new Error(details, error instanceof Error && "cause" in error ? { cause: error } : undefined);
}

function formatErrorCause(error: Error): string {
  const cause = (error).cause;
  if (!cause) return "";
  if (cause instanceof Error) {
    const code = stringValue(cause.code);
    return `; cause=${cause.name}:${cause.message}${code ? ` code=${code}` : ""}`;
  }
  return `; cause=${String(cause)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const report = await runCodefatherInterviewSync(options);
  console.log(formatCodefatherSyncReport(report));
}

const invokedPath = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (invokedPath.endsWith("/sync-codefather-interview-to-supabase.ts")) {
  main().catch((error: unknown) => {
    console.error(formatCodefatherSyncFailure(error));
    process.exitCode = 1;
  });
}

