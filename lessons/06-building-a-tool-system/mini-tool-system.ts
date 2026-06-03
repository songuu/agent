/**
 * 第 06 章 · 第一部分：亲手重建一个「简化版工具系统」
 *
 * 这里不导入 shared 的成品，而是用 zod + zod-to-json-schema 从零造一遍，
 * 目的是彻底看清 src/shared/agent/tool.ts 内部到底做了什么。读懂这 ~80 行，
 * 你就掌握了「工具系统三要素」：
 *   1. 单一 zod schema —— 既做运行期参数校验，又生成给模型看的 JSON Schema 描述。
 *   2. 注册表（Registry）—— 统一登记、列举、按名分发，新增工具不改 dispatch 代码。
 *   3. 安全执行 —— 参数非法 / 执行抛错都「转成字符串」回给模型，而不是让程序崩溃。
 *
 * WHY 单一 schema：手写「校验逻辑」和「给模型的参数描述」是两份会逐渐漂移的真相。
 * 用一个 zod schema 派生出两者，描述永远和校验一致，这是整个设计的核心收益。
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * 工具「定义」形态：作者书写时用泛型 <I> 锁住 schema 校验后的输入类型，
 * 这样写 execute 时能拿到精确类型提示（input 是 { a: number; b: number } 而不是 any/unknown）。
 */
export interface MiniToolDefinition<I> {
  name: string;
  description: string;
  /** 唯一事实来源：既校验参数，又生成参数描述。 */
  schema: z.ZodType<I>;
  /** 真正干活的函数。允许同步或异步；返回字符串或对象皆可。 */
  execute: (input: I) => string | object | Promise<string | object>;
}

/**
 * 注册表里存放的工具（已「类型擦除」）。
 *
 * WHY 擦除成 run(input: unknown)：注册表要同时装下入参类型各不相同的工具
 * （add 要 {a,b}、time 不要参数…）。若保留各自的泛型入参类型，把它们放进同一个数组时，
 * 会因为「函数参数逆变」而类型不兼容；用 any 又会丢类型安全。解决办法是：让 defineMiniTool
 * 在内部就把「校验→执行→字符串化」全包掉，对外只暴露统一的 run(input: unknown)=>Promise<string>。
 * 作者侧仍有精确类型，注册表侧是同构类型——两全其美。
 */
export interface MiniTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (input: unknown) => Promise<string>;
}

/** 给模型看的工具描述（不含执行逻辑）。形状刻意对齐 shared 的 ToolSpec，方便第二部分无缝切换。 */
export interface MiniToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * 把 zod schema 转成模型可读的参数描述。
 *
 * WHY 要剥掉 $schema / definitions：zodToJsonSchema 默认会塞入 JSON Schema 的元字段，
 * 对「工具参数描述」这个用途是噪音，去掉后 parameters 更干净，也省 token。
 */
function buildParameters(schema: z.ZodType): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, { target: "openApi3" }) as Record<string, unknown>;
  const { $schema, definitions, ...parameters } = raw;
  void $schema; // 显式丢弃，表明「我知道我在丢什么」
  void definitions;
  return parameters;
}

/**
 * 定义一个工具：作者得到带类型的 execute(input: I)，函数把它「封装」成统一的 MiniTool。
 * 「安全执行」的三类失败都在这里转成字符串，绝不向上抛——因为工具结果会作为一条 tool 消息
 * 回传给模型，把错误描述清楚回给模型，模型往往能在下一轮自我纠错（补参数 / 换工具名）。
 */
export function defineMiniTool<I>(def: MiniToolDefinition<I>): MiniTool {
  const parameters = buildParameters(def.schema);
  return {
    name: def.name,
    description: def.description,
    parameters,
    run: async (input: unknown): Promise<string> => {
      // 失败一/二：参数过不了 zod 校验（缺字段 / 类型不对 / 越界）
      const parsed = def.schema.safeParse(input);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; ");
        return `Error: 工具 "${def.name}" 参数校验失败 — ${detail}`;
      }
      // 失败三：execute 自身抛错（如除以零、网络超时）
      try {
        const result = await def.execute(parsed.data);
        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (err) {
        return `Error: 工具 "${def.name}" 执行异常 — ${(err as Error).message}`;
      }
    },
  };
}

/**
 * 简化版工具注册表：登记 → 列举 specs → 按名安全执行。
 *
 * 对比「手写 dispatch」：如果用一长串 if (name === "add") ... else if (name === "time") ...，
 * 每加一个工具就要改这段分发逻辑，且很容易漏掉参数校验。注册表把「登记」和「分发」
 * 解耦——新增工具只是 register 一下，run 的逻辑一行都不用动（开闭原则）。
 */
export class MiniToolRegistry {
  // 用 Map 而非数组：按名查找 O(1)，且天然防重名（后注册覆盖前者）。
  private readonly tools = new Map<string, MiniTool>();

  constructor(tools: MiniTool[] = []) {
    for (const tool of tools) this.register(tool);
  }

  register(tool: MiniTool): this {
    this.tools.set(tool.name, tool);
    return this; // 返回 this 以支持链式：reg.register(a).register(b)
  }

  /** 批量导出给模型的工具描述。 */
  specs(): MiniToolSpec[] {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /** 执行一次工具调用。未知工具直接返回错误字符串；其余失败由 tool.run 内部兜底。 */
  async run(call: { name: string; arguments: Record<string, unknown> }): Promise<string> {
    const tool = this.tools.get(call.name);
    if (!tool) return `Error: 未知工具 "${call.name}"`;
    return tool.run(call.arguments);
  }
}
