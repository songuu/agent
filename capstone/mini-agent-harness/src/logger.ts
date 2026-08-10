import { color } from "../../../src/shared/util/logger";
import type { AgentEvent } from "./types";

export interface StreamingLoggerOptions {
  verbose?: boolean;
  write?: (line: string) => void;
}

/**
 * 只呈现可审计的 action 事件，不打印 planner/模型的隐藏推理、完整代码或 secrets。
 */
export function createStreamingLogger(options: StreamingLoggerOptions = {}): (event: AgentEvent) => void {
  const write = options.write ?? ((line: string) => console.log(line));
  let previousState: string | undefined;

  return (event: AgentEvent): void => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    switch (event.type) {
      case "state": {
        const transition = previousState ? `${previousState} → ${event.state}` : event.state;
        previousState = event.state;
        write(`${color(time, "gray")} ${color("state", "magenta")} ${transition}`);
        return;
      }
      case "tools_discovered":
        write(
          `${color(time, "gray")} ${color("mcp", "cyan")} tools/list → ${event.tools.length} tool(s): ${event.tools.map((tool) => tool.name).join(", ") || "none"}`,
        );
        return;
      case "context":
        if (options.verbose || event.preparation.strategy !== "full") {
          write(
            `${color(time, "gray")} ${color("context", "blue")} ${event.preparation.totalTokens} tokens, strategy=${event.preparation.strategy}, dropped=${event.preparation.droppedMessages}`,
          );
        }
        return;
      case "action":
        write(`${color(time, "gray")} ${color("action", "yellow")} ${event.action.summary}`);
        return;
      case "tool_result":
        write(
          `${color(time, "gray")} ${color("tool", "cyan")} ${event.name} ${event.result.isError ? color("ERROR", "red") : color("OK", "green")}: ${shorten(event.result.text)}`,
        );
        return;
      case "checkpoint":
        write(
          `${color(time, "gray")} ${color("checkpoint", "yellow")} ${event.phase} ${event.checkpoint.strategy}:${event.checkpoint.id.slice(0, 8)} (${event.checkpoint.label})`,
        );
        return;
      case "sandbox_result":
        write(
          `${color(time, "gray")} ${color("sandbox", "magenta")} ${event.result.isolation} ${event.result.ok ? color("OK", "green") : color("ERROR", "red")} exit=${event.result.exitCode ?? "n/a"} timeout=${event.result.timedOut} ${shorten(event.result.ok ? event.result.stdout : event.result.error ?? event.result.stderr)}`,
        );
        return;
      case "correction":
        write(`${color(time, "gray")} ${color("retry", "yellow")} #${event.attempt}: ${shorten(event.reason)}`);
        return;
      case "rollback":
        write(`${color(time, "gray")} ${color("rollback", "yellow")} restored ${event.checkpoint.strategy}:${event.checkpoint.id.slice(0, 8)}`);
        return;
      case "error":
        write(`${color(time, "gray")} ${color("error", "red")} ${shorten(event.message)}`);
        return;
    }
  };
}

function shorten(value: string, max = 240): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= max ? compact || "(empty)" : `${compact.slice(0, max)}…`;
}
