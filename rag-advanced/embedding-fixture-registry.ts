/**
 * 离线 embedding fixture「待预计算文本」的单一来源。
 *
 * 这里登记每个向量 demo 用到的全部语料与查询。`npm run rag:build-fixture`（需 key，跑一次）
 * 会遍历这里的文本，用真 API 算出真向量，写进 src/shared/rag/fixtures/embeddings.json。
 * 之后这些 demo 即可离线运行（embed() 命中 fixture 直接拿真向量）。
 *
 * 新增向量 demo 时：把该章节的语料/查询抽成 `corpus.ts` 并在此 import + 登记一条 source，
 * 保证 demo 与 fixture 引用同一份字符串（不漂移）。
 */
import { CORPUS as hybridCorpus, QUERY as hybridQuery } from "./02-hybrid-search/corpus";

export interface FixtureSource {
  /** 来源标识（章节目录），仅用于报告。 */
  source: string;
  /** 该来源需要预计算 embedding 的全部文本（语料 + 查询）。 */
  texts: string[];
}

export const FIXTURE_SOURCES: FixtureSource[] = [
  {
    source: "rag-advanced/02-hybrid-search",
    texts: [...hybridCorpus.map((doc) => doc.text), hybridQuery],
  },
];

/** 扁平化去重后的全部待嵌文本。 */
export function allFixtureTexts(): string[] {
  return [...new Set(FIXTURE_SOURCES.flatMap((source) => source.texts))];
}
