export const DEMO_RUNNER_FRAME_PREFIX = "__DEMO_RUNNER_FRAME__";

export interface DemoRunnerThinkingFrame {
  type: "thinking";
  data: string;
}

export function emitDemoRunnerThinking(message: string): void {
  if (process.env.DEMO_RUNNER_FRAME_PROTOCOL !== "1") return;
  if (!message.trim()) return;
  const frame: DemoRunnerThinkingFrame = { type: "thinking", data: message };
  process.stderr.write(`${DEMO_RUNNER_FRAME_PREFIX}${JSON.stringify(frame)}\n`);
}
