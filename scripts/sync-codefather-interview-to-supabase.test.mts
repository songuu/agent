import assert from "node:assert/strict";
import test from "node:test";
import {
  dedupeInterviewQuestionRows,
  deleteCodefatherRowsBySlug,
  fetchCodefatherInterviewPosts,
  findDuplicateCodefatherStoredSlugs,
  formatCodefatherSyncFailure,
  readCodefatherCount,
  runCodefatherInterviewSync,
  toInterviewQuestionRows,
  upsertInterviewQuestionRows,
  type CodefatherPost,
} from "./sync-codefather-interview-to-supabase.ts";
import ecosystemConfig from "./codefather-interview-ecosystem.config.cjs";

function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
}

test("fetchCodefatherInterviewPosts paginates and keeps interview records", async () => {
  const calls: unknown[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return jsonResponse({
      code: 0,
      data: {
        pages: "2",
        records:
          calls.length === 1
            ? [
                { id: "1", title: "Java 面试题", tags: ["面试题"] },
                { id: "2", title: "普通分享", tags: ["闲聊"] },
              ]
            : [{ id: "3", title: "简历优化", tags: ["简历"] }],
      },
      message: "ok",
    });
  };

  const posts = await fetchCodefatherInterviewPosts({
    limit: 2,
    pageSize: 2,
    tag: "面试题",
    fetchImpl,
  });

  assert.equal(posts.length, 2);
  assert.deepEqual(posts.map((post) => post.id), ["1", "3"]);
  assert.equal(calls.length, 2);
});

