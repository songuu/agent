export type DemoFrameType = "stdout" | "stderr" | "done" | "exit";

export interface DemoFrame {
  type: DemoFrameType;
  data: unknown;
}

export interface DemoFrameParser {
  push(chunk: string): void;
  flush(): void;
}

export function createDemoFrameParser(onFrame: (frame: DemoFrame) => void): DemoFrameParser {
  let buffer = "";

  function readLine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = JSON.parse(trimmed) as DemoFrame;
    if (!isDemoFrame(parsed)) {
      throw new Error(`Invalid demo frame: ${trimmed}`);
    }
    onFrame(parsed);
  }

  return {
    push(chunk) {
      buffer += chunk;
      while (true) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        readLine(line);
      }
    },
    flush() {
      if (!buffer.trim()) {
        buffer = "";
        return;
      }
      const line = buffer;
      buffer = "";
      readLine(line);
    },
  };
}

function isDemoFrame(value: unknown): value is DemoFrame {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return type === "stdout" || type === "stderr" || type === "done" || type === "exit";
}
