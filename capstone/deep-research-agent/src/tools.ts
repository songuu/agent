/**
 * 毕业项目 · 工具集（search / calculator / saveNote）
 *
 * 全部用 shared 的 defineTool 定义：一个 zod schema 同时承担「给模型的参数描述」和
 * 「执行前的运行期校验」。工具内部出错不抛异常，而是返回可读字符串，让 Agent 自我纠正
 * （这是 shared/agent/tool.ts 的约定，见 ToolRegistry.run）。
 *
 * WHY 用「工厂函数」而不是直接导出工具：search 要访问向量库、saveNote 要写入笔记本，
 * 这些都是「运行期才创建的状态」。用闭包把状态注入工具，既避免全局可变单例，也方便
 * 测试时传入 mock——符合「不可变、低耦合」的工程偏好。
 */
import { z } from "zod";
import { defineTool, ToolRegistry } from "../../../src/shared/agent/tool";
import type { MemoryVectorStore } from "../../../src/shared/rag/vectorStore";

/** 一条研究笔记：Agent 在检索过程中沉淀下来的要点。 */
export interface ResearchNote {
  /** 要点内容。 */
  point: string;
  /** 这条要点来自哪个来源（便于最终报告引用）。 */
  source: string;
}

/** 工具运行所需的共享上下文（由 agent.ts 在每次研究任务开始时创建）。 */
export interface ToolContext {
  /** 已装载语料的向量库，search 工具据此做语义检索。 */
  store: MemoryVectorStore;
  /** 笔记本：saveNote 往里追加，最终报告会汇总它（注意：execute 内部会原地 push）。 */
  notes: ResearchNote[];
  /** 工具调用计数器，供可观测统计（每个键累加一次）。 */
  toolCalls: Record<string, number>;
}

/** search 命中的一条结果（整理成稳定形状，方便换真实搜索 API 时保持接口不变）。 */
interface SearchResultItem {
  source: string;
  content: string;
  /** 语义相似度，0~1，越大越相关。 */
  score: number;
}

/**
 * 安全计算器：只允许数字与基础运算符，杜绝把任意代码塞进 eval 的注入风险。
 *
 * WHY 不直接用 eval：模型生成的表达式属于「不可信外部输入」，必须在系统边界做白名单校验。
 * 这里用一个小递归下降解析器（支持 + - * / 与括号、负号），既安全又无第三方依赖。
 */
