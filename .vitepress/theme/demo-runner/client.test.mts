import assert from "node:assert/strict";
import { createBufferedTerminalWriter, shouldInstallDemoRunnerPanel } from "./client";

assert.equal(shouldInstallDemoRunnerPanel(false, ""), false);
assert.equal(shouldInstallDemoRunnerPanel(false, undefined), false);
assert.equal(shouldInstallDemoRunnerPanel(true, ""), true);
assert.equal(shouldInstallDemoRunnerPanel(false, "dev-token"), true);

const writes: string[] = [];
const writer = createBufferedTerminalWriter(
  {
    write(value) {
      writes.push(value);
    },
    writeln(value) {
      writes.push(`${value}\n`);
    },
  },
  (flush) => flush(),
);

writer.writeFrame({ type: "thinking", data: "正在调用模型" });
writer.writeFrame({ type: "thinking", data: "..." });
writer.writeFrame({ type: "stdout", data: "答案" });
writer.writeFrame({ type: "exit", data: 0 });
writer.flush();

assert.deepEqual(writes, [
  "\x1b[36m[thinking]\x1b[0m \x1b[2m正在调用模型",
  "...",
  "\x1b[0m\n",
  "答案",
  "\n",
  "exit: 0\n",
]);

console.log("demo runner client tests passed");