test("fetchCodefatherInterviewPosts retries transient HTTP 524", async () => {
  let attempts = 0;
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((callback, _delay, ...args) => {
    if (typeof callback === "function") callback(...args);
    return 0 as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  try {
    const fetchImpl: typeof fetch = async () => {
      attempts += 1;
      if (attempts < 3) {
        return new Response("", { status: 524 });
      }
      return jsonResponse({
        code: 0,
        data: { pages: "1", records: [{ id: "1", title: "Java 面试题", tags: ["面试题"] }] },
        message: "ok",
      });
    };

    const posts = await fetchCodefatherInterviewPosts({ limit: 1, pageSize: 20, tag: "面试题", fetchImpl });
    assert.equal(posts.length, 1);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }

  assert.equal(attempts, 3);
});

test("codefather interview ecosystem config uses safer upsert defaults", () => {
  const app = ecosystemConfig.apps[0];

  assert.equal(app.env.CODEFATHER_INTERVIEW_UPSERT_BATCH_SIZE, "25");
  assert.equal(app.env.CODEFATHER_INTERVIEW_UPSERT_TIMEOUT_MS, "300000");
});

test("toInterviewQuestionRows maps Codefather posts to interview_questions rows", () => {
  const posts: CodefatherPost[] = [
    {
      id: "207",
      title: "大模型面试高频题：上下文快满了怎么办",
      category: "文章",
      tags: ["面试题", "AI"],
      plainTextDescription: "讲滑动窗口和摘要压缩。",
      faqList: [{ question: "上下文快满了怎么办？", answer: "压缩、检索、丢弃低价值历史。" }],
      viewNum: 12,
      createTime: 1782748333000,
      user: { userName: "tester", direction: "Java后端", graduationYear: 2026 },
    },
  ];

  const [row] = toInterviewQuestionRows(posts, new Date("2026-06-30T03:00:00.000Z"));

  assert.equal(row.slug, "codefather-interview-207");
  assert.equal(row.question_id, "codefather-207");
  assert.equal(row.category, "engineering");
  assert.equal(row.collected_date, "2026-06-30");
  assert.deepEqual(row.related_chapters, ["external-codefather"]);
  assert.ok(row.tags.includes("codefather"));
  assert.ok(row.tags.includes("面试题"));
  assert.deepEqual(row.metadata.sourceUrls, ["https://ai.codefather.cn/post/207"]);
  assert.equal((row.metadata.faqList as Array<{ question: string }>)[0].question, "上下文快满了怎么办？");
  assert.ok(Array.isArray(row.metadata.answerVariants));
  assert.ok(Array.isArray(row.metadata.contentSections));
  assert.equal((row.metadata.answerVariants as Array<{ title: string }>)[0]?.title, "这道题怎么答");
  assert.equal((row.metadata.contentSections as Array<{ heading: string }>)[0]?.heading, "概览");
});

test("dedupeInterviewQuestionRows skips duplicate slug, source URL, and same-day title", () => {
  const rows = toInterviewQuestionRows(
    [
      { id: "1", title: "Java 面试题", tags: ["面试题"] },
      { id: "1", title: "Java 面试题", tags: ["面试题"] },
      { id: "2", title: "不同标题", category: "文章", tags: ["面试题"] },
      { id: "3", title: "Java 面试题", category: "文章", tags: ["面试题"] },
    ],
    new Date("2026-06-30T03:00:00.000Z"),
  );
  rows[2].metadata.sourceUrls = ["https://ai.codefather.cn/post/1"];

  const result = dedupeInterviewQuestionRows(rows);

  assert.deepEqual(result.rows.map((row) => row.slug), ["codefather-interview-1"]);
  assert.equal(result.report.duplicateSlugCount, 1);
  assert.equal(result.report.duplicateSourceUrlCount, 1);
  assert.equal(result.report.duplicateTitleCount, 1);
});

test("upsertInterviewQuestionRows sends PostgREST merge-upsert request", async () => {
  const rows = toInterviewQuestionRows([{ id: "1", title: "面试题", tags: ["面试题"] }]);
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(null, { status: 201 });
  };

  await upsertInterviewQuestionRows(rows, {
    baseUrl: "https://supabase.test/",
    serviceRoleKey: "service-key",
    schema: "public",
    fetchImpl,
  });

  assert.equal(requests[0].url, "https://supabase.test/rest/v1/interview_questions?on_conflict=slug");
  assert.equal(
    (requests[0].init.headers as Record<string, string>).Prefer,
    "resolution=merge-duplicates,return=minimal",
  );
  assert.match(String(requests[0].init.body), /codefather-interview-1/);
});

test("upsertInterviewQuestionRows splits large payloads into batches", async () => {
  const rows = toInterviewQuestionRows(
    [
      { id: "1", title: "题 1", tags: ["面试题"] },
      { id: "2", title: "题 2", tags: ["面试题"] },
      { id: "3", title: "题 3", tags: ["面试题"] },
    ],
    new Date("2026-06-30T03:00:00.000Z"),
  );
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(null, { status: 201 });
  };

  await upsertInterviewQuestionRows(rows, {
    baseUrl: "https://supabase.test/",
    serviceRoleKey: "service-key",
    schema: "public",
    batchSize: 2,
    timeoutMs: 12345,
    fetchImpl,
  });

  assert.equal(requests.length, 2);
  assert.match(String(requests[0].init.body), /codefather-interview-1/);
  assert.match(String(requests[0].init.body), /codefather-interview-2/);
  assert.doesNotMatch(String(requests[0].init.body), /codefather-interview-3/);
  assert.match(String(requests[1].init.body), /codefather-interview-3/);
  assert.equal(requests[0].init.signal instanceof AbortSignal, true);
});

