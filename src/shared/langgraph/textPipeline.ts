/**
 * 进阶 LangGraph · 第 01 章「手写 StateGraph」的可复用图与纯函数节点。
 *
 * WHY: lesson 12 用预制 `createReactAgent`（一张已编译好的图）。本模块把盖子揭开——
 * 手写一张 StateGraph：State（带 reducer 的 channels）+ 普通函数节点 + 线性边 + compile/invoke。
 * **全部离线、零 LLM、零随机**：节点就是纯函数，所以图的输出完全确定、可单测、可回归。
 *
 * 核心教学点：
 *  1) channel 的 **reducer** 决定「多次写入如何合并」——append（累积）vs replace（覆盖）。
 *  2) 节点返回的是 **partial 更新**（只写它碰的 channel），没碰的 channel 由上一状态自动保留。
 */
import { StateGraph, Annotation, START, END, type CompiledStateGraph } from "@langchain/langgraph";

/** 管线状态的结构视图（节点读这些字段；运行时由 Annotation channels 承载）。 */
export interface PipelineState {
  /** 工作文本（replace channel：只保留最后一次写入）。 */
  text: string;
  /** 执行轨迹（append/replace 二选一，由 buildTextPipeline 的 accumulateSteps 决定——本章的对照主角）。 */
  steps: string[];
  /** 分词结果（replace channel）。 */
  tokens: string[];
  /** 词频最高的词（replace channel；并列按字典序取最小，保证确定）。 */
  topWord: string;
}

// ── 三个纯函数节点：各自只返回它碰的 channel（partial 更新）────────────────────────

/** 归一化：去首尾空白、压缩内部空白、转小写。只写 text + 记一步 steps。 */
export function normalizeNode(state: Pick<PipelineState, "text">): Partial<PipelineState> {
  const text = state.text.trim().replace(/\s+/g, " ").toLowerCase();
  return { text, steps: ["normalize"] };
}

/** 分词：按空白切。只写 tokens + 记一步 steps（注意：它没碰 text，text 会被自动保留）。 */
export function tokenizeNode(state: Pick<PipelineState, "text">): Partial<PipelineState> {
  const tokens = state.text.split(" ").filter((token) => token.length > 0);
  return { tokens, steps: ["tokenize"] };
}

/** 统计：算词频取最高（并列按字典序最小，确定性）。只写 topWord + 记一步 steps。 */
export function countNode(state: Pick<PipelineState, "tokens">): Partial<PipelineState> {
  const freq = new Map<string, number>();
  for (const token of state.tokens) freq.set(token, (freq.get(token) ?? 0) + 1);
  let topWord = "";
  let topCount = -1;
  // 确定性挑选：先按出现次数降序，次数并列按词字典序升序——与 Map 插入顺序无关。
  for (const [word, count] of [...freq.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) {
    if (count > topCount) {
      topCount = count;
      topWord = word;
    }
    break;
  }
  return { topWord, steps: ["count"] };
}

export interface BuildPipelineOptions {
  /**
   * steps channel 的 reducer 模式：
   *  - true（默认）：append —— 累积所有跑过的节点名（["normalize","tokenize","count"]）。
   *  - false：replace —— 只留最后一次写入（["count"]）。
   * 这是本章演示「reducer 决定合并语义」的对照开关。
   */
  accumulateSteps?: boolean;
}

/** 已编译的文本管线图类型（channels 由内部 Annotation 决定，对外只暴露 invoke 等）。 */
export type TextPipeline = CompiledStateGraph<PipelineState, Partial<PipelineState>, string>;

/**
 * 构建并编译一张线性 StateGraph：START → normalize → tokenize → count → END。
 * 关键：steps channel 的 reducer 由 accumulateSteps 切换，演示同样的节点在不同 reducer 下的不同累积结果。
 */
export function buildTextPipeline(options: BuildPipelineOptions = {}): TextPipeline {
  const accumulate = options.accumulateSteps ?? true;

  const State = Annotation.Root({
    text: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
    steps: Annotation<string[]>({
      reducer: accumulate ? (old, next) => old.concat(next) : (_old, next) => next,
      default: () => [],
    }),
    tokens: Annotation<string[]>({ reducer: (_old, next) => next, default: () => [] }),
    topWord: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
  });

  return new StateGraph(State)
    .addNode("normalize", normalizeNode)
    .addNode("tokenize", tokenizeNode)
    .addNode("count", countNode)
    .addEdge(START, "normalize")
    .addEdge("normalize", "tokenize")
    .addEdge("tokenize", "count")
    .addEdge("count", END)
    .compile() as TextPipeline;
}
