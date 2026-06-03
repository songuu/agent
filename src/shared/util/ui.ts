/**
 * 终端展示辅助：分隔线、角色气泡、流式打印。
 *
 * WHY: 几乎每个 lesson 都要把"对话/思考/工具调用"打印得可读。统一在这里，
 * 让课程代码聚焦逻辑而非排版。
 */
import { color } from "./logger";

/** 打印一条带标题的分隔线。 */
export function divider(title = ""): void {
  const line = "─".repeat(Math.max(0, 60 - title.length));
  console.log(color(`\n── ${title} ${line}`, "gray"));
}

const ROLE_STYLE: Record<string, { label: string; tint: Parameters<typeof color>[1] }> = {
  user: { label: "你 ", tint: "cyan" },
  assistant: { label: "AI", tint: "green" },
  tool: { label: "工具", tint: "yellow" },
  system: { label: "系统", tint: "magenta" },
};

/** 打印一条角色消息（用户/助手/工具/系统）。 */
export function printMessage(role: string, content: string): void {
  const style = ROLE_STYLE[role] ?? { label: role, tint: "gray" as const };
  console.log(`${color(`[${style.label}]`, style.tint)} ${content}`);
}

/**
 * 逐块打印一个文本流（如 LLM 的流式输出），返回拼接后的完整文本。
 * @example
 *   const full = await printStream(client.stream({ messages }));
 */
export async function printStream(
  stream: AsyncIterable<{ type: string; text?: string }>,
): Promise<string> {
  let full = "";
  process.stdout.write(color("[AI] ", "green"));
  for await (const chunk of stream) {
    if (chunk.type === "text" && chunk.text) {
      process.stdout.write(chunk.text);
      full += chunk.text;
    }
  }
  process.stdout.write("\n");
  return full;
}

/** 简易"读一行用户输入"（用于交互式 REPL 课程）。 */
export async function prompt(question: string): Promise<string> {
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(color(`\n${question} `, "cyan"));
  rl.close();
  return answer.trim();
}
