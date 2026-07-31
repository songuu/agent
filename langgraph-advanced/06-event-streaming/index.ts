/**
 * 进阶 LangGraph · 第 06 章 demo：Event streaming 与前端投影
 *
 * 这个 demo 演示什么？
 *   1) 用真实的 LangGraph 0.2.74 multi-mode stream 同时收集 values / custom / updates。
 *   2) 把框架 raw frame 归一化成稳定的 user / debug / audit 三类产品事件。
 *   3) 用安全默认处理未知事件：保留到 audit，不抛错，也不意外暴露给用户。
 *
 * 全图是 START → prepare → finalize → END 的纯函数顺序图，不调用 LLM、无需 API key。
 * 本章对 raw 顺序的精确断言只证明这张顺序图的实际行为，不泛化为并行图的排序承诺。
 *
 * 运行：npx tsx langgraph-advanced/06-event-streaming/index.ts
 */
import {
  collectEventStream,
  normalizeStreamFrame,
  projectStreamFrames,
  type ProgressEvent,
  type ProjectedStreamEvent,
} from "../../src/shared/langgraph";
import { color, divider, logger } from "../../src/shared";

function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

function progressStages(events: readonly ProjectedStreamEvent[]): string[] {
  return events.map((event) => (event.payload as ProgressEvent).stage);
}

function printProjectedEvents(label: string, events: readonly ProjectedStreamEvent[]): void {
  console.log(`  ${label}（${events.length} 条）：`);
  for (const event of events) {
    const node = event.node ? ` node=${event.node}` : "";
    console.log(
      `    #${event.sequence} mode=${color(event.mode, "cyan")} kind=${event.kind}${node} payload=${color(JSON.stringify(event.payload), "gray")}`,
    );
  }
}

const INPUT = "  agent   streaming  ";

