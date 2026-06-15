/**
 * 进阶 LangGraph · 第 03 章 demo：Checkpointer 持久化与时间旅行
 *
 * 这个 demo 演示什么？
 *   第 01/02 章的图跑完即忘——每次 invoke 都从零开始。本章给图挂一个 `MemorySaver` checkpointer，
 *   状态就按 `thread_id` 被持久化，于是图获得四种「记忆」能力，全用【纯函数节点】离线演示：
 *     ① 持久化累积：同一 thread 多次 invoke，状态经 reducer 自动续上（无需手动回传历史）。
 *     ② 线程隔离：不同 thread_id 各自独立，互不影响。
 *     ③ 状态快照：getState 取某 thread 的当前状态（values + 待执行 next + checkpoint_id）。
 *     ④ 执行时间线：getStateHistory 倒序遍历每个 super-step 的快照。
 *     ⑤ 人工改写：updateState 精确覆盖某个 channel（这里改 label，total 不动）。
 *     ⑥ 时间旅行：invoke(null, 历史 checkpoint 的 config) 从过去某点重放——纯函数节点 ⇒ 结果可复现。
 *
 * 教学结论由【构造保证】，用 invariant() 运行时硬核对，且全部【旋钮无关】（改 STEP/INVOKES 不会误报崩）：
 *   一次 invoke 走 debit→credit 两个节点，每个给 total 加 STEP，故每次净增 2×STEP；
 *   k 次同 thread 累积到 2×STEP×k；不同 thread 互不影响；历史倒序单调不增；重放复现下游。
 *
 * 运行：npx tsx langgraph-advanced/03-checkpointing/index.ts
 */
import {
  buildCheckpointedLedger,
  threadConfig,
  type LedgerState,
  type CheckpointedLedger,
} from "../../src/shared/langgraph";
import { divider, logger, color } from "../../src/shared";

function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// 把某 thread 的状态时间线收集成数组（newest-first，与 getStateHistory 的顺序一致）。
type Snapshot = { values: LedgerState; next: string[]; config?: { configurable?: Record<string, unknown> } };
async function collectHistory(graph: CheckpointedLedger, cfg: ReturnType<typeof threadConfig>): Promise<Snapshot[]> {
  const out: Snapshot[] = [];
  for await (const snap of graph.getStateHistory(cfg)) {
    out.push(snap as unknown as Snapshot);
  }
  return out;
}

// ── 旋钮（全确定；下面的 invariant 对任意合理取值都成立）─────────────────────────
const STEP = 1; // 每个节点给 total 加的增量
const INVOKES = 3; // 同一 thread 上连续 invoke 的次数
const PER_INVOKE = 2 * STEP; // 一次 invoke 走 debit→credit，故净增 2×STEP（由构造推出）

