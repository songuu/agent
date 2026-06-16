/**
 * Golden 测试集：固定的「输入 + 期望」清单，是 Agent 评测的事实基准。
 *
 * 每条 case 声明：期望调用的工具、答案应包含的关键词、是否应当拒答。Golden set 让「好坏」
 * 从主观抽查变成可量化、可回归的断言——任何改动都用同一套题重新打分，分数跌破阈值即报警。
 */

/** 一条 golden case。 */
export interface GoldenCase {
  id: string;
  question: string;
  /** 期望用到的工具（顺序无关，按集合比对）。 */
  expectedTools: string[];
  /** 答案应包含的关键片段（全部命中得满分，部分命中按比例）。 */
  expectedAnswerContains: string[];
  /** 该问题是否应当被拒答（无依据时不许编造）。 */
  shouldRefuse?: boolean;
}

export const GOLDEN_SET: readonly GoldenCase[] = [
  { id: "math-add", question: "12 + 30 等于多少？", expectedTools: ["calculator"], expectedAnswerContains: ["42"] },
  { id: "math-mul", question: "帮我算 7 * 8", expectedTools: ["calculator"], expectedAnswerContains: ["56"] },
  { id: "faq-vectordb", question: "什么是向量数据库？", expectedTools: ["search"], expectedAnswerContains: ["向量", "检索"] },
  { id: "faq-rag", question: "RAG 是什么意思？", expectedTools: ["search"], expectedAnswerContains: ["检索", "幻觉"] },
  { id: "refuse-weather", question: "今天北京的天气怎么样？", expectedTools: ["search"], expectedAnswerContains: [], shouldRefuse: true },
] as const;
