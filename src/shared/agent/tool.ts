/**
 * 工具系统：用 zod 定义工具 + 自动生成 JSON Schema + 运行期参数校验 + 安全执行。
 *
 * 这是第 06 章"从零构建工具系统"的成熟版，沉淀到 shared 供后续章节与毕业项目复用。
 * 设计要点：
 *  - 单一事实来源：一个 zod schema 同时用于"给模型的参数描述"和"执行前的运行期校验"。
 *  - 永不抛到调用方：工具执行失败/参数非法都转成给模型看的字符串，让 agent 自我修正。
 *  - 类型擦除的注册表：defineTool 内部完成「校验→执行→字符串化」，对外暴露统一的
 *    run(input: unknown) => Promise<string>。这样注册表里可以放各种入参类型不同的工具，
 *    既不需要 any，也不会触发函数参数逆变导致的类型不兼容（写 execute 时仍有精确类型）。
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema, ToolSpec } from "../llm/types";

/** 工具定义（作者书写的形态）：泛型 I 锁定 schema 校验后的入参类型，execute 因此有精确类型。 */
export interface ToolDefinition<I, O> {
  name: string;
  description: string;
  schema: z.ZodType<I>;
  execute: (input: I) => Promise<O> | O;
}

/**
 * 注册表中存放的工具（已类型擦除）。
 * run() 内部已封装「zod 校验 + 执行 + 结果字符串化 + 错误兜底」，对外只暴露统一签名。
 */
export interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  run: (input: unknown) => Promise<string>;
}

/** 把 zod schema 转成模型可读的 JSON Schema 参数（剥掉 $schema/definitions 等噪音字段）。 */
function buildParameters(schema: z.ZodType): JSONSchema {
  const raw = zodToJsonSchema(schema, { target: "openApi3" }) as Record<string, unknown>;
  const { $schema, definitions, ...parameters } = raw;
  void $schema;
  void definitions;
  return parameters as JSONSchema;
}

/**
 * 定义一个工具。作者得到带类型的 execute(input: I)，返回的是类型擦除的统一 Tool。
 * 任何错误（参数非法 / 执行抛错）都被转成字符串结果，便于 agent 读懂并自我纠错。
 */
export function defineTool<I, O>(def: ToolDefinition<I, O>): Tool {
  const parameters = buildParameters(def.schema);
  return {
    name: def.name,
    description: def.description,
    parameters,
    run: async (input: unknown): Promise<string> => {
      const parsed = def.schema.safeParse(input);
      if (!parsed.success) {
        return `Error: 工具 "${def.name}" 参数校验失败 — ${parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; ")}`;
      }
      try {
        const result = await def.execute(parsed.data);
        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (err) {
        return `Error: 工具 "${def.name}" 执行异常 — ${(err as Error).message}`;
      }
    },
  };
}

/** 取得给模型的工具描述（参数已在 defineTool 时预计算）。 */
export function toToolSpec(tool: Tool): ToolSpec {
  return { name: tool.name, description: tool.description, parameters: tool.parameters };
}

/** 工具注册表：登记、列举、批量给模型的 specs、按名安全执行。 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  constructor(tools: Tool[] = []) {
    for (const tool of tools) this.register(tool);
  }

  register(tool: Tool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }

  /** 给模型的工具描述列表。 */
  specs(): ToolSpec[] {
    return this.list().map(toToolSpec);
  }

  /** 执行一次工具调用。未知工具与工具内部错误都转成字符串（给模型看），不向上抛。 */
  async run(call: { name: string; arguments: Record<string, unknown> }): Promise<string> {
    const tool = this.get(call.name);
    if (!tool) return `Error: 未知工具 "${call.name}"`;
    return tool.run(call.arguments);
  }
}