async function main(): Promise<void> {
  // ── ①② 持久化累积 + 线程隔离 ──────────────────────────────────────────────
  divider("1) MemorySaver + thread_id：状态在多次 invoke 间存活并累积");
  const graph = buildCheckpointedLedger({ step: STEP });
  const threadA = threadConfig("user-A");

  console.log(`  同一 thread「user-A」连续 invoke ${INVOKES} 次（每次 debit→credit 各 +${STEP}）：`);
  for (let i = 1; i <= INVOKES; i += 1) {
    const r = await graph.invoke({}, threadA);
    console.log(`    第 ${i} 次后 total = ${color(String(r.total), "green")}（轨迹累计 ${r.trail.length} 步）`);
  }
  const snapA = await graph.getState(threadA);

  // 另一个 thread 完全独立。
  const threadB = threadConfig("user-B");
  await graph.invoke({}, threadB);
  const snapB = await graph.getState(threadB);
  const snapAAfterB = await graph.getState(threadA);

  divider("结论核对（运行时判定，旋钮无关）");
  // ① 持久化累积：k 次 invoke 后 total == 2×STEP×k（节点只声明增量，sum reducer 跨 invoke 续上）。
  invariant(snapA.values.total === PER_INVOKE * INVOKES, "同 thread k 次 invoke 应累积到 2×STEP×k");
  invariant(snapA.values.trail.length === PER_INVOKE * INVOKES, "trail 应累积每次每节点一条");
  console.log(`  ① ${color("持久化累积", "cyan")}：user-A invoke ${INVOKES} 次 → total=${snapA.values.total}（=2×${STEP}×${INVOKES}）；无需手动回传历史，checkpointer 自动续上`);

  // ② 线程隔离：B 只跑 1 次 == 2×STEP；A 不受 B 影响。
  invariant(snapB.values.total === PER_INVOKE, "另一 thread 只跑 1 次应为 2×STEP");
  invariant(snapAAfterB.values.total === PER_INVOKE * INVOKES, "B 的 invoke 不应改动 A 的状态");
  console.log(`  ② ${color("线程隔离", "cyan")}：user-B total=${snapB.values.total}（独立）；user-A 仍=${snapAAfterB.values.total}（不被 B 影响）`);

  // ── ③④ 状态快照 + 执行时间线 ──────────────────────────────────────────────
  divider("2) getState 取当前快照 / getStateHistory 倒序遍历整条时间线");
  const history = await collectHistory(graph, threadA);
  console.log(`  user-A 当前快照：total=${color(String(snapA.values.total), "green")}，next=${JSON.stringify(snapA.next)}（[] 表示已到 END），checkpoint_id=${color(String(snapA.config?.configurable?.checkpoint_id).slice(0, 8), "gray")}…`);
  console.log(`  时间线共 ${color(String(history.length), "green")} 个快照（每个 super-step 一个），total 倒序：${color(JSON.stringify(history.map((h) => h.values.total)), "gray")}`);

  // ③ getState 就是时间线最新一条（head）；图已到 END，故 next 为空。
  invariant(history.length > 0, "应至少有一个历史快照");
  invariant(history[0]!.values.total === snapA.values.total, "getState 应等于 getStateHistory 的最新一条");
  invariant(snapA.next.length === 0, "图已到 END，next 应为空");
  console.log(`  ③ ${color("快照=时间线之首", "cyan")}：getState 即 history[0]（最新 checkpoint）；next=[] 说明这条 thread 已跑到 END`);

  // ④ 时间线倒序（newest-first）⇒ total 单调不增；最早一条是初始（total=0）。
  const monotonic = history.every((h, i) => i === 0 || h.values.total <= history[i - 1]!.values.total);
  invariant(monotonic, "倒序时间线的 total 应单调不增");
  invariant(history[history.length - 1]!.values.total === 0, "最早的快照应是初始状态 total=0");
  console.log(`  ④ ${color("可回溯时间线", "cyan")}：倒序 total 单调不增（${history[history.length - 1]!.values.total} → … → ${history[0]!.values.total}），最早一条即初始状态`);

  // ── ⑤ updateState 人工改写（精确覆盖单个 channel）──────────────────────────
  divider("3) updateState 人工改写状态：精确覆盖某个 channel（label），不动其它（total）");
  const totalBefore = snapA.values.total;
  await graph.updateState(threadA, { label: "human-corrected" });
  const snapAfterUpdate = await graph.getState(threadA);
  // ⑤ label 被覆盖为新值，total 原封不动（replace channel 精确改写）。
  invariant(snapAfterUpdate.values.label === "human-corrected", "updateState 应覆盖 label channel");
  invariant(snapAfterUpdate.values.total === totalBefore, "改写 label 不应影响 total channel");
  console.log(`  ⑤ ${color("人工改写", "cyan")}：updateState 把 label 改成「${color(snapAfterUpdate.values.label, "green")}」，total 仍=${snapAfterUpdate.values.total}（只动指定 channel，这就是 human-in-the-loop 修正状态的底座）`);

  // ── ⑥ 时间旅行：从历史 checkpoint 重放（纯函数节点 ⇒ 可复现）────────────────
  divider("4) 时间旅行：invoke(null, 历史 checkpoint 的 config) 从过去某点重放");
  const fresh = buildCheckpointedLedger({ step: STEP });
  const threadT = threadConfig("time-travel");
  const fullRun = await fresh.invoke({}, threadT); // 完整跑一遍：debit→credit
  const ttHistory = await collectHistory(fresh, threadT);
  // 取「debit 执行后、credit 待执行」那个 checkpoint（next === ["credit"]）。
  const midpoint = ttHistory.find((h) => JSON.stringify(h.next) === JSON.stringify(["credit"]));
  invariant(midpoint !== undefined, "应能在历史中找到 debit 之后、credit 之前的 checkpoint");
  console.log(`  完整跑一遍 total=${color(String(fullRun.total), "green")}；回到「debit 之后」那个 checkpoint（此时 total=${midpoint!.values.total}，next=${JSON.stringify(midpoint!.next)}）`);

  const replay = await fresh.invoke(null, midpoint!.config as Parameters<typeof fresh.invoke>[1]);
  // ⑥ 从中途 checkpoint 重放（只剩 credit 一步），结果与完整跑一遍逐字一致（纯函数 ⇒ 确定）。
  invariant(replay.total === fullRun.total, "从历史 checkpoint 重放应复现相同的下游结果");
  console.log(`  ⑥ ${color("时间旅行可复现", "cyan")}：从中途 checkpoint 重放 → total=${replay.total}（== 完整跑一遍的 ${fullRun.total}）；纯函数节点保证重放确定`);

  divider("一句话总结");
  logger.success(
    "checkpointer（MemorySaver）按 thread_id 持久化每一步状态：同 thread 跨 invoke 自动累积、不同 thread 隔离；getState/getStateHistory 看快照与时间线；updateState 改写状态、invoke(null, 历史config) 时间旅行重放——这是会话记忆、断点续跑与 human-in-the-loop 的共同底座。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
