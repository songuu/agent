/**
 * RAG 评估：用 LLM-as-judge 给一次问答打三个核心质量分（参考 RAGAS 的指标设计）。
 *
 *  - contextRelevance（上下文相关性）：检索到的资料和问题相关吗？低分说明「检索」环节出了问题。
 *  - faithfulness（忠实度）：答案是否完全有资料支撑、没有臆造？低分说明模型在「编」。
 *  - answerRelevance（答案相关性）：答案是否直接切题？低分说明答非所问。
 *
 * 把分数拆成三段是为了「定位是哪一环坏了」：检索差 → 调分块/检索/重排；忠实度差 → 收紧
 * 生成约束；切题差 → 调提示。三分都用同一个 0~1 的裁判，便于横向比较与回归。
 */
import { getLLM } from "../llm";
import type { LLMClient } from "../llm/types";
import type { RetrievedChunk } from "./types";

export interface RagEvalScores {
  contextRelevance: number;
  faithfulness: number;
  answerRelevance: number;
  reasons: {
    contextRelevance: string;
    faithfulness: string;
    answerRelevance: string;
  };
}

export interface RagEvalInput {
  question: string;
  answer: string;
  contexts: RetrievedChunk[];
  llm?: LLMClient;
}

/** 单项裁判：要求模型输出 SCORE/REASON 两行，容错解析成 0~1 分数。 */
async function judge(
  llm: LLMClient,
  instruction: string,
  payload: string,
): Promise<{ score: number; reason: string }> {
  const system = `${instruction}\n严格按如下两行输出，不要多余文字：\nSCORE: <0 到 1 之间的小数>\nREASON: <一句话理由>`;
  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: payload }],
    temperature: 0,
  });
  const scoreMatch = res.text.match(/SCORE:\s*([0-9]*\.?[0-9]+)/i);
  const reasonMatch = res.text.match(/REASON:\s*(.+)/i);
  let score = scoreMatch ? Number(scoreMatch[1]) : 0;
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(1, score));
  return { score, reason: reasonMatch?.[1]?.trim() ?? res.text.trim().slice(0, 120) };
}

/** 评估一次 RAG 问答，返回三项 0~1 分数与各自理由。三项裁判并行执行。 */
export async function evaluateRag(input: RagEvalInput): Promise<RagEvalScores> {
  const llm = input.llm ?? getLLM();
  const ctx = input.contexts.map((c, i) => `[片段 ${i}] ${c.text}`).join("\n\n");

  const [cr, ff, ar] = await Promise.all([
    judge(
      llm,
      "评估「检索到的资料」与「问题」的相关程度（context relevance）：资料越能支撑回答该问题分越高，全是无关内容则接近 0。",
      `问题：${input.question}\n\n资料：\n${ctx}`,
    ),
    judge(
      llm,
      "评估「答案」对「资料」的忠实程度（faithfulness）：答案里的事实都能在资料中找到依据则高分；出现资料没有的内容（臆造）则低分。",
      `资料：\n${ctx}\n\n答案：\n${input.answer}`,
    ),
    judge(
      llm,
      "评估「答案」对「问题」的切题程度（answer relevance）：直接、完整地回答了问题则高分；答非所问或空泛则低分。",
      `问题：${input.question}\n\n答案：\n${input.answer}`,
    ),
  ]);

  return {
    contextRelevance: cr.score,
    faithfulness: ff.score,
    answerRelevance: ar.score,
    reasons: {
      contextRelevance: cr.reason,
      faithfulness: ff.reason,
      answerRelevance: ar.reason,
    },
  };
}
