/**
 * 进阶 LangGraph · 第 02 章 demo：条件边与路由 —— 分支 / 循环 / Send 扇出
 *
 * 这个 demo 演示什么？
 *   第 01 章是【线性】图（每个节点的下一个固定）。本章用 `addConditionalEdges` 让图在运行时
 *   根据 State 自己决定走向，三种模式全用【纯函数节点】离线演示：
 *     图1) 分支 + 循环：不断减半直到 ≤ 阈值（循环），再按奇偶路由到不同 report 节点（分支）。
 *     图2) recursionLimit 安全阀：永不收敛的循环跑到上限抛 GraphRecursionError（图版的 maxSteps）。
 *     图3) Send 扇出：把一批项动态分发给 worker 的多个并行实例（map），再 reduce 汇总。
 *
 * 教学结论由【构造保证】，用 invariant() 运行时硬核对，且全部【旋钮无关】（改 START/THRESHOLD/items 不会误报崩）：
 *   - 循环必终止（减半单调递减）、分支按实际奇偶、扇出 N 项得 N 个 worker、reduce 求和与完成顺序无关。
 *
 * 运行：npx tsx langgraph-advanced/02-conditional-routing/index.ts
 */
import { buildHalvingGraph, buildRunawayGraph, buildFanoutGraph } from "../../src/shared/langgraph";
import { divider, logger, color } from "../../src/shared";

function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// ── 旋钮（全确定；下面的 invariant 对任意合理取值都成立）─────────────────────────
const START_VALUE = 100;
const THRESHOLD = 5;
const RECURSION_LIMIT = 8;
const FANOUT_ITEMS = [1, 2, 3, 4];

async function main(): Promise<void> {
  // ── 图1：条件分支 + 循环 ────────────────────────────────────────────────────
  divider("1) 条件边 = 路由函数：减半循环（指回自己）+ 奇偶分支");
  const g1 = buildHalvingGraph({ threshold: THRESHOLD });
  const r1 = await g1.invoke({ value: START_VALUE });
  console.log(`  从 ${START_VALUE} 不断减半（>${THRESHOLD} 就回 halve），轨迹：`);
  console.log(`    ${color(JSON.stringify(r1.log), "gray")}`);
  console.log(`  终值 ${color(String(r1.value), "green")}（≤${THRESHOLD}，跳出循环），按奇偶路由到 → ${color(r1.route, "cyan")}`);

  // 预先在纯 JS 里模拟期望的减半序列（旋钮无关：由 START/THRESHOLD 推出）。
  const expected: number[] = [];
  for (let v = START_VALUE; v > THRESHOLD; ) {
    v = Math.floor(v / 2);
    expected.push(v);
  }
  const haveValues = r1.log.filter((s) => s.startsWith("halve->")).map((s) => Number(s.slice("halve->".length)));

  divider("结论核对（运行时判定，旋钮无关）");
  // ① 循环必终止：终值 ≤ 阈值。
  invariant(r1.value <= THRESHOLD, "减半循环应在 value ≤ 阈值时终止");
  console.log(`  ① ${color("循环终止", "cyan")}：终值 ${r1.value} ≤ 阈值 ${THRESHOLD}（router 在此跳出循环）`);

  // ② 循环真的循环了且严格单调递减（这保证它必然终止）。
  invariant(JSON.stringify(haveValues) === JSON.stringify(expected), "减半轨迹应与纯函数模拟一致");
  invariant(haveValues.every((v, i) => i === 0 || v < haveValues[i - 1]!), "每步 value 应严格减小");
  console.log(`  ② ${color("单调递减", "cyan")}：halve 跑了 ${haveValues.length} 次，每步严格减小 → 必然终止（与纯函数模拟逐项一致）`);

  // ③ 分支按【实际奇偶】路由（不写死 odd/even）。
  const expectedRoute = r1.value % 2 === 0 ? "even" : "odd";
  invariant(r1.route === expectedRoute, "应按终值奇偶路由到对应 report 节点");
  console.log(`  ③ ${color("分支按奇偶", "cyan")}：终值 ${r1.value} 是${expectedRoute === "even" ? "偶" : "奇"}数 → route=${color(r1.route, "green")}（router 现场判定，非写死）`);

  // ── 图2：recursionLimit 安全阀 ──────────────────────────────────────────────
  divider("2) recursionLimit 安全阀：永不收敛的循环会被断路器拦下");
  const g2 = buildRunawayGraph();
  let caught = false;
  let errName = "";
  try {
    await g2.invoke({}, { recursionLimit: RECURSION_LIMIT });
  } catch (err) {
    caught = true;
    errName = (err as Error).name;
  }
  // ④ 无限循环必被 recursionLimit 拦截（图版的 maxSteps）。
  invariant(caught, "永不收敛的循环应在 recursionLimit 处抛错");
  console.log(`  ④ ${color("安全阀生效", "cyan")}：恒循环图跑到 recursionLimit=${RECURSION_LIMIT} 抛 ${color(errName, "red")}（= 图版的 maxSteps，防无限循环烧资源）`);

  // ── 图3：Send 扇出（map-reduce）────────────────────────────────────────────
  divider("3) Send 扇出：一批项动态分发给 worker 并行实例（map），再 reduce 汇总");
  const g3 = buildFanoutGraph();
  const r3 = await g3.invoke({ items: FANOUT_ITEMS });
  console.log(`  扇出 ${FANOUT_ITEMS.length} 项 ${JSON.stringify(FANOUT_ITEMS)} → 每个 worker 翻倍 → results ${color(JSON.stringify([...r3.results].sort((a, b) => a - b)), "green")}`);
  console.log(`  reduce 汇总 total = ${color(String(r3.total), "green")}`);

  // ⑤ 扇出 N 项 → N 个 worker 实例（每项一个）。
  invariant(r3.results.length === FANOUT_ITEMS.length, "Send 应为每项生成一个 worker 实例");
  console.log(`  ⑤ ${color("动态扇出", "cyan")}：${FANOUT_ITEMS.length} 项 → ${r3.results.length} 个 worker 结果（每项一个并行实例）`);

  // ⑥ reduce 求和正确，且与 worker 完成顺序无关（reducer 合并的好处）。
  const expectedTotal = FANOUT_ITEMS.reduce((s, x) => s + x * 2, 0);
  invariant(r3.total === expectedTotal, "reduce 汇总应等于各项翻倍之和");
  console.log(`  ⑥ ${color("顺序无关汇总", "cyan")}：total=${r3.total} = Σ(item×2)（append reducer 合并，与 worker 完成顺序无关）`);

  divider("一句话总结");
  logger.success(
    "addConditionalEdges 让图在运行时自己决定走向：指回自己=循环（ReAct 骨架）、按 State 选 handler=分支、返回一组 Send=扇出(map-reduce)；recursionLimit 是兜底安全阀。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
