/**
 * 进阶 LangGraph · 纯函数 / 确定性图 冒烟测试（不需要任何 API key）。
 *
 * WHY: 本轨道用纯函数节点 + StateGraph 把 LangGraph 机制讲透——节点不调模型，所以图的输出
 * 完全确定、可离线断言。这个 smoke 就是本轨道的「免 key 安全网」：改了 shared/langgraph 的逻辑，
 * 先跑它确认没改坏，再谈联网/带模型的章节。
 *
 * 运行：npx tsx langgraph-advanced/smoke.ts   （或 npm run lg:smoke）
 */
import {
  normalizeNode,
  tokenizeNode,
  countNode,
  buildTextPipeline,
  buildHalvingGraph,
  buildRunawayGraph,
  buildFanoutGraph,
  buildCheckpointedLedger,
  threadConfig,
  buildApprovalGraph,
  readPendingInterrupt,
  buildSupervisorGraph,
  buildTeamGraph,
  computeTaskResult,
  TEAM_ROLES,
} from "../src/shared/langgraph";
import { Command } from "@langchain/langgraph";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? "  → " + detail : ""}`);
  }
}

const INPUT = { text: "  The CAT sat on   the Mat the cat  " };

console.log("== StateGraph 纯函数节点（单测每个节点的 partial 更新）==");
{
  // 节点是纯函数：返回 partial 更新，且不改入参。
  const beforeText = "  Hi  There  ";
  const src = { text: beforeText };
  const n = normalizeNode(src);
  check("normalize 归一化文本", n.text === "hi there", `得到 ${JSON.stringify(n.text)}`);
  check("normalize 只返回 text + steps（partial）", JSON.stringify(Object.keys(n).sort()) === JSON.stringify(["steps", "text"]));
  check("normalize 不改入参（纯函数）", src.text === beforeText);

  const t = tokenizeNode({ text: "the cat the" });
  check("tokenize 切词正确", JSON.stringify(t.tokens) === JSON.stringify(["the", "cat", "the"]));
  check("tokenize 只返回 tokens + steps（partial）", JSON.stringify(Object.keys(t).sort()) === JSON.stringify(["steps", "tokens"]));

  const c = countNode({ tokens: ["the", "cat", "the"] });
  check("count 取最高频词", c.topWord === "the", `得到 ${c.topWord}`);
  check("count 并列按字典序最小（确定性）", countNode({ tokens: ["b", "a", "b", "a"] }).topWord === "a", "ab 各2次应取 a");
  check("count 只返回 topWord + steps（partial）", JSON.stringify(Object.keys(c).sort()) === JSON.stringify(["steps", "topWord"]));
}

console.log("== StateGraph 图执行（reducer 合并语义 + partial 持久化 + 确定性）==");
{
  const gAppend = buildTextPipeline({ accumulateSteps: true });
  const a = await gAppend.invoke(INPUT);
  check("append reducer 累积全部三步", JSON.stringify(a.steps) === JSON.stringify(["normalize", "tokenize", "count"]), JSON.stringify(a.steps));
  check("终态 text 已归一化", a.text === "the cat sat on the mat the cat");
  check("终态 tokens 正确", JSON.stringify(a.tokens) === JSON.stringify(["the", "cat", "sat", "on", "the", "mat", "the", "cat"]));
  check("终态 topWord = the（3 次）", a.topWord === "the");

  const gReplace = buildTextPipeline({ accumulateSteps: false });
  const r = await gReplace.invoke(INPUT);
  check("replace reducer 只剩最后一步", JSON.stringify(r.steps) === JSON.stringify(["count"]), JSON.stringify(r.steps));

  // partial 更新持久化：count 没写 text/tokens，但终态仍有（由上一状态保留）。
  check("partial 持久化：count 未写 text/tokens 仍保留", r.text.length > 0 && r.tokens.length > 0);

  // 确定性：同输入两次 invoke 逐字节相等。
  const a2 = await gAppend.invoke(INPUT);
  check("纯函数节点 ⇒ 同输入两次 invoke 全等", JSON.stringify(a) === JSON.stringify(a2));

  // 空输入兜底：不抛错，steps 仍记录三步，tokens 为空。
  const empty = await gAppend.invoke({ text: "   " });
  check("空白输入不抛错且 tokens 为空", Array.isArray(empty.tokens) && empty.tokens.length === 0 && empty.steps.length === 3);
}

console.log("== 条件边与路由：分支 / 循环 / recursionLimit / Send 扇出（确定图，离线）==");
{
  // 图1：减半循环 + 奇偶分支 —— 旋钮无关地验证终止/单调/分支。
  const g1 = buildHalvingGraph({ threshold: 5 });
  const a = await g1.invoke({ value: 100 });
  check("减半循环在 ≤ 阈值时终止", a.value <= 5, `value=${a.value}`);
  const haveValues = a.log.filter((s) => s.startsWith("halve->")).map((s) => Number(s.slice(7)));
  check("减半轨迹严格单调递减", haveValues.every((v, i) => i === 0 || v < haveValues[i - 1]!), JSON.stringify(haveValues));
  check("分支按终值奇偶路由", a.route === (a.value % 2 === 0 ? "even" : "odd"), `value=${a.value} route=${a.route}`);
  // 另一组旋钮触发 even 分支（64→32→16→8→4，4≤5 偶 → even）。
  const b = await buildHalvingGraph({ threshold: 5 }).invoke({ value: 64 });
  check("不同起点路由到 even 分支", b.value === 4 && b.route === "even", `value=${b.value} route=${b.route}`);
  // 确定性。
  const a2 = await g1.invoke({ value: 100 });
  check("减半图同输入两次 invoke 全等", JSON.stringify(a) === JSON.stringify(a2));

  // 图2：recursionLimit 安全阀。
  let caught = false;
  let name = "";
  try {
    await buildRunawayGraph().invoke({}, { recursionLimit: 8 });
  } catch (err) {
    caught = true;
    name = (err as Error).name;
  }
  check("恒循环图触发 recursionLimit 抛 GraphRecursionError", caught && name === "GraphRecursionError", `caught=${caught} name=${name}`);

  // 图3：Send 扇出 map-reduce。
  const f = await buildFanoutGraph().invoke({ items: [1, 2, 3, 4] });
  check("Send 扇出 N 项得 N 个 worker 结果", f.results.length === 4, `len=${f.results.length}`);
  check("reduce 汇总 = Σ(item×2)（顺序无关）", f.total === 20, `total=${f.total}`);
  check("扇出结果正确（排序后比对，与完成顺序无关）", JSON.stringify([...f.results].sort((x, y) => x - y)) === JSON.stringify([2, 4, 6, 8]));
  // 空输入兜底：无项 → 无 worker → total 0，不抛错。
  const empty = await buildFanoutGraph().invoke({ items: [] });
  check("空 items 不抛错且 total=0", empty.results.length === 0 && empty.total === 0);
}

console.log("== Checkpointer：持久化累积 / 线程隔离 / 快照 / 时间线 / 时间旅行（确定图，离线）==");
{
  // 一次 invoke 走 debit→credit 两节点，每个 +step，故每次净增 2×step（旋钮无关）。
  const STEP = 1;
  const PER = 2 * STEP;
  const g = buildCheckpointedLedger({ step: STEP });
  const A = threadConfig("A");

  // 持久化累积：同 thread invoke 3 次 → total = 2×step×3。
  for (let i = 0; i < 3; i += 1) await g.invoke({}, A);
  const sA = await g.getState(A);
  check("checkpointer 跨 invoke 持久化累积（total=2×step×3）", sA.values.total === PER * 3, `total=${sA.values.total}`);
  check("trail 跨 invoke 累积（每次每节点一条）", sA.values.trail.length === PER * 3, `len=${sA.values.trail.length}`);
  check("图跑到 END 后 getState.next 为空", sA.next.length === 0, JSON.stringify(sA.next));

  // 线程隔离：另一 thread 只跑 1 次 = 2×step，原 thread 不受影响。
  const B = threadConfig("B");
  await g.invoke({}, B);
  const sB = await g.getState(B);
  const sA2 = await g.getState(A);
  check("不同 thread_id 完全隔离（B=2×step）", sB.values.total === PER, `B=${sB.values.total}`);
  check("B 的 invoke 不影响 A（A 仍=2×step×3）", sA2.values.total === PER * 3, `A=${sA2.values.total}`);

  // 时间线：getStateHistory 倒序（newest-first），head===getState，total 单调不增，最早=0。
  const hist: { values: { total: number }; next: string[] }[] = [];
  for await (const s of g.getStateHistory(A)) hist.push(s as unknown as { values: { total: number }; next: string[] });
  check("getState 即时间线最新一条（head）", hist[0]!.values.total === sA2.values.total, `${hist[0]!.values.total} vs ${sA2.values.total}`);
  check("倒序时间线 total 单调不增", hist.every((h, i) => i === 0 || h.values.total <= hist[i - 1]!.values.total), JSON.stringify(hist.map((h) => h.values.total)));
  check("时间线最早一条是初始状态 total=0", hist[hist.length - 1]!.values.total === 0);

  // updateState：精确覆盖 label channel，不动 total。
  const totalBefore = sA2.values.total;
  await g.updateState(A, { label: "fixed" });
  const sA3 = await g.getState(A);
  check("updateState 覆盖 label 且不动 total", sA3.values.label === "fixed" && sA3.values.total === totalBefore);

  // 时间旅行：从 debit 后（next=[credit]）的 checkpoint 重放，复现完整跑一遍的下游。
  const g2 = buildCheckpointedLedger({ step: STEP });
  const T = threadConfig("T");
  const full = await g2.invoke({}, T);
  const h2: { values: { total: number }; next: string[]; config: unknown }[] = [];
  for await (const s of g2.getStateHistory(T)) h2.push(s as unknown as { values: { total: number }; next: string[]; config: unknown });
  const mid = h2.find((h) => JSON.stringify(h.next) === JSON.stringify(["credit"]));
  check("历史中存在 debit 后 / credit 前的 checkpoint", mid !== undefined);
  const replay = await g2.invoke(null, mid!.config as Parameters<typeof g2.invoke>[1]);
  check("从历史 checkpoint 重放复现下游（纯函数 ⇒ 确定）", replay.total === full.total, `replay=${replay.total} full=${full.total}`);
}

console.log("== Human-in-the-Loop：interrupt 暂停 / payload 读取 / Command resume / 必须 Command 才能续跑（确定图，离线）==");
{
  const AMOUNT = 500;
  const APPROVE = "approve";
  const g = buildApprovalGraph({ approveWord: APPROVE });

  // 暂停：first invoke 跑到 humanReview 的 interrupt 就停，下游不跑。
  const A = threadConfig("A");
  const paused = await g.invoke({ amount: AMOUNT }, A);
  const snapA = await g.getState(A);
  check("interrupt 让图暂停在 humanReview（next）", JSON.stringify(snapA.next) === JSON.stringify(["humanReview"]), JSON.stringify(snapA.next));
  check("暂停时 status 仍 pending、下游未跑", paused.status === "pending" && !paused.log.includes("apply") && !paused.log.includes("cancel"));

  // payload 从 getState().tasks[].interrupts[].value 取（不在返回值顶层）。
  const payload = (await readPendingInterrupt(g, A)) as { amount?: number } | undefined;
  check("interrupt payload 可读且携带提交数额", payload?.amount === AMOUNT, JSON.stringify(payload));

  // 批准：Command resume=approveWord → 走 apply → applied:<amount> → END。
  const approved = await g.invoke(new Command({ resume: APPROVE }), A);
  check("批准走 apply → applied 终态", approved.status === `applied:${AMOUNT}`, approved.status);
  check("批准轨迹含 review + apply", approved.log.includes("apply") && approved.log.includes(`review:${APPROVE}`));
  check("续跑后图到 END（next 空）", (await g.getState(A)).next.length === 0);

  // 拒绝：另一 thread，resume 非 approveWord → 走 cancel → rejected，apply 没跑。
  const B = threadConfig("B");
  await g.invoke({ amount: AMOUNT }, B);
  const rejected = await g.invoke(new Command({ resume: "reject" }), B);
  check("拒绝走 cancel → rejected 终态、不含 apply", rejected.status === "rejected" && !rejected.log.includes("apply") && rejected.log.includes("cancel"));
  check("同样的提交，approve 与 reject 终态相反（人决定走向）", approved.status !== rejected.status, `${approved.status} vs ${rejected.status}`);

  // 坑：暂停时普通 invoke 不 resume——从头重跑并再次暂停。
  const C = threadConfig("C");
  await g.invoke({ amount: AMOUNT }, C);
  const plain = await g.invoke({ amount: 999 }, C);
  const snapC = await g.getState(C);
  check("暂停时普通 invoke 不 resume（仍 pending 且重跑 propose×2）", plain.status === "pending" && JSON.stringify(snapC.next) === JSON.stringify(["humanReview"]) && plain.log.filter((x) => x.startsWith("propose")).length === 2);
}

console.log("== 多 Agent 编排：supervisor 调度循环 / 并行异构 team（确定图，离线）==");
{
  // 图1：supervisor 中心化调度——按类型路由、顺序保持、队空终止（旋钮无关）。
  const TASKS = ["math:2+3", "echo:hi", "upper:abc", "math:10+5", "upper:xy"];
  const sup = buildSupervisorGraph();
  const r1 = await sup.invoke({ pending: TASKS });
  const expected = TASKS.map(computeTaskResult);
  check("supervisor 每任务处理一次（队列清空 + 产出数 === 任务数）", r1.pending.length === 0 && r1.results.length === TASKS.length, `pending=${r1.pending.length} results=${r1.results.length}`);
  check("supervisor 按类型路由且顺序保持（逐条 === 纯函数期望）", JSON.stringify(r1.results) === JSON.stringify(expected), JSON.stringify(r1.results));
  check("worker 调用次数 === 任务数", r1.log.filter((x) => x.endsWith("Agent")).length === TASKS.length);
  check("supervisor 跑 任务数+1 次（最后空队列收工）", r1.log.filter((x) => x === "supervise").length === TASKS.length + 1);
  // 空任务：直接收工，无 worker、无产出。
  const empty = await buildSupervisorGraph().invoke({ pending: [] });
  check("空任务队列直接收工（无产出、无 worker）", empty.results.length === 0 && empty.log.filter((x) => x.endsWith("Agent")).length === 0);

  // 图2：并行异构 team——每角色一条、join 排序聚合、顺序无关确定。
  const TOPIC = "agents";
  const team = buildTeamGraph();
  const r2 = await team.invoke({ topic: TOPIC });
  const expectedSet = [...TEAM_ROLES].map((role) => `${role}:${TOPIC}`).sort();
  check("并行 team 每角色恰好贡献一条", r2.contributions.length === TEAM_ROLES.length, `len=${r2.contributions.length}`);
  check("贡献集合 === 各角色对主题的产出（按集合比对，顺序无关）", JSON.stringify([...r2.contributions].sort()) === JSON.stringify(expectedSet), JSON.stringify(r2.contributions));
  check("join 排序聚合 → report 确定", r2.report === expectedSet.join(" | "), JSON.stringify(r2.report));
  check("并行 team 两次 invoke report 逐字相等（确定）", (await team.invoke({ topic: TOPIC })).report === r2.report);
}

console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exitCode = 1;
