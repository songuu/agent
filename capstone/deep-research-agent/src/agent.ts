/**
 * 毕业项目 · Agent 组装（规划 → 检索推理 → 结构化报告 → 成本统计）
 *
 * 这是把整套课程能力拼成一个小产品的「主干」。一次 research(question) 会经历：
 *   1) 规划：让 LLM 先产出一份结构化研究计划（拆子问题）——Plan-and-Execute 模式。
 *   2) 执行：runAgent 多步循环，调用 search / calculator / saveNote 收集事实与笔记。
 *   3) 汇总：让 LLM 基于「笔记 + 对话上下文」产出一份带引用来源的结构化报告（zod 约束）。
 *   4) 观测：全程用 Tracer 装饰 LLMClient，统计 tokens / 调用次数 / 估算成本。
 *
 * 综合体现的能力：工具系统、Agent 循环、RAG、规划、结构化输出、（流式见 cli.ts）、可观测。
 */
import { z } from "zod";
import { performance } from "node:perf_hooks";
import { getLLM } from "../../../src/shared/llm";
import type {
  ChatOptions,
  ChatResult,
  LLMClient,
  StreamChunk,
} from "../../../src/shared/llm/types";
import { runAgent } from "../../../src/shared/agent/loop";
import type { AgentStep } from "../../../src/shared/agent/loop";
import { MemoryVectorStore } from "../../../src/shared/rag/vectorStore";
import { CORPUS } from "./corpus";
import { createToolRegistry } from "./tools";
import type { ResearchNote } from "./tools";

// ──────────────────────────────────────────────────────────────────────────
// 成本估算（自带一张「示意价格表」，单位：美元 / 每百万 tokens）
// WHY 内联而非依赖 lessons：lessons 不是可被 import 的共享模块，毕业项目应自包含。
// 真实单价以厂商官方价格页为准，且会随时间变化。
// ──────────────────────────────────────────────────────────────────────────
interface ModelPrice {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICE_TABLE: Readonly<Record<string, ModelPrice>> = {
  "claude-opus-4-8": { inputPerMillion: 15, outputPerMillion: 75 },
  "claude-sonnet-4-5": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-haiku-4-5": { inputPerMillion: 1, outputPerMillion: 5 },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
};

/** 查不到模型时的保守兜底价：计费宁可不准也不能不算。 */
const FALLBACK_PRICE: ModelPrice = { inputPerMillion: 5, outputPerMillion: 15 };

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICE_TABLE[model] ?? FALLBACK_PRICE;
  return (inputTokens / 1_000_000) * price.inputPerMillion +
    (outputTokens / 1_000_000) * price.outputPerMillion;
}

/** 把美元金额格式化为可读字符串（单次调用费用常常很小，保留 6 位小数）。 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(6)}`;
}

// ──────────────────────────────────────────────────────────────────────────
// 可观测：用装饰器模式包住 LLMClient，记录每次 chat 的 tokens / 耗时 / 费用。
// 对外仍是同一个 LLMClient 接口，runAgent 与规划/汇总调用一行都不用改。
// ──────────────────────────────────────────────────────────────────────────
export interface CostSummary {
  /** LLM 调用次数（含规划、Agent 各步、汇总）。 */
  llmCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  /** 各工具被调用的次数。 */
  toolCalls: Record<string, number>;
  totalDurationMs: number;
  model: string;
}

class Tracer {
  private readonly inner: LLMClient;
  private inputTokens = 0;
  private outputTokens = 0;
  private calls = 0;
  private durationMs = 0;

  constructor(client: LLMClient) {
    this.inner = client;
  }

  /** 返回带追踪的 LLMClient（可直接传给 runAgent({ client })）。 */
  client(): LLMClient {
    const self = this;
    return {
      provider: this.inner.provider,
      model: this.inner.model,
      async chat(options: ChatOptions): Promise<ChatResult> {
        const startedAt = performance.now();
        const result = await self.inner.chat(options);
        self.durationMs += performance.now() - startedAt;
        self.calls += 1;
        self.inputTokens += result.usage.inputTokens;
        self.outputTokens += result.usage.outputTokens;
        return result;
      },
      stream(options: ChatOptions): AsyncIterable<StreamChunk> {
        // 流式仅在 cli.ts 的「逐字打印报告」用到；也记入耗时与 token（done 块带 usage）。
        const startedAt = performance.now();
        const innerStream = self.inner.stream(options);
        async function* traced(): AsyncIterable<StreamChunk> {
          for await (const chunk of innerStream) {
            if (chunk.type === "done" && chunk.result) {
              self.durationMs += performance.now() - startedAt;
              self.calls += 1;
              self.inputTokens += chunk.result.usage.inputTokens;
              self.outputTokens += chunk.result.usage.outputTokens;
            }
            yield chunk;
          }
        }
        return traced();
      },
    };
  }

