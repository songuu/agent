// 可选的 LLM 富化：用 Claude 把摘要重写成 1 句中文 + 校正体系层。
//
// 优雅降级是硬约束：无 ANTHROPIC_API_KEY 时原样返回规则结果，整条管道照常离线跑；
// 即便配了 key，也需 enrichMax > 0 显式开启，避免默认烧 token。任一条富化失败都保留规则结果，
// 不让单条 LLM 错误影响整批。

import Anthropic from "@anthropic-ai/sdk";
import type { EcosystemLayer, NewsItem } from "./types.ts";
import { ECOSYSTEM_LAYERS, LAYER_LABELS } from "./types.ts";

export interface EnrichOptions {
  readonly maxItems?: number;
  readonly model?: string;
  readonly concurrency?: number;
  readonly client?: Anthropic;
}

export function enrichmentAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

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
  client: Anthropic,
  item: NewsItem,
  model: string,
): Promise<NewsItem> {
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(item) }],
    });
    // 结构化收窄：discriminated union 上 type==='text' 即收窄到含 .text 的块，
    // 不必引用 Anthropic.TextBlock（规避 namespace 重导出差异）。
    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
    const { summary, layer } = parseEnrichResponse(text);
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
      results[index] = await worker(items[index], index);
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
  if (maxItems <= 0 || !enrichmentAvailable()) return [...items];

  const client = options.client ?? new Anthropic();
  const model = options.model ?? DEFAULT_MODEL;
  const concurrency = options.concurrency ?? 3;

  const head = items.slice(0, maxItems);
  const tail = items.slice(maxItems);
  const enrichedHead = await mapWithConcurrency(head, concurrency, (item) =>
    enrichOne(client, item, model),
  );
  return [...enrichedHead, ...tail];
}
