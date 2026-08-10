import type { AgentAction, AgentPlanner, PlannerInput } from "./types";

/**
 * 零 key 的 dogfooding planner。它刻意让第一次脚本失败，随后只基于已记录的
 * sandbox 错误生成修复动作，用来演示 self-correction 的控制流而非模拟隐藏推理。
 */
export class DemoPlanner implements AgentPlanner {
  public async next(input: PlannerInput): Promise<AgentAction> {
    const hasToolObservation = input.observations.some((item) => item.kind === "tool");
    const latestSandbox = [...input.observations].reverse().find((item) => item.kind === "sandbox");

    if (!hasToolObservation) {
      return {
        kind: "tool",
        name: "read_text",
        args: { path: "task.txt" },
        summary: "读取受控工作区中的任务 fixture",
      };
    }

    if (!latestSandbox) {
      return {
        kind: "sandbox",
        summary: "第一次生成脚本（故意触发一次可恢复错误）",
        request: {
          runtime: "node",
          label: "first-attempt",
          code: 'throw new Error("intentional demo failure: use feedback to repair the script");',
        },
      };
    }

    if (!latestSandbox.ok) {
      return {
        kind: "sandbox",
        summary: "根据 sandbox 错误修复脚本并写入结果",
        request: {
          runtime: "node",
          label: "corrected-attempt",
          code: [
            'import { readFileSync, writeFileSync } from "node:fs";',
            'const task = readFileSync("task.txt", "utf8").trim();',
            'writeFileSync("result.txt", `completed: ${task}\\n`, "utf8");',
            'console.log("result.txt written");',
          ].join("\n"),
        },
      };
    }

    return {
      kind: "complete",
      summary: "MCP tool 已发现并调用；sandbox 在一次可恢复失败后完成，checkpoint 可用于回滚 result.txt。",
    };
  }
}