async function main(): Promise<void> {
  divider("1) raw stream：同一次图执行收集 values / custom / updates");
  const collected = await collectEventStream(INPUT);
  const rawModes = collected.frames.map(([mode]) => mode);

  console.log(`  输入：${color(JSON.stringify(INPUT), "yellow")}`);
  for (const [sequence, [mode, payload]] of collected.frames.entries()) {
    console.log(
      `  #${sequence} ${color(mode, "cyan")} ${color(JSON.stringify(payload), "gray")}`,
    );
  }

  divider("2) 前端投影：user / debug / audit 各看自己该看的");
  printProjectedEvents("user：只接收显式 progress", collected.projection.user);
  printProjectedEvents("debug：节点 partial updates", collected.projection.debug);
  printProjectedEvents("audit：完整 values snapshots", collected.projection.audit);
  console.log(
    `  最终状态：${color(JSON.stringify(collected.projection.finalState), "green")}`,
  );

  divider("3) 未知事件：安全降级到 audit，而不是误上屏");
  const futureFrame = ["future-mode", { secret: "internal-only" }] as const;
  const malformedCustomFrame = ["custom", { type: "trace", detail: "not-user-safe" }] as const;
  const futureEvent = normalizeStreamFrame(futureFrame, collected.frames.length);
  const malformedCustomEvent = normalizeStreamFrame(
    malformedCustomFrame,
    collected.frames.length + 1,
  );
  const fallbackProjection = projectStreamFrames([
    ...collected.frames,
    futureFrame,
    malformedCustomFrame,
  ]);

  console.log(
    `  future-mode → audience=${color(futureEvent.audience, "yellow")} kind=${futureEvent.kind}`,
  );
  console.log(
    `  畸形 custom → audience=${color(malformedCustomEvent.audience, "yellow")} kind=${malformedCustomEvent.kind}`,
  );

  divider("结论核对（运行时判定，旋钮无关）");

  // ① 当前版本的 multi-mode stream 会产出 [mode, payload]；顺序图的实际序列可精确回归。
  const expectedModes = [
    "values",
    "custom",
    "updates",
    "values",
    "custom",
    "updates",
    "values",
  ];
  invariant(
    JSON.stringify(rawModes) === JSON.stringify(expectedModes),
    `顺序图 raw mode 序列应为 ${JSON.stringify(expectedModes)}，实际为 ${JSON.stringify(rawModes)}`,
  );
  console.log(
    `  ① ${color("multi-mode tuple", "cyan")}：raw mode 序列与顺序图执行阶段逐项一致`,
  );

  // ② 只有显式、通过 schema 的 progress custom 事件可以给用户看。
  invariant(
    collected.projection.user.every(
      (event) => event.mode === "custom" && event.kind === "progress",
    ),
    "user 投影只能包含已识别的 custom progress",
  );
  invariant(
    JSON.stringify(progressStages(collected.projection.user)) ===
      JSON.stringify(["prepare", "finalize"]),
    "user progress 应按 prepare → finalize 到达",
  );
  invariant(
    collected.projection.user.every((event) => event.mode !== "values"),
    "完整 values 快照绝不能直接进入 user 投影",
  );
  console.log(
    `  ② ${color("用户可见边界", "cyan")}：user 只看到 prepare → finalize 两条 progress，看不到完整 state`,
  );

  // ③ updates 是节点级增量，只进 debug；两节点顺序与当前顺序图拓扑一致。
  invariant(
    collected.projection.debug.every(
      (event) => event.mode === "updates" && event.kind === "state-update",
    ),
    "debug 投影只能包含 state updates",
  );
  invariant(
    JSON.stringify(collected.projection.debug.map((event) => event.node)) ===
      JSON.stringify(["prepare", "finalize"]),
    "debug 节点应按 prepare → finalize 到达",
  );
  console.log(
    `  ③ ${color("调试投影", "cyan")}：updates 保留节点 partial patch，不污染用户 UI`,
  );

  // ④ values 包含初始、prepare 后、finalize 后三份完整快照，只进入 audit。
  const snapshots = collected.projection.audit.filter(
    (event) => event.kind === "state-snapshot",
  );
  invariant(snapshots.length === 3, "顺序图应产生初始 + 两节点后共三份 values 快照");
  invariant(
    collected.projection.audit.every((event) => event.audience === "audit"),
    "完整 values 快照必须留在 audit 边界",
  );
  console.log(
    `  ④ ${color("审计投影", "cyan")}：values 共 ${snapshots.length} 份，保留完整状态时间线`,
  );

  // ⑤ stream 最后一份 values 必须与独立 invoke 的终态一致。
  invariant(
    JSON.stringify(collected.projection.finalState) ===
      JSON.stringify(collected.finalState),
    "最后 values 快照应与 invoke 终态逐字一致",
  );
  invariant(
    collected.finalState.normalizedInput === "agent streaming" &&
      collected.finalState.result === "AGENT STREAMING" &&
      collected.finalState.status === "completed",
    "最终业务状态应完成输入归一化和结果生成",
  );
  console.log(
    `  ⑤ ${color("终态一致", "cyan")}：stream finalState === invoke finalState，status=completed`,
  );

  // ⑥ 未知 mode 与畸形 custom 均安全进入 audit/unknown，不能升级为用户可见事件。
  invariant(
    futureEvent.audience === "audit" &&
      futureEvent.kind === "unknown" &&
      malformedCustomEvent.audience === "audit" &&
      malformedCustomEvent.kind === "unknown",
    "未知或畸形事件应安全降级为 audit/unknown",
  );
  invariant(
    fallbackProjection.user.length === collected.projection.user.length,
    "未知事件不能增加 user 投影条数",
  );
  invariant(
    fallbackProjection.audit.length === collected.projection.audit.length + 2,
    "未知事件应原样追加到 audit 供排障",
  );
  console.log(
    `  ⑥ ${color("安全默认", "cyan")}：future-mode / 畸形 custom 均保留到 audit，不抛错、不上屏`,
  );

  divider("一句话总结");
  logger.success(
    "LangGraph stream 是运行时协议，不是 UI 协议：multi-mode raw frame 先经稳定 normalizer，再把显式 progress 给 user、节点 updates 给 debug、完整 values 与未知事件留给 audit；这样前端不绑定框架 chunk，也不会意外泄露内部状态。",
  );
}

main().catch((error) => {
  logger.error(`运行失败：${(error as Error).message}`);
  process.exitCode = 1;
});
