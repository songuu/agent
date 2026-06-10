/**
 * 查询改写（query transformation）：在「检索之前」先优化查询，提升召回。
 *
 * 用户的问法常常和资料的写法对不上：问得太口语、太短、含指代、或一句话里塞了多个意图。
 * 两个常用手段：
 *  - multiQuery：把一个问题扩成多个不同措辞/角度的查询，多路检索后取并集，降低「漏召回」。
 *  - HyDE（Hypothetical Document Embeddings）：先让模型写一段「假设答案」，用它去检索。
 *    因为「答案」在用词与篇幅上比「问题」更接近真正的资料，常能召回得更准。
 */
import { getLLM } from "../llm";
import type { LLMClient } from "../llm/types";

export interface QueryTransformOptions {
  /** 自定义 LLM；默认 getLLM()。 */
  llm?: LLMClient;
}

/**
 * 多查询改写：返回「原始查询 + n 个改写」，去重后供多路检索。
 * @param n 期望生成的改写数量（不含原始查询）。
 */
export async function multiQuery(
  query: string,
  n = 3,
  options: QueryTransformOptions = {},
): Promise<string[]> {
  const llm = options.llm ?? getLLM();
  const system = `你是检索查询改写器。把用户问题改写成 ${n} 个语义等价但措辞/角度不同的检索查询，每行一个，不要编号、不要解释、不要多余文字。`;
  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: query }],
    temperature: 0.3,
  });
  const lines = res.text
    .split("\n")
    .map((l) => l.replace(/^[\s\d.、)）\-*]+/, "").trim())
    .filter((l) => l.length > 0);
  // 含原始查询，去重后返回。
  return [...new Set([query, ...lines])].slice(0, n + 1);
}

/** HyDE：生成一段「假设答案」，其向量通常比原问题更贴近真实资料，适合拿去检索。 */
export async function hyde(query: string, options: QueryTransformOptions = {}): Promise<string> {
  const llm = options.llm ?? getLLM();
  const system =
    "你是写作助手。针对用户问题，写一段简洁、信息密度高的假设性答案（2-4 句），就当它来自一篇资料。直接陈述，不要说“我不知道”，不要任何免责声明或客套。";
  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: query }],
    temperature: 0.3,
  });
  return res.text.trim();
}
