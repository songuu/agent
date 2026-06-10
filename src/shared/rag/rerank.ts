/**
 * LLM 重排（rerank）：召回-精排两段式里的「精排」。
 *
 * 第一段「召回」用便宜、快的检索（向量/BM25/混合）多捞一些候选（如 top-20），
 * 召回看重的是「别漏」；第二段「精排」再用更强但更贵的判断器（这里是 LLM）从候选里
 * 精挑最相关的少数几条（如 top-3），精排看重的是「排得准」。这能显著提升注入上下文的信噪比。
 *
 * 生产里精排常用专门的 cross-encoder reranker（如 bge-reranker / Cohere Rerank）；
 * 本课用一次 LLM 调用近似，原理一致：让模型同时看到 query 与全部候选，给出相关性排序。
 */
import { getLLM } from "../llm";
import type { LLMClient } from "../llm/types";
import type { RetrievedChunk } from "./types";

export interface RerankOptions {
  /** 自定义 LLM；默认 getLLM()。 */
  llm?: LLMClient;
  /** 精排后保留条数，默认 min(3, 候选数)。 */
  topN?: number;
}

/** 用 LLM 对候选片段按相关性精排，返回排序后的前 topN 条。 */
export async function llmRerank(
  query: string,
  candidates: RetrievedChunk[],
  options: RerankOptions = {},
): Promise<RetrievedChunk[]> {
  const topN = options.topN ?? Math.min(3, candidates.length);
  if (candidates.length <= 1) return candidates.slice(0, topN);

  const llm = options.llm ?? getLLM();
  const list = candidates
    .map((c, i) => `[${i}] ${c.text.replace(/\s+/g, " ").slice(0, 300)}`)
    .join("\n");
  const system = [
    "你是检索结果精排器。给定一个问题和若干编号候选片段，",
    "按「与问题的相关性」从高到低，只输出候选编号，用英文逗号分隔，例如：2,0,5。",
    "明显无关的片段不要列出。不要输出编号以外的任何文字。",
  ].join("");

  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: `问题：${query}\n\n候选片段：\n${list}` }],
    temperature: 0,
  });

  // 容错解析：从输出里抠出所有数字当作排序后的编号。
  const order = (res.text.match(/\d+/g) ?? []).map((s) => Number(s));
  const seen = new Set<number>();
  const ranked: RetrievedChunk[] = [];
  for (const idx of order) {
    if (idx >= 0 && idx < candidates.length && !seen.has(idx)) {
      seen.add(idx);
      ranked.push(candidates[idx]!);
    }
    if (ranked.length >= topN) break;
  }
  // 兜底：模型若没给满，用原召回顺序补足，保证不空手。
  if (ranked.length < topN) {
    for (let i = 0; i < candidates.length && ranked.length < topN; i++) {
      if (!seen.has(i)) {
        seen.add(i);
        ranked.push(candidates[i]!);
      }
    }
  }
  return ranked.slice(0, topN);
}
