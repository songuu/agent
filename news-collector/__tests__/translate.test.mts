import assert from "node:assert/strict";
import { test } from "node:test";
import {
  translateItems,
  translationAvailable,
} from "../src/translate.ts";
import type { NewsItem } from "../src/types.ts";

const FIXED_NOW = new Date("2026-07-30T08:00:00.000Z");

function newsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    externalId: "translation-test-001",
    sourceKey: "test",
    sourceName: "Test Feed",
    sourceKind: "en-media",
    title: "Agents can automate engineering work",
    url: "https://example.com/agents",
    summary: "A study compares engineering execution with open-ended research.",
    contentText: "First original paragraph.\n\nSecond original paragraph.",
    contentExcerpt: "First original paragraph.",
    contentStatus: "fetched",
    contentFetchedAt: FIXED_NOW.toISOString(),
    titleZh: "",
    summaryZh: "",
    contentTextZh: "",
    translationStatus: "not_requested",
    translatedAt: null,
    ecosystemLayer: "evaluation",
    ecosystemLayerLabel: "评测与基准",
    tags: ["Agent"],
    lang: "en",
    publishedAt: "2026-07-30T07:00:00.000Z",
    publishedDate: "2026-07-30",
    collectedAt: FIXED_NOW.toISOString(),
    collectedDate: "2026-07-30",
    enriched: false,
    metadata: {},
    ...overrides,
  };
}

test("selected provider credentials control translation availability", () => {
  assert.equal(translationAvailable("anthropic", { ANTHROPIC_API_KEY: "" }), false);
  assert.equal(
    translationAvailable("anthropic", { ANTHROPIC_API_KEY: "test-anthropic-key" }),
    true,
  );
  assert.equal(translationAvailable("openai", { OPENAI_API_KEY: "" }), false);
  assert.equal(translationAvailable("openai", { OPENAI_API_KEY: "test-openai-key" }), true);
  assert.equal(translationAvailable("ollama", {}), true);
});

test("translateItems stores a paragraph-faithful Chinese version without replacing the original", async () => {
  const original = newsItem();
  const [translated] = await translateItems([original], {
    maxItems: 1,
    provider: "openai",
    model: "test-model",
    now: FIXED_NOW,
    client: {
      provider: "openai",
      model: "test-model",
      async chat(options) {
        assert.match(options.messages[0]?.content ?? "", /First original paragraph/);
        return {
          text: JSON.stringify({
            titleZh: "智能体可以自动化工程工作",
            summaryZh: "一项研究比较了工程执行与开放式研究。",
            contentParagraphsZh: ["第一段中文译文。", "第二段中文译文。"],
          }),
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 120, outputTokens: 80 },
        };
      },
    },
  });

  assert.equal(translated.title, original.title);
  assert.equal(translated.contentText, original.contentText);
  assert.equal(translated.titleZh, "智能体可以自动化工程工作");
  assert.equal(translated.summaryZh, "一项研究比较了工程执行与开放式研究。");
  assert.equal(translated.contentTextZh, "第一段中文译文。\n\n第二段中文译文。");
  assert.equal(translated.translationStatus, "translated");
  assert.equal(translated.translatedAt, FIXED_NOW.toISOString());
  assert.deepEqual(translated.metadata.translation, {
    sourceLanguage: "en",
    targetLanguage: "zh",
    provider: "openai",
    model: "test-model",
    attemptedAt: FIXED_NOW.toISOString(),
    attempts: 1,
    error: null,
  });
});

test("Chinese source items are explicitly skipped without calling the model", async () => {
  let calls = 0;
  const [skipped] = await translateItems([newsItem({ lang: "zh" })], {
    maxItems: 1,
    now: FIXED_NOW,
    client: {
      async chat() {
        calls += 1;
        throw new Error("should not be called");
      },
    },
  });

  assert.equal(calls, 0);
  assert.equal(skipped.translationStatus, "skipped");
  assert.equal(skipped.translatedAt, FIXED_NOW.toISOString());
  assert.equal(skipped.titleZh, "");
  assert.equal(skipped.contentTextZh, "");
});

test("a response that drops a source paragraph is marked failed and never shown as translated", async () => {
  const [failed] = await translateItems([newsItem()], {
    maxItems: 1,
    now: FIXED_NOW,
    client: {
      async chat() {
        return {
          text: JSON.stringify({
            titleZh: "标题译文",
            summaryZh: "摘要译文",
            contentParagraphsZh: ["只返回了一段。"],
          }),
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 100, outputTokens: 20 },
        };
      },
    },
  });

  assert.equal(failed.translationStatus, "failed");
  assert.equal(failed.titleZh, "");
  assert.equal(failed.summaryZh, "");
  assert.equal(failed.contentTextZh, "");
  assert.match(
    String((failed.metadata.translation as Record<string, unknown>).error),
    /paragraph count mismatch/,
  );
});

