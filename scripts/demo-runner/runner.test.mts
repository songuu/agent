import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDemoProcess, type DemoProcessFrame } from "./runner.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

function collectFrames(): {
  frames: DemoProcessFrame[];
  writeFrame: (frame: DemoProcessFrame) => void;
} {
  const frames: DemoProcessFrame[] = [];
  return {
    frames,
    writeFrame(frame) {
      frames.push(frame);
    },
  };
}

{
  const { frames, writeFrame } = collectFrames();
  const result = await runDemoProcess({
    demoId: "fixture-stream",
    entryPath: resolve(__dirname, "fixture-stream-demo.mts"),
    repoRoot,
    timeoutMs: 5_000,
    writeFrame,
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
  assert.equal(
    frames.filter((frame) => frame.type === "stdout").map((frame) => frame.data).join(""),
    "hello 世界\n",
  );
  assert.equal(
    frames.filter((frame) => frame.type === "stderr").map((frame) => frame.data).join(""),
    "warn line\n",
  );
  assert.deepEqual(frames.at(-1), { type: "exit", data: 0 });
}

{
  const { frames, writeFrame } = collectFrames();
  const result = await runDemoProcess({
    demoId: "fixture-long",
    entryPath: resolve(__dirname, "fixture-long-demo.mts"),
    repoRoot,
    timeoutMs: 100,
    writeFrame,
  });

  assert.equal(result.timedOut, true);
  assert.equal(result.exitCode, null);
  assert.ok(
    frames.some((frame) => frame.type === "stderr" && String(frame.data).includes("timed out")),
    "timeout should emit a stderr frame",
  );
  assert.deepEqual(frames.at(-1), { type: "exit", data: "timeout" });
}

{
  const { frames, writeFrame } = collectFrames();
  const result = await runDemoProcess({
    demoId: "fixture-protocol",
    entryPath: resolve(__dirname, "fixture-protocol-demo.mts"),
    repoRoot,
    timeoutMs: 5_000,
    writeFrame,
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(
    frames.filter((frame) => frame.type === "thinking").map((frame) => frame.data),
    ["模型正在分析问题"],
  );
  assert.equal(
    frames.filter((frame) => frame.type === "stderr").map((frame) => frame.data).join(""),
    "plain warning\n",
  );
}

console.log("runner.test.mts: ok");
