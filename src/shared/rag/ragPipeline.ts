/**
 * 可组合的 RAG 问答管线：把「检索 →（可选）精排 → 引用增强 → 生成」串成一个函数。
 *
 * 这是第 09 章手写 RAG 的「成熟可复用版」：检索器抽象成 Retriever（向量/混合都行），
 * 精排可选开关，生成阶段统一注入「仅据资料作答 + 标注片段编号」的约束，产出可溯源答案。
 */
import { getLLM } from "../llm";
import type { LLMClient, Usage } from "../llm/types";
import type { Retriever, RetrievedChunk } from "./types";
import { MemoryVectorStore } from "./vectorStore";
import { llmRerank } from "./rerank";

export interface RagAnswer {
  answer: string;
  /** 实际注入生成的片段（精排后），顺序与答案里的 [片段 N] 编号一致。 */
  contexts: RetrievedChunk[];
  usage: Usage;
}

export interface AnswerWithRagOptions {
  query: string;
  retriever: Retriever;
  /** 最终注入生成的片段数，默认 4。 */
  k?: number;
  /** 开启精排时，先召回多少候选再精排到 k，默认 k*3。 */
  recallK?: number;
  /** 是否启用 LLM 精排，默认 false。 */
  rerank?: boolean;
  llm?: LLMClient;
  /** 注入 system 的角色/约束前言，默认通用知识库助手。 */
  systemPreamble?: string;
}

/** 把片段拼成「带编号的资料区」，编号即引用锚点。 */
export function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[片段 ${i}]（相关度 ${c.score.toFixed(3)}）\n${c.text}`)
    .join("\n\n");
}

/** 把一个 MemoryVectorStore 适配成统一的 Retriever，供管线复用。 */
export function asRetriever(store: MemoryVectorStore): Retriever {
  return {
    async retrieve(query: string, k: number): Promise<RetrievedChunk[]> {
      const hits = await store.search(query, k);
      return hits.map((h) => ({
        id: h.doc.id,
        text: h.doc.text,
        score: h.score,
        ...(h.doc.metadata ? { metadata: h.doc.metadata } : {}),
      }));
    },
  };
}

/** 端到端 RAG 问答：检索 →（可选精排）→ 引用增强 → 生成。 */
export async function answerWithRag(options: AnswerWithRagOptions): Promise<RagAnswer> {
  const { query, retriever } = options;
  const k = options.k ?? 4;
  const llm = options.llm ?? getLLM();

  let contexts: RetrievedChunk[];
  if (options.rerank) {
    const recalled = await retriever.retrieve(query, options.recallK ?? k * 3);
    contexts = await llmRerank(query, recalled, { llm, topN: k });
  } else {
    contexts = await retriever.retrieve(query, k);
  }

  const preamble = options.systemPreamble ?? "你是严谨的知识库问答助手。";
  const system = [
    preamble,
    "你必须【仅根据下面提供的资料】回答，不得使用资料之外的知识，更不得编造。",
    "若资料中没有答案，直接说「资料中未提及」。",
    "每条结论后用方括号标注它依据的片段编号，例如：……（[片段 1]）。",
    "",
    "===== 资料开始 =====",
    buildContextBlock(contexts),
    "===== 资料结束 =====",
  ].join("\n");

  const res = await llm.chat({
    system,
    messages: [{ role: "user", content: query }],
    temperature: 0,
  });
  return { answer: res.text, contexts, usage: res.usage };
}