test("missing provider credentials leave items not requested instead of reporting a false failure", async () => {
  const original = newsItem();
  const [unchanged] = await translateItems([original], {
    maxItems: 1,
    provider: "openai",
    env: { OPENAI_API_KEY: "" },
  });

  assert.deepEqual(unchanged, original);
});

test("English items without an extracted body stay original and do not consume translation tokens", async () => {
  const original = newsItem({ contentText: "", contentStatus: "empty" });
  let calls = 0;
  const [unchanged] = await translateItems([original], {
    maxItems: 1,
    client: {
      async chat() {
        calls += 1;
        throw new Error("should not be called");
      },
    },
  });

  assert.equal(calls, 0);
  assert.equal(unchanged.translationStatus, "not_requested");
  assert.equal(unchanged.translatedAt, null);
  assert.deepEqual(unchanged, original);
});

test("each model call receives a bounded abort signal", async () => {
  let receivedSignal: AbortSignal | undefined;
  const [translated] = await translateItems([newsItem()], {
    maxItems: 1,
    timeoutMs: 50,
    client: {
      async chat(options) {
        receivedSignal = options.signal;
        return {
          text: JSON.stringify({
            titleZh: "有界翻译",
            summaryZh: "模型调用带有超时信号。",
            contentParagraphsZh: ["第一段。", "第二段。"],
          }),
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 10, outputTokens: 10 },
        };
      },
    },
  });

  assert.equal(receivedSignal instanceof AbortSignal, true);
  assert.equal(receivedSignal?.aborted, false);
  assert.equal(translated.translationStatus, "translated");
});

test("structured tool output is preferred over the text JSON fallback", async () => {
  const [translated] = await translateItems([newsItem()], {
    maxItems: 1,
    maxAttempts: 1,
    client: {
      async chat(options) {
        assert.equal(options.tools?.[0]?.name, "emit_translation");
        return {
          text: "not-json",
          toolCalls: [
            {
              id: "call-1",
              name: "emit_translation",
              arguments: {
                titleZh: "工具标题",
                summaryZh: "工具摘要",
                contentParagraphsZh: ["第一段。", "第二段。"],
              },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 10, outputTokens: 10 },
        };
      },
    },
  });

  assert.equal(translated.translationStatus, "translated");
  assert.equal(translated.titleZh, "工具标题");
  assert.equal(translated.summaryZh, "工具摘要");
  assert.equal(translated.contentTextZh, "第一段。\n\n第二段。");
  assert.equal(
    (translated.metadata.translation as Record<string, unknown>).attempts,
    1,
  );
});

test("a transient invalid JSON response is retried once and records the successful attempt", async () => {
  let calls = 0;
  const [translated] = await translateItems([newsItem()], {
    maxItems: 1,
    maxAttempts: 2,
    client: {
      async chat() {
        calls += 1;
        if (calls === 1) {
          return {
            text: '{"titleZh":"截断',
            toolCalls: [],
            stopReason: "length",
            usage: { inputTokens: 10, outputTokens: 10 },
          };
        }
        return {
          text: JSON.stringify({
            titleZh: "重试成功",
            summaryZh: "第二次返回了完整 JSON。",
            contentParagraphsZh: ["第一段。", "第二段。"],
          }),
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 10, outputTokens: 20 },
        };
      },
    },
  });

  assert.equal(calls, 2);
  assert.equal(translated.translationStatus, "translated");
  assert.equal(translated.titleZh, "重试成功");
  assert.equal((translated.metadata.translation as Record<string, unknown>).attempts, 2);
});

test("a non JSON response is retried with repair context", async () => {
  const prompts: string[] = [];
  let calls = 0;
  const [translated] = await translateItems([newsItem()], {
    maxItems: 1,
    maxAttempts: 2,
    client: {
      async chat(options) {
        calls += 1;
        prompts.push(options.messages[0]?.content ?? "");
        if (calls === 1) {
          return {
            text: "I cannot provide a strict JSON translation for this request.",
            toolCalls: [],
            stopReason: "stop",
            usage: { inputTokens: 10, outputTokens: 10 },
          };
        }
        return {
          text: JSON.stringify({
            titleZh: "修复提示成功",
            summaryZh: "第二次严格返回 JSON。",
            contentParagraphsZh: ["第一段。", "第二段。"],
          }),
          toolCalls: [],
          stopReason: "stop",
          usage: { inputTokens: 10, outputTokens: 20 },
        };
      },
    },
  });

  assert.equal(calls, 2);
  assert.equal(translated.translationStatus, "translated");
  assert.match(prompts[1] ?? "", /上一次响应未通过校验/);
  assert.match(prompts[1] ?? "", /did not contain a JSON object/);
  assert.match(prompts[1] ?? "", /I cannot provide a strict JSON translation/);
});
