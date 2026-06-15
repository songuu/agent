/**
 * 进阶 LangGraph · 第 05 章 demo（收官）：多 Agent 编排 —— supervisor 调度 / 并行异构 team
 *
 * 这个 demo 演示什么？
 *   前四章把单张图讲透了。真实系统常把多个专职 agent 编排进一张图，本章离线演示两种最常见拓扑：
 *     图1) supervisor（中心化调度）：一个调度节点用条件边把每个任务分给对应 worker，worker 干完回到
 *          supervisor，循环直到队列空——「一个大脑指挥多个专才」。
 *     图2) parallel team（并行异构）：从 fork 点同时触发多个不同角色的 agent 并行干活，结果经 append
 *          reducer 汇集，再由 join 排序聚合——「多个专才并行协作，最后合稿」。
 *   agent 全是【纯函数节点】（确定规则，不调模型），离线确定可回归。
 *
 * 教学结论由【构造保证】，用 invariant() 运行时硬核对，且全部【旋钮无关】（改 TASKS/TOPIC 不会误报崩）：
 *   supervisor 每任务恰好处理一次、按队首顺序、路由到正确 worker、队空即终止；
 *   并行 team 每角色贡献一条、join 排序聚合与完成顺序无关（两次 invoke 全等）。
 *
 * 运行：npx tsx langgraph-advanced/05-multi-agent-graph/index.ts
 */
import {
  buildSupervisorGraph,
  buildTeamGraph,
  computeTaskResult,
  TEAM_ROLES,
} from "../../src/shared/langgraph";
import { divider, logger, color } from "../../src/shared";

function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// ── 旋钮（全确定；下面的 invariant 对任意合理取值都成立）─────────────────────────
const TASKS = ["math:2+3", "echo:hi", "upper:abc", "math:10+5", "upper:xy"];
const TOPIC = "agents";

async function main(): Promise<void> {
  // ── 图1：supervisor 中心化调度循环 ──────────────────────────────────────────
  divider("1) supervisor：一个调度节点把每个任务分给对应 worker，循环到队列空");
  const sup = buildSupervisorGraph();
  const r1 = await sup.invoke({ pending: TASKS });
  console.log(`  ${TASKS.length} 个任务 ${color(JSON.stringify(TASKS), "gray")}`);
  console.log(`  调度轨迹：${color(JSON.stringify(r1.log), "gray")}`);
  console.log(`  各 worker 产出：${color(JSON.stringify(r1.results), "green")}`);

  // 纯 JS 里算出每条任务的期望结果（旋钮无关：改 TASKS 期望自动重算）。
  const expected = TASKS.map(computeTaskResult);
  const workerCalls = r1.log.filter((entry) => entry.endsWith("Agent")).length;
  const superviseCalls = r1.log.filter((entry) => entry === "supervise").length;

  divider("结论核对（运行时判定，旋钮无关）");
  // ① 每个任务恰好被处理一次：队列清空、产出条数 === 任务数、worker 调用 === 任务数。
  invariant(r1.pending.length === 0, "调度结束后任务队列应清空");
  invariant(r1.results.length === TASKS.length && workerCalls === TASKS.length, "每个任务应被恰好一个 worker 处理一次");
  console.log(`  ① ${color("每任务处理一次", "cyan")}：队列清空，worker 共被调度 ${workerCalls} 次 === 任务数 ${TASKS.length}`);

  // ② 路由正确：每条产出 === 该任务类型对应 worker 的结果（math 求和 / upper 大写 / echo 原样）。
  invariant(JSON.stringify(r1.results) === JSON.stringify(expected), "每条产出应等于对应 worker 对该任务的处理结果");
  console.log(`  ② ${color("按类型路由", "cyan")}：supervisor 的条件边按 task 前缀分发——math→求和、upper→大写、echo→原样，逐条与纯函数期望一致`);

  // ③ 顺序保持：supervisor 每轮取队首 ⇒ 产出顺序 === 输入任务顺序。
  invariant(r1.results.every((value, i) => value === expected[i]), "产出顺序应与输入任务顺序一致");
  console.log(`  ③ ${color("顺序保持", "cyan")}：supervisor 每轮取队首，产出顺序与输入一致（中心化调度是串行的）`);

  // ④ 终止：队列空时 supervisor 路由到 END；它比 worker 多跑一次（最后那次空队列收工）。
  invariant(superviseCalls === TASKS.length + 1, "supervisor 应在每次派发前 + 最后空队列时各跑一次");
  console.log(`  ④ ${color("队空即终止", "cyan")}：supervisor 跑了 ${superviseCalls} 次 = 任务数 ${TASKS.length} + 1（最后一次发现队列空 → 路由 END）`);

  // ── 图2：并行异构 team ───────────────────────────────────────────────────────
  divider("2) parallel team：fork 同时触发多个不同角色 agent 并行干活，join 聚合");
  const team = buildTeamGraph();
  const r2 = await team.invoke({ topic: TOPIC });
  console.log(`  主题「${color(TOPIC, "yellow")}」→ ${TEAM_ROLES.length} 个角色并行（${color(JSON.stringify([...TEAM_ROLES]), "gray")}）`);
  console.log(`  各角色贡献（原始顺序不保证）：${color(JSON.stringify(r2.contributions), "gray")}`);
  console.log(`  join 排序聚合的报告：${color(JSON.stringify(r2.report), "green")}`);

  const expectedSet = [...TEAM_ROLES].map((role) => `${role}:${TOPIC}`).sort();
  // ⑤ 每个角色恰好贡献一条（按集合比对——并行完成顺序不定，不能比原始顺序）。
  invariant(r2.contributions.length === TEAM_ROLES.length, "每个角色应恰好贡献一条");
  invariant(JSON.stringify([...r2.contributions].sort()) === JSON.stringify(expectedSet), "贡献集合应等于各角色对主题的产出");
  console.log(`  ⑤ ${color("并行异构贡献", "cyan")}：${TEAM_ROLES.length} 个角色各贡献一条，集合与期望一致（原始顺序不定，故按集合比对）`);

  // ⑥ join 排序聚合 ⇒ 报告与并行完成顺序无关：两次 invoke 逐字相等（确定）。
  const r2b = await team.invoke({ topic: TOPIC });
  invariant(r2.report === expectedSet.join(" | "), "报告应为各贡献排序后的聚合");
  invariant(r2.report === r2b.report, "两次 invoke 报告应逐字相等（顺序无关 ⇒ 确定）");
  console.log(`  ⑥ ${color("顺序无关聚合", "cyan")}：join 先排序再拼接 → 报告与各 agent 完成顺序无关，两次 invoke 逐字相等（纯函数 + reducer + 排序）`);

  divider("一句话总结");
  logger.success(
    "多 Agent 就是把多个专职节点编排进一张图：supervisor 用条件边中心化调度（串行、顺序可控）、parallel team 用 fork+join 并行协作（并行、靠 append reducer + 排序消除顺序依赖）；它们是 LangGraph 表达「团队协作」的两种基本拓扑，全部建立在前四章的 channel/reducer/条件边/Send 之上。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