  /** 汇总指标。toolCalls 由调用方（工具上下文）补充。 */
  summary(model: string, toolCalls: Record<string, number>): CostSummary {
    return {
      llmCalls: this.calls,
      totalInputTokens: this.inputTokens,
      totalOutputTokens: this.outputTokens,
      totalCostUSD: estimateCost(model, this.inputTokens, this.outputTokens),
      toolCalls: { ...toolCalls },
      totalDurationMs: Math.round(this.durationMs),
      model,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 结构化产物：研究计划 与 最终报告（zod 作为单一事实来源，约束模型输出）
// ──────────────────────────────────────────────────────────────────────────
const planSchema = z.object({
  subQuestions: z
    .array(z.string().min(1))
    .min(1)
    .max(6)
    .describe("把研究问题拆成 2~6 个可独立检索的子问题"),
  strategy: z.string().min(1).describe("一句话说明整体研究思路"),
});
export type ResearchPlan = z.infer<typeof planSchema>;

const reportSchema = z.object({
  title: z.string().min(1).describe("报告标题"),
  summary: z.string().min(1).describe("3~5 句话的总体结论"),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).describe("小节标题"),
        content: z.string().min(1).describe("该小节的论述，需基于检索到的事实"),
      }),
    )
    .min(1)
    .describe("分主题展开的正文小节"),
  citations: z
    .array(z.string().min(1))
    .describe("引用到的来源标题列表（去重），来自 search 返回的 source"),
});
export type ResearchReport = z.infer<typeof reportSchema>;

/** research() 的完整返回：计划 + 报告 + 笔记 + 成本。 */
export interface ResearchResult {
  question: string;
  plan: ResearchPlan;
  report: ResearchReport;
  notes: ResearchNote[];
  cost: CostSummary;
}

/** 进度回调：让 CLI / server 能实时展示「现在到哪一步」。 */
export interface ResearchHooks {
  onPhase?: (phase: "planning" | "researching" | "writing", detail: string) => void;
  onStep?: (step: AgentStep) => void;
}

/**
 * 从可能含多余文字的模型输出里抠出第一段 JSON 对象，再用 schema 校验。
 *
 * WHY: 即使提示要求「只输出 JSON」，模型偶尔仍会包裹 ```json 代码块或加一句话。
 * 在系统边界做一次「提取 + 校验」，比假设模型永远听话要稳得多（快速失败，错误可读）。
 */
function parseJsonWithSchema<T>(raw: string, schema: z.ZodType<T>): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`模型输出里找不到 JSON 对象：${raw.slice(0, 120)}…`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate.slice(start, end + 1));
  } catch (err) {
    throw new Error(`JSON 解析失败：${(err as Error).message}`);
  }
  return schema.parse(parsed); // zod 校验失败会抛出带字段路径的清晰错误
}

/** 把语料装载进一个全新的内存向量库（每次研究任务独立，互不污染）。 */
async function loadCorpus(): Promise<MemoryVectorStore> {
  const store = new MemoryVectorStore();
  await store.add(
    CORPUS.map((doc) => ({
      text: doc.text,
      // 把来源标题与链接写进 metadata，search 工具据此回传「可引用的来源」
      metadata: { title: doc.title, ...(doc.url ? { url: doc.url } : {}) },
    })),
  );
  return store;
}

/** 第 1 步：让模型产出结构化研究计划。 */
async function makePlan(client: LLMClient, question: string): Promise<ResearchPlan> {
  const result = await client.chat({
    system:
      "你是严谨的研究规划助手。把用户的研究问题拆成可独立检索的子问题。只输出 JSON，不要任何额外文字。",
    messages: [
      {
        role: "user",
        content:
          `研究问题：${question}\n\n` +
          `请输出严格符合以下结构的 JSON：\n` +
          `{ "subQuestions": ["子问题1", "子问题2", ...], "strategy": "一句话研究思路" }\n` +
          `要求：2~6 个子问题，每个都应能用一次知识库检索来回答。`,
      },
    ],
    temperature: 0,
  });
  return parseJsonWithSchema(result.text, planSchema);
}

