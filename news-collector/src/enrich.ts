// 可选的 LLM 富化：用仓库统一 LLM 配置把摘要重写成 1 句中文 + 校正体系层。
//
// 优雅降级是硬约束：所选 provider 无 key 时原样返回规则结果，整条管道照常离线跑；
// 即便配了 key，也需 enrichMax > 0 显式开启，避免默认烧 token。任一条富化失败都保留规则结果，
// 不让单条 LLM 错误影响整批。

import { getLLM, type ProviderName } from "../../src/shared/llm/index.ts";
import type { LLMClient } from "../../src/shared/llm/types.ts";
import type { EcosystemLayer, NewsItem } from "./types.ts";
import { ECOSYSTEM_LAYERS, LAYER_LABELS } from "./types.ts";

export interface EnrichOptions {
  readonly maxItems?: number;
  readonly model?: string;
  readonly provider?: ProviderName;
  readonly concurrency?: number;
  readonly client?: Pick<LLMClient, "chat">;
  readonly env?: NodeJS.ProcessEnv;
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

export function enrichmentAvailable(
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

function isEcosystemLayer(value: unknown): value is EcosystemLayer {
  return (
    typeof value === "string" &&
    (ECOSYSTEM_LAYERS as readonly string[]).includes(value)
  );
}

function buildPrompt(item: NewsItem): string {
  return [
    "你是 AI 资讯编辑。基于下面这条资讯，输出严格 JSON：",
    '{"summary": "一句话中文摘要(<=60字, 客观, 不夸张)", "layer": "<体系层 key>"}',
    "",
    `体系层候选: ${ECOSYSTEM_LAYERS.join(", ")}`,
    `标题: ${item.title}`,
    `原摘要: ${item.summary || "(无)"}`,
    `来源: ${item.sourceName}`,
    "",
    "只输出 JSON，不要解释。",
  ].join("\n");
}

function parseEnrichResponse(text: string): { summary?: string; layer?: EcosystemLayer } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const summary =
      typeof record.summary === "string" ? record.summary.trim() : undefined;
    const layer = isEcosystemLayer(record.layer) ? record.layer : undefined;
    return { summary, layer };
  } catch {
    return {};
  }
}

async function enrichOne(
  client: Pick<LLMClient, "chat">,
  item: NewsItem,
): Promise<NewsItem> {
  try {
    const message = await client.chat({
      maxTokens: 200,
      messages: [{ role: "user", content: buildPrompt(item) }],
    });
    const { summary, layer } = parseEnrichResponse(message.text);
    if (!summary && !layer) return item;
    return {
      ...item,
      summary: summary ?? item.summary,
      ecosystemLayer: layer ?? item.ecosystemLayer,
      ecosystemLayerLabel: layer ? LAYER_LABELS[layer] : item.ecosystemLayerLabel,
      enriched: true,
    };
  } catch {
    // 单条失败：保留规则结果，不影响整批。
    return item;
  }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (!item) continue;
      results[index] = await worker(item, index);
    }
  });
  await Promise.all(runners);
  return results;
}

/** 富化前 maxItems 条；无 key 或 maxItems<=0 时原样返回（降级）。 */
export async function enrichItems(
  items: readonly NewsItem[],
  options: EnrichOptions = {},
): Promise<NewsItem[]> {
  const maxItems = options.maxItems ?? 0;
  const provider = options.provider ?? readProviderFromEnv();
  const env = options.env ?? process.env;
  if (maxItems <= 0) return [...items];
  if (!options.client && !enrichmentAvailable(provider, env)) return [...items];

  const client = options.client ?? getLLM(provider, { model: options.model });
  const concurrency = options.concurrency ?? 3;

  const head = items.slice(0, maxItems);
  const tail = items.slice(maxItems);
  const enrichedHead = await mapWithConcurrency(head, concurrency, (item) =>
    enrichOne(client, item),
  );
  return [...enrichedHead, ...tail];
}
