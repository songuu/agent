/**
 * 被测对象（system under test）：两个确定性 Agent，用来演示「评测能抓出回归」。
 *
 * - goodSubject：遇到查不到的问题会**拒答**（不编造）。
 * - regressedSubject：同样的能力，但**退化**成「无论如何都硬答」——评测门应当因此拦下它。
 *
 * 真实项目里 Subject 换成你接了 LLM 的 agent（runAgent(...)），评测框架（harness.ts）不变：
 * 喂 golden 输入、收集轨迹、交给裁判打分、过门禁。
 */

/** 一次运行产出的轨迹：用了哪些工具 + 最终答案。 */
export interface Trajectory {
  toolsUsed: string[];
  answer: string;
}

/** 被测 Agent：输入问题 → 轨迹。 */
export type Subject = (question: string) => Trajectory;

/** 内置知识片段（关键词 → 事实），供 search 路径作答。 */
const FACTS: readonly { keywords: string[]; text: string }[] = [
  { keywords: ["向量", "数据库", "vector"], text: "向量数据库把文本转成向量并按相似度检索，是 RAG 的存储与检索底座[1]。" },
  { keywords: ["rag", "检索增强"], text: "RAG 先检索相关资料再让模型据此作答，用检索把外部知识接进生成，降低幻觉[1]。" },
  { keywords: ["agent", "智能体", "循环"], text: "Agent 循环让模型在「思考→调用工具→观察结果」间多步迭代，直至完成任务[1]。" },
];

/** 简单算术：匹配 `a op b`，仅支持 + - * /，整数。 */
function tryCalculator(question: string): number | null {
  const m = /(\d+)\s*([-+*/])\s*(\d+)/.exec(question);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  switch (m[2]) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
    default: return null;
  }
}

/** 关键词检索：返回命中的事实文本，未命中返回 null。 */
function search(question: string): string | null {
  const q = question.toLowerCase();
  for (const fact of FACTS) {
    if (fact.keywords.some((kw) => q.includes(kw.toLowerCase()))) return fact.text;
  }
  return null;
}

/** 合规 Agent：算术走 calculator，知识走 search，查不到则拒答。 */
export const goodSubject: Subject = (question) => {
  const calc = tryCalculator(question);
  if (calc !== null) return { toolsUsed: ["calculator"], answer: `计算结果是 ${calc}。` };
  const hit = search(question);
  if (hit) return { toolsUsed: ["search"], answer: hit };
  return { toolsUsed: ["search"], answer: "抱歉，资料中未提及该问题，无法作答。" };
};

/**
 * 退化 Agent：算术正确，但知识查不到时**不再拒答**，而是硬编一句看似合理的答案。
 * 这种「该拒答却乱答」是上线后最危险的回归之一——评测门的价值就在于自动拦住它。
 */
export const regressedSubject: Subject = (question) => {
  const calc = tryCalculator(question);
  if (calc !== null) return { toolsUsed: ["calculator"], answer: `计算结果是 ${calc}。` };
  const hit = search(question);
  if (hit) return { toolsUsed: ["search"], answer: hit };
  return { toolsUsed: ["search"], answer: "据我所知，这个问题的答案是肯定的。" }; // 幻觉：不该答却答
};
