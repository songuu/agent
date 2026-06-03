/**
 * 可复用的 Agent 循环：思考 → 调用工具 → 观察结果 → 再思考，直到模型不再调用工具或触顶。
 *
 * 这是第 04/05 章手写 agent loop 的成熟版，沉淀到 shared 供后续章节与毕业项目复用。
 * 核心不变量：assistant 的每个 tool_use 都必须有对应的 tool 结果回传，否则下一轮请求会报错。
 */
import type { ChatResult, LLMClient, Message } from "../llm/types";
import type { ToolRegistry } from "./tool";

export interface AgentStep {
  index: number;
  result: ChatResult;
  toolResults: { name: string; output: string }[];
}

export interface RunAgentOptions {
  client: LLMClient;
  registry: ToolRegistry;
  /** 已有对话（至少含一条 user 消息）。 */
  messages: Message[];
  system?: string;
  /** 防死循环的最大步数，默认 10。 */
  maxSteps?: number;
  temperature?: number;
  /** 每一步（含工具结果）的回调，便于实时展示。 */
  onStep?: (step: AgentStep) => void;
}

export interface RunAgentResult {
  /** 完整对话（含所有 assistant 与 tool 消息），可继续追加复用。 */
  messages: Message[];
  /** 最终回复文本。 */
  finalText: string;
  steps: AgentStep[];
  usage: { inputTokens: number; outputTokens: number };
}

export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const { client, registry, system, temperature } = opts;
  const maxSteps = opts.maxSteps ?? 10;
  const messages: Message[] = [...opts.messages];
  const steps: AgentStep[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let i = 0; i < maxSteps; i++) {
    const result = await client.chat({
      messages,
      system,
      tools: registry.specs(),
      ...(temperature !== undefined ? { temperature } : {}),
    });
    inputTokens += result.usage.inputTokens;
    outputTokens += result.usage.outputTokens;

    // 记录本回合 assistant 消息（含工具调用，供下一轮上下文）
    messages.push({
      role: "assistant",
      content: result.text,
      ...(result.toolCalls.length ? { toolCalls: result.toolCalls } : {}),
    });

    // 模型不再调用工具 → 结束
    if (result.stopReason !== "tool_use" || result.toolCalls.length === 0) {
      const step: AgentStep = { index: i, result, toolResults: [] };
      steps.push(step);
      opts.onStep?.(step);
      return { messages, finalText: result.text, steps, usage: { inputTokens, outputTokens } };
    }

    // 执行本回合所有工具调用，把结果作为 tool 消息回传
    const toolResults: { name: string; output: string }[] = [];
    for (const call of result.toolCalls) {
      const output = await registry.run(call);
      toolResults.push({ name: call.name, output });
      messages.push({ role: "tool", content: output, toolCallId: call.id, name: call.name });
    }
    const step: AgentStep = { index: i, result, toolResults };
    steps.push(step);
    opts.onStep?.(step);
  }

  // 触达最大步数仍未收敛
  const last = messages[messages.length - 1];
  return {
    messages,
    finalText: last?.content ?? "",
    steps,
    usage: { inputTokens, outputTokens },
  };
}