function safeCalculate(expression: string): number {
  let pos = 0;
  const input = expression.replace(/\s+/g, "");

  function peek(): string | undefined {
    return input[pos];
  }

  function parseExpression(): number {
    let value = parseTerm();
    let op = peek();
    while (op === "+" || op === "-") {
      pos++;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
      op = peek();
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    let op = peek();
    while (op === "*" || op === "/") {
      pos++;
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new Error("除数不能为 0");
      value = op === "*" ? value * rhs : value / rhs;
      op = peek();
    }
    return value;
  }

  function parseFactor(): number {
    const ch = peek();
    if (ch === "(") {
      pos++;
      const value = parseExpression();
      if (peek() !== ")") throw new Error("括号不匹配");
      pos++;
      return value;
    }
    if (ch === "-") {
      pos++;
      return -parseFactor();
    }
    if (ch === "+") {
      pos++;
      return parseFactor();
    }
    return parseNumber();
  }

  function parseNumber(): number {
    const start = pos;
    while (pos < input.length) {
      const c = input[pos]!;
      if ((c >= "0" && c <= "9") || c === ".") pos++;
      else break;
    }
    if (pos === start) throw new Error(`无法解析数字，位置 ${start}：${input.slice(start) || "(空)"}`);
    const num = Number(input.slice(start, pos));
    if (Number.isNaN(num)) throw new Error(`非法数字：${input.slice(start, pos)}`);
    return num;
  }

  const result = parseExpression();
  if (pos !== input.length) {
    throw new Error(`表达式含非法字符，位置 ${pos}：${input.slice(pos)}`);
  }
  return result;
}

/**
 * 根据共享上下文创建本项目的工具，并装进一个 ToolRegistry。
 *
 * @returns 已注册 search / calculator / saveNote 的注册表，可直接传给 runAgent({ registry })。
 */
export function createToolRegistry(ctx: ToolContext): ToolRegistry {
  // search：对内置语料做语义检索，模拟「联网搜索」。
  // 换真实搜索：把这段 execute 换成 fetch Tavily/Bing，再把结果整理成同样的 SearchResultItem[] 即可。
  const search = defineTool({
    name: "search",
    description:
      "在知识库中按语义检索资料。输入一个自然语言查询（一个聚焦的子问题），返回最相关的若干段资料及其来源标题与相似度。需要事实依据时优先用它，不要凭空编造。",
    schema: z.object({
      query: z.string().min(1).describe("要检索的子问题，越聚焦命中越准，如「向量数据库选型」"),
      k: z.number().int().min(1).max(8).optional().describe("返回条数，默认 4"),
    }),
    execute: async ({ query, k }): Promise<{ results: SearchResultItem[]; note: string }> => {
      ctx.toolCalls["search"] = (ctx.toolCalls["search"] ?? 0) + 1;
      const hits = await ctx.store.search(query, k ?? 4);
      const results: SearchResultItem[] = hits.map((hit) => ({
        // metadata.title 来自 corpus 装载时写入的来源标题（见 agent.ts 的 loadCorpus）
        source: String(hit.doc.metadata?.["title"] ?? hit.doc.id),
        content: hit.doc.text,
        score: Number(hit.score.toFixed(4)),
      }));
      const note =
        results.length === 0
          ? "没有检索到相关资料，换个更具体的查询再试。"
          : `命中 ${results.length} 条资料，请基于它们作答并在结论里标注来源标题。`;
      return { results, note };
    },
  });

  // calculator：安全表达式求值。研究里常需要算占比、增长率等。
  const calculator = defineTool({
    name: "calculator",
    description:
      "计算一个数学表达式，支持 + - * / 与括号、负号。用于研究中的数值推算（如占比、差值、增长率）。只接受算术表达式，不要传入文字说明。",
    schema: z.object({
      expression: z.string().min(1).describe("如 (89 - 58) / 58 * 100"),
    }),
    execute: ({ expression }): { expression: string; result: number } => {
      ctx.toolCalls["calculator"] = (ctx.toolCalls["calculator"] ?? 0) + 1;
      // safeCalculate 抛错会被 ToolRegistry.run 捕获并转成给模型的错误字符串，无需在此 try-catch
      const result = safeCalculate(expression);
      return { expression, result };
    },
  });

  // saveNote：把检索到的要点存进内存笔记本，供最终汇总报告时引用。
  const saveNote = defineTool({
    name: "saveNote",
    description:
      "把一条已确认的研究要点连同其来源记入笔记本。每检索并确认一个关键事实就调用一次，最终报告会汇总这些笔记。point 要简洁、可独立成立；source 用 search 返回的来源标题。",
    schema: z.object({
      point: z.string().min(1).describe("一条简洁的研究要点（结论或事实）"),
      source: z.string().min(1).describe("该要点的来源标题，来自 search 返回的 source"),
    }),
    execute: ({ point, source }): { saved: true; total: number } => {
      ctx.toolCalls["saveNote"] = (ctx.toolCalls["saveNote"] ?? 0) + 1;
      // 注意：这里原地 push 进共享笔记本。execute 允许有副作用，但要确保 notes 的所有权清晰
      // （由 agent.ts 为每次任务单独 new 一个数组，任务之间互不污染）。
      ctx.notes.push({ point, source });
      return { saved: true, total: ctx.notes.length };
    },
  });

  // 直接构建注册表（与课程一致的用法），上层无需关心工具数组的细节
  return new ToolRegistry([search, calculator, saveNote]);
}
