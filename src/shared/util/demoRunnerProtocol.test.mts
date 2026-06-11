import assert from "node:assert/strict";
import { emitDemoRunnerThinking } from "./demoRunnerProtocol";

const previousFlag = process.env.DEMO_RUNNER_FRAME_PROTOCOL;
const previousWrite = process.stderr.write;
const writes: string[] = [];

process.stderr.write = ((chunk: string | Uint8Array) => {
  writes.push(String(chunk));
  return true;
}) as typeof process.stderr.write;

try {
  delete process.env.DEMO_RUNNER_FRAME_PROTOCOL;
  emitDemoRunnerThinking("hidden");
  assert.deepEqual(writes, []);

  process.env.DEMO_RUNNER_FRAME_PROTOCOL = "1";
  emitDemoRunnerThinking("  保留空格\n");
  assert.equal(
    writes[0],
    '__DEMO_RUNNER_FRAME__{"type":"thinking","data":"  保留空格\\n"}\n',
  );
} finally {
  process.stderr.write = previousWrite;
  if (previousFlag === undefined) delete process.env.DEMO_RUNNER_FRAME_PROTOCOL;
  else process.env.DEMO_RUNNER_FRAME_PROTOCOL = previousFlag;
}

console.log("demo runner protocol tests passed");
