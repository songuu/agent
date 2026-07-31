// RSS 文章中文翻译：原文与译文分栏存储，前端只做零等待本地切换。
//
// 关键不变量：
// - title/summary/contentText 始终是来源原文，翻译绝不覆盖；
// - 正文按段落数组交给模型，并校验返回段落数，防止静默摘要或漏段；
// - 单条失败显式标记 failed 并写入 metadata，不影响同批其它文章。

import { getLLM, type ProviderName } from "../../src/shared/llm/index.ts";
import type { LLMClient, ToolSpec } from "../../src/shared/llm/types.ts";
import type { NewsItem } from "./types.ts";

export interface TranslationClient extends Pick<LLMClient, "chat"> {
  readonly provider?: string;
  readonly model?: string;
}

export interface TranslateOptions {
  readonly maxItems?: number;
  readonly model?: string;
  readonly provider?: ProviderName;
  readonly concurrency?: number;
  readonly timeoutMs?: number;
  readonly maxAttempts?: number;
  readonly client?: TranslationClient;
  readonly env?: NodeJS.ProcessEnv;
  readonly now?: Date;
}

interface TranslationResponse {
  readonly titleZh: string;
  readonly summaryZh: string;
  readonly contentParagraphsZh: readonly string[];
}

function readProviderFromEnv(): ProviderName {
  const provider = process.env.LLM_PROVIDER;
  if (provider === "openai" || provider === "ollama" || provider === "anthropic") {
    return provider;
  }
  return "anthropic";
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

export function translationAvailable(
  provider: ProviderName = readProviderFromEnv(),
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  switch (provider) {
    case "anthropic":
      return hasValue(env.ANTHROPIC_API_KEY);
    case "openai":
      return hasValue(env.OPENAI_API_KEY);
    case "ollama":
      return true;
  }
}

export function splitSourceParagraphs(text: string): string[] {
  const normalized = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

const TRANSLATION_TOOL: ToolSpec = {
  name: "emit_translation",
  description: "返回完整的简体中文标题、摘要与逐段正文译文。",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      titleZh: { type: "string" },
      summaryZh: { type: "string" },
      contentParagraphsZh: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["titleZh", "summaryZh", "contentParagraphsZh"],
  },
};

function buildPrompt(
  item: NewsItem,
  contentParagraphs: readonly string[],
  previousFailure?: { readonly error: string; readonly responseText: string },
): string {
  const payload = {
    title: item.title,
    summary: item.summary,
    contentParagraphs,
  };
  const instructions = [
    "你是专业的英中科技文章翻译。把下面 JSON 中的英文完整翻译为简体中文。",
    "必须忠实翻译，不得摘要、扩写、删减、合并或拆分段落。",
    "术语、产品名、模型名、代码、URL 和数字要保持准确；中文表达自然但不改变事实与语气。",
    "返回严格 JSON，字段固定为 titleZh、summaryZh、contentParagraphsZh。",
    "contentParagraphsZh 必须与 contentParagraphs 数量和顺序完全一致。",
    "若支持工具调用，必须调用 emit_translation；否则只输出严格 JSON，不要 Markdown 代码围栏或解释。",
    "返回内容必须以 { 开始、以 } 结束；不要道歉、解释或自然语言前后缀。",
  ];

  if (previousFailure) {
    instructions.push(
      "",
      `上一次响应未通过校验：${previousFailure.error}`,
      `上一次响应片段：${previousFailure.responseText || "<empty>"}`,
      "请修正格式并只返回一个 JSON object，必须以 { 开始、以 } 结束。",
    );
  }

  return [...instructions, "", JSON.stringify(payload)].join("\n");
}

function parseResponse(text: string, expectedParagraphCount: number): TranslationResponse {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("translation response did not contain a JSON object");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch (error) {
    throw new Error(
      `translation response contained invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("translation response JSON was not an object");
  }

  const record = parsed as Record<string, unknown>;
  const titleZh = cleanString(record.titleZh);
  const summaryZh = cleanString(record.summaryZh);
  const rawParagraphs = record.contentParagraphsZh;
  if (!Array.isArray(rawParagraphs) || rawParagraphs.some((value) => typeof value !== "string")) {
    throw new Error("translation response contentParagraphsZh was not a string array");
  }
  const contentParagraphsZh = rawParagraphs.map((value) => cleanString(value));
  if (contentParagraphsZh.some((value) => !value)) {
    throw new Error("translation response contained an empty translated paragraph");
  }
  if (contentParagraphsZh.length !== expectedParagraphCount) {
    throw new Error(
      `translation paragraph count mismatch: expected=${expectedParagraphCount} actual=${contentParagraphsZh.length}`,
    );
  }
  if (!titleZh) throw new Error("translation response titleZh was empty");

  return { titleZh, summaryZh, contentParagraphsZh };
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/[ \t]+/g, " ").trim() : "";
}

function translationMetadata(
  item: NewsItem,
  options: {
    readonly provider: string;
    readonly model: string | null;
    readonly attemptedAt: string;
    readonly error: string | null;
    readonly attempts: number;
  },
): Readonly<Record<string, unknown>> {
  return {
    ...item.metadata,
    translation: {
      sourceLanguage: item.lang,
      targetLanguage: "zh",
      provider: options.provider,
      model: options.model,
      attemptedAt: options.attemptedAt,
      attempts: options.attempts,
      error: options.error,
    },
  };
}

async function translateOne(
  client: TranslationClient,
  item: NewsItem,
  options: {
    readonly provider: string;
    readonly model: string | null;
    readonly attemptedAt: string;
    readonly timeoutMs: number;
    readonly maxAttempts: number;
  },
): Promise<NewsItem> {
  const sourceParagraphs = splitSourceParagraphs(item.contentText);
  let detail = "translation failed";
  let previousFailure: { error: string; responseText: string } | undefined;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    let responseText = "";
    try {
      const response = await client.chat({
        maxTokens: 4_096,
        temperature: 0,
        signal: AbortSignal.timeout(options.timeoutMs),
        tools: [TRANSLATION_TOOL],
        messages: [{ role: "user", content: buildPrompt(item, sourceParagraphs, previousFailure) }],
      });
      const toolCall = response.toolCalls.find((call) => call.name === TRANSLATION_TOOL.name);
      responseText = toolCall ? JSON.stringify(toolCall.arguments) : response.text;
      const translated = parseResponse(responseText, sourceParagraphs.length);
      return {
        ...item,
        titleZh: translated.titleZh,
        summaryZh: translated.summaryZh,
        contentTextZh: translated.contentParagraphsZh.join("\n\n"),
        translationStatus: "translated",
        translatedAt: options.attemptedAt,
        metadata: translationMetadata(item, { ...options, attempts: attempt, error: null }),
      };
    } catch (error) {
      detail = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      previousFailure = {
        error: detail,
        responseText: responseText.replace(/\s+/g, " ").trim().slice(0, 500),
      };
    }
  }
  return {
    ...item,
    titleZh: "",
    summaryZh: "",
    contentTextZh: "",
    translationStatus: "failed",
    translatedAt: options.attemptedAt,
    metadata: translationMetadata(item, { ...options, attempts: options.maxAttempts, error: detail }),
  };
}

async function mapIndexesWithConcurrency(
  indexes: readonly number[],
  limit: number,
  worker: (index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, indexes.length) }, async () => {
    while (cursor < indexes.length) {
      const index = indexes[cursor++];
      if (index === undefined) continue;
      await worker(index);
    }
  });
  await Promise.all(runners);
}

/**
 * 只翻译前 maxItems 条英文资讯；中文源显式标记 skipped。
 * 没有凭据或 maxItems<=0 时完全不改输入，便于安全灰度开启。
 */
export async function translateItems(
  items: readonly NewsItem[],
  options: TranslateOptions = {},
): Promise<NewsItem[]> {
  const maxItems = options.maxItems ?? 0;
  const provider = options.provider ?? readProviderFromEnv();
  const env = options.env ?? process.env;
  if (maxItems <= 0) return [...items];
  if (!options.client && !translationAvailable(provider, env)) return [...items];

  const client = options.client ?? getLLM(provider, { model: options.model });
  const attemptedAt = (options.now ?? new Date()).toISOString();
  const providerName = client.provider ?? provider;
  const modelName = client.model ?? options.model ?? null;
  const output = items.map((item) =>
    item.lang === "zh"
      ? {
          ...item,
          translationStatus: "skipped" as const,
          translatedAt: attemptedAt,
          metadata: translationMetadata(item, {
            provider: providerName,
            model: modelName,
            attemptedAt,
            error: null,
            attempts: 0,
          }),
        }
      : item,
  );
  const candidateIndexes = output
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.lang === "en" && splitSourceParagraphs(item.contentText).length > 0)
    .slice(0, maxItems)
    .map(({ index }) => index);

  await mapIndexesWithConcurrency(candidateIndexes, Math.max(1, options.concurrency ?? 2), async (index) => {
    const item = output[index];
    if (!item) return;
    output[index] = await translateOne(client, item, {
      provider: providerName,
      model: modelName,
      attemptedAt,
      timeoutMs: Math.max(1, options.timeoutMs ?? 120_000),
      maxAttempts: Math.max(1, Math.floor(options.maxAttempts ?? 2)),
    });
  });
  return output;
}