/** 第 3 步：基于笔记与对话上下文，产出结构化最终报告。 */
async function writeReport(
  client: LLMClient,
  question: string,
  notes: ResearchNote[],
): Promise<ResearchReport> {
  const notesText = notes.length
    ? notes.map((n, i) => `${i + 1}. ${n.point}（来源：${n.source}）`).join("\n")
    : "（无笔记，请基于已检索到的信息谨慎作答，并说明依据不足之处）";

  const result = await client.chat({
    system:
      "你是资深研究报告撰写者。只依据给定的研究笔记与事实作答，不要编造未出现的来源。只输出 JSON。",
    messages: [
      {
        role: "user",
        content:
          `研究问题：${question}\n\n研究笔记：\n${notesText}\n\n` +
          `请输出严格符合以下结构的 JSON（中文）：\n` +
          `{\n` +
          `  "title": "报告标题",\n` +
          `  "summary": "3~5 句话总体结论",\n` +
          `  "sections": [ { "heading": "小节标题", "content": "论述" } ],\n` +
          `  "citations": ["用到的来源标题（去重）"]\n` +
          `}\n` +
          `citations 必须来自上面笔记的「来源」，不得虚构。`,
      },
    ],
    temperature: 0.2,
  });
  return parseJsonWithSchema(result.text, reportSchema);
}

const RESEARCH_SYSTEM = `你是一个深度研究助手。你的目标：围绕研究问题，用 search 工具检索知识库收集事实依据，
必要时用 calculator 做数值推算，并用 saveNote 把每个确认的关键要点连同来源记下来。

工作要求：
- 逐个子问题检索，不要凭空作答；每检索到一个有用事实，就调用 saveNote 记录（point + source）。
- source 必须用 search 返回的来源标题，便于最终报告标注引用。
- 收集到足够覆盖各子问题的要点后，用一句话说明你已完成检索即可（最终成文由后续步骤负责）。`;

/**
 * 执行一次深度研究。
 *
 * @param question 研究问题。
 * @param hooks    可选进度回调（CLI / server 用来实时展示）。
 * @returns 计划、结构化报告、笔记与成本统计。
 */
export async function research(question: string, hooks: ResearchHooks = {}): Promise<ResearchResult> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error("研究问题不能为空");

  // 用 Tracer 装饰底层客户端：之后所有调用（规划/执行/汇总）都自动计入 token 与费用
  const tracer = new Tracer(getLLM());
  const client = tracer.client();

  // RAG 知识底座 + 工具上下文（每次任务独立）
  const store = await loadCorpus();
  const notes: ResearchNote[] = [];
  const toolCalls: Record<string, number> = {};
  const registry = createToolRegistry({ store, notes, toolCalls });

  // 1) 规划
  hooks.onPhase?.("planning", "正在拆解研究子问题…");
  const plan = await makePlan(client, trimmed);

  // 2) 多步检索与推理（Agent 循环）
  hooks.onPhase?.("researching", `按 ${plan.subQuestions.length} 个子问题检索中…`);
  const planBrief =
    `研究问题：${trimmed}\n` +
    `研究思路：${plan.strategy}\n` +
    `需要逐个攻克的子问题：\n` +
    plan.subQuestions.map((q, i) => `  ${i + 1}. ${q}`).join("\n");

  await runAgent({
    client,
    registry,
    system: RESEARCH_SYSTEM,
    messages: [{ role: "user", content: planBrief }],
    // 给足步数覆盖多个子问题的「检索 + 记笔记」，又防死循环
    maxSteps: 12,
    temperature: 0,
    onStep: (step) => hooks.onStep?.(step),
  });

  // 3) 汇总成结构化报告
  hooks.onPhase?.("writing", "正在撰写结构化报告…");
  const report = await writeReport(client, trimmed, notes);

  // 4) 成本统计
  const cost = tracer.summary(client.model, toolCalls);

  return { question: trimmed, plan, report, notes, cost };
}

/** 把结构化报告渲染成可读的 Markdown 文本（CLI 流式打印、server 返回都可复用）。 */
export function renderReportMarkdown(result: ResearchResult): string {
  const { report } = result;
  const lines: string[] = [];
  lines.push(`# ${report.title}`, "");
  lines.push(`> 研究问题：${result.question}`, "");
  lines.push("## 总体结论", "", report.summary, "");
  for (const section of report.sections) {
    lines.push(`## ${section.heading}`, "", section.content, "");
  }
  if (report.citations.length) {
    lines.push("## 参考来源", "");
    for (const cite of report.citations) lines.push(`- ${cite}`);
    lines.push("");
  }
  return lines.join("\n");
}
