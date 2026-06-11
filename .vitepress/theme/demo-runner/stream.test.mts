import assert from "node:assert/strict";
import { createDemoFrameParser, type DemoFrame } from "./stream";

const frames: DemoFrame[] = [];
const parser = createDemoFrameParser((frame) => frames.push(frame));

parser.push('{"type":"stdout","data":"hel');
parser.push('lo"}\n{"type":"stderr","data":"warn"}\n');
parser.push('{"type":"thinking","data":"模型正在规划下一步"}\n');
parser.push('{"type":"exit","data":0}');
parser.flush();

assert.deepEqual(frames, [
  { type: "stdout", data: "hello" },
  { type: "stderr", data: "warn" },
  { type: "thinking", data: "模型正在规划下一步" },
  { type: "exit", data: 0 },
]);

assert.throws(() => {
  createDemoFrameParser(() => undefined).push('{"type":"unknown"}\n');
}, /Invalid demo frame/);

console.log("demo runner stream parser tests passed");