test("upsertInterviewQuestionRows uses safer default batch size", async () => {
  const rows = toInterviewQuestionRows(
    Array.from({ length: 26 }, (_value, index) => ({
      id: String(index + 1),
      title: `题 ${index + 1}`,
      tags: ["面试题"],
    })),
    new Date("2026-06-30T03:00:00.000Z"),
  );
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(null, { status: 201 });
  };

  await upsertInterviewQuestionRows(rows, {
    baseUrl: "https://supabase.test/",
    serviceRoleKey: "service-key",
    schema: "public",
    fetchImpl,
  });

  assert.equal(requests.length, 2);
  assert.match(String(requests[0].init.body), /codefather-interview-25/);
  assert.doesNotMatch(String(requests[0].init.body), /codefather-interview-26/);
  assert.match(String(requests[1].init.body), /codefather-interview-26/);
});
test("upsertInterviewQuestionRows retries transient fetch failures", async () => {
  const rows = toInterviewQuestionRows([{ id: "1", title: "面试题", tags: ["面试题"] }]);
  let attempts = 0;
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((callback, _delay, ...args) => {
    if (typeof callback === "function") callback(...args);
    return 0 as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  try {
    const fetchImpl: typeof fetch = async () => {
      attempts += 1;
      if (attempts < 3) {
        const error = new TypeError("fetch failed");
        Object.defineProperty(error, "cause", {
          value: Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
        });
        throw error;
      }
      return new Response(null, { status: 201 });
    };

    await upsertInterviewQuestionRows(rows, {
      baseUrl: "https://supabase.test/",
      serviceRoleKey: "service-key",
      schema: "public",
      fetchImpl,
    });
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }

  assert.equal(attempts, 3);
});

test("formatCodefatherSyncFailure includes nested cause details", () => {
  const cause = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
  const error = new Error("interview_questions upsert threw attempt=3/3 endpoint=https://supabase.test", { cause });

  const text = formatCodefatherSyncFailure(error);

  assert.match(text, /cause=Error:socket hang up code=ECONNRESET/);
});

test("readCodefatherCount parses content-range totals", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response("[]", {
      status: 200,
      headers: { "content-range": "0-0/503" },
    });

  const count = await readCodefatherCount({
    baseUrl: "https://supabase.test",
    key: "anon",
    schema: "public",
    fetchImpl,
  });

  assert.equal(count, 503);
});

test("runCodefatherInterviewSync writes unique rows and returns service/anon readback", async () => {
  const requests: Array<{ url: string; method: string }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = String(url);
    requests.push({ url: requestUrl, method: init?.method ?? "GET" });
    if (requestUrl.includes("api.codefather.cn")) {
      return jsonResponse({
        code: 0,
        data: {
          pages: "1",
          records: [{ id: "1", title: "Java 面试题", tags: ["面试题"] }],
        },
        message: "ok",
      });
    }
    if (requestUrl.includes("on_conflict=slug")) {
      return new Response(null, { status: 201 });
    }
    return new Response("[]", {
      status: 206,
      headers: { "content-range": "0-0/501" },
    });
  };

  const report = await runCodefatherInterviewSync({
    limit: 1,
    pageSize: 20,
    baseUrl: "https://supabase.test",
    serviceRoleKey: "service-key",
    anonKey: "anon-key",
    schema: "public",
    fetchImpl,
    now: new Date("2026-06-30T03:00:00.000Z"),
  });

  assert.equal(report.fetched, 1);
  assert.equal(report.rows, 1);
  assert.equal(report.duplicatesSkipped, 0);
  assert.equal(report.serviceCount, 501);
  assert.equal(report.anonCount, 501);
  assert.equal(report.remoteDuplicatesDeleted, 0);
  assert.equal(requests.filter((request) => request.url.includes("select=slug")).length, 3);
});
test("findDuplicateCodefatherStoredSlugs and deleteCodefatherRowsBySlug clean remote duplicates", async () => {
  const duplicates = findDuplicateCodefatherStoredSlugs([
    {
      slug: "codefather-interview-1",
      question: "同标题",
      collected_date: "2026-06-30",
      sort_order: 1,
      metadata: { source: "codefather", sourceUrls: ["https://ai.codefather.cn/post/1"] },
    },
    {
      slug: "codefather-interview-2",
      question: "不同标题",
      collected_date: "2026-06-30",
      sort_order: 2,
      metadata: { source: "codefather", sourceUrls: ["https://ai.codefather.cn/post/1"] },
    },
    {
      slug: "codefather-interview-3",
      question: "同标题",
      collected_date: "2026-06-30",
      sort_order: 3,
      metadata: { source: "codefather", sourceUrls: ["https://ai.codefather.cn/post/3"] },
    },
  ]);
  assert.deepEqual(duplicates, ["codefather-interview-2", "codefather-interview-3"]);

  const requests: Array<{ url: string; method: string }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), method: init?.method ?? "GET" });
    return new Response(null, { status: 204 });
  };

  await deleteCodefatherRowsBySlug(duplicates, {
    baseUrl: "https://supabase.test",
    serviceRoleKey: "service-key",
    schema: "public",
    fetchImpl,
  });

  assert.equal(requests[0].method, "DELETE");
  assert.match(decodeURIComponent(requests[0].url), /slug=in\.\("codefather-interview-2","codefather-interview-3"\)/);
});

