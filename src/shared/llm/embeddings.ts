/**
 * 文本向量化（embedding）与余弦相似度。供"向量检索 / RAG"章节与毕业项目使用。
 *
 * WHY: Anthropic 官方不提供 embedding 模型（推荐配合 Voyage AI）。为降低初学者门槛，
 * 默认走 OpenAI-compatible embeddings endpoint。换厂商在此集中处理。
 */
import OpenAI from "openai";
import { getEnv } from "../util/env";
import { createOpenAICompatibleClient } from "./openaiCompatible";
import { loadEmbeddingFixture, lookupInFixture } from "./embeddingFixture";

let cachedClient: OpenAI | null = null;

function client(): OpenAI {
  if (!cachedClient) cachedClient = createOpenAICompatibleClient();
  return cachedClient;
}

function embeddingModel(): string {
  return getEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")!;
}

/**
 * 直连真 API 算 embedding（绕过离线 fixture）。供 fixture 生成脚本与 embed() 补缺口复用。
 * 缺 OPENAI_API_KEY 时在 client() 里快速失败并给出配置指引。
 */
export async function embedViaApi(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await client().embeddings.create({ model: embeddingModel(), input: texts });
  return res.data.map((d) => d.embedding);
}

/**
 * 把一批文本转成向量，**离线优先**：
 *  1. 先查预计算的真向量 fixture（src/shared/rag/fixtures/embeddings.json）——命中即离线返回真向量；
 *  2. 有未覆盖文本且配了 OPENAI_API_KEY → 仅为缺口文本联网补齐（命中 fixture 的不重复付费）；
 *  3. 有未覆盖文本但没 key → 抛出可操作错误，指引去配 key 或跑 `npm run rag:build-fixture`。
 *
 * @returns 与输入等长的向量数组，每个向量是 number[]。
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = embeddingModel();

  const { vectors, missing } = lookupInFixture(loadEmbeddingFixture(), model, texts);
  if (missing.length === 0) {
    return vectors as number[][];
  }

  const hasKey = (getEnv("OPENAI_API_KEY") ?? "").trim() !== "";
  if (!hasKey) {
    const sample = JSON.stringify(missing[0]?.slice(0, 40) ?? "");
    throw new Error(
      [
        `离线 embedding fixture 未覆盖 ${missing.length} 条文本，且未配置 OPENAI_API_KEY。`,
        "两种解法任选其一：",
        "  1) 在 .env 配置 OPENAI_API_KEY 后直接联网；",
        "  2) 配好 key 跑一次 `npm run rag:build-fixture`，把这些文本预计算进 fixture，之后即可全离线。",
        `未覆盖示例：${sample}…`,
      ].join("\n"),
    );
  }

  // 仅为缺口文本联网；命中 fixture 的位置保留真向量，按原顺序拼回。
  const missingTexts = texts.filter((_text, i) => vectors[i] === undefined);
  const fetched = await embedViaApi(missingTexts);
  const byText = new Map<string, number[]>();
  missingTexts.forEach((text, i) => byText.set(text, fetched[i]!));
  return texts.map((text, i) => vectors[i] ?? byText.get(text)!);
}

/** 单条文本向量化的便捷封装。 */
export async function embedOne(text: string): Promise<number[]> {
  const [vector] = await embed([text]);
  if (!vector) throw new Error("embedding 返回为空");
  return vector;
}

/** 余弦相似度，范围约 [-1, 1]，越大越相似。 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`向量维度不一致：${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
