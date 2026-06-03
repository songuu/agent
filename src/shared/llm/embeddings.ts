/**
 * 文本向量化（embedding）与余弦相似度。供"向量检索 / RAG"章节与毕业项目使用。
 *
 * WHY: Anthropic 官方不提供 embedding 模型（推荐配合 Voyage AI）。为降低初学者门槛，
 * 默认走 OpenAI 的 text-embedding-3-small（便宜、够用）。换厂商在此集中处理。
 */
import OpenAI from "openai";
import { requireEnv, getEnv } from "../util/env";

let cachedClient: OpenAI | null = null;

function client(): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return cachedClient;
}

/**
 * 把一批文本转成向量。
 * @returns 与输入等长的向量数组，每个向量是 number[]。
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = getEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")!;
  const res = await client().embeddings.create({ model, input: texts });
  return res.data.map((d) => d.embedding);
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
