/**
 * 进阶 LangGraph · 第 01 章 demo：手写 StateGraph —— 揭开 createReactAgent 的盖子
 *
 * 这个 demo 演示什么？
 *   lesson 12 用的是预制 `createReactAgent`（一张已编译好的图）。这里我们【手写】一张 StateGraph：
 *     State（带 reducer 的 channels）+ 三个纯函数节点 + 线性边（START→normalize→tokenize→count→END）。
 *   全程【离线、零 LLM、零随机】——节点就是纯函数，所以图的输出完全确定、可单测、可回归。
 *
 * 三个核心结论由【构造保证】，用 invariant() 运行时硬核对，绝不写死：
 *   ① channel 的 reducer 决定「多次写入如何合并」：同样三个节点，append reducer 累积出 3 步轨迹，
 *      replace reducer 只剩最后 1 步。
 *   ② 节点返回的是 partial 更新（只写它碰的 channel）；没碰的 channel 由上一状态自动保留
 *      （count 节点没写 text/tokens，终态里它们依然在）。
 *   ③ 纯函数节点 ⇒ 完全确定：同输入两次 invoke，结果逐字节相等。
 *
 * 运行：npx tsx langgraph-advanced/01-stategraph-basics/index.ts
 */
import { buildTextPipeline } from "../../src/shared/langgraph";
import { divider, logger, color } from "../../src/shared";

/** 运行时断言：构造保证的结论必须真成立，否则 demo 失败（防止教学结论悄悄腐烂）。 */
function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

const INPUT = { text: "  The CAT sat on   the Mat the cat  " };

async function main(): Promise<void> {
  divider("0) 手写一张 StateGraph：START → normalize → tokenize → count → END");
  logger.info("State 有 4 个 channel：text / steps / tokens / topWord，每个 channel 自带 reducer（决定写入如何合并）。");
  logger.info("三个节点都是【普通函数】：读 state、返回它要更新的 channel（partial 更新）。无 LLM、无 key。");

  const graph = buildTextPipeline({ accumulateSteps: true });

  // ── 用 stream("updates") 看每个节点吐出的 partial 更新 ───────────────────────────
  divider("1) 逐节点看「partial 更新」：每个节点只吐它碰的 channel");
  for await (const chunk of await graph.stream(INPUT, { streamMode: "updates" })) {
    for (const [node, update] of Object.entries(chunk as Record<string, unknown>)) {
      console.log(`  节点 ${color(node, "cyan")} 吐出 → ${color(JSON.stringify(update), "gray")}`);
    }
  }

  const final = await graph.invoke(INPUT);
  divider("2) 终态：图把 partial 更新沿边累积成完整 State");
  console.log(`  text   = ${color(JSON.stringify(final.text), "green")}`);
  console.log(`  tokens = ${color(JSON.stringify(final.tokens), "green")}`);
  console.log(`  topWord= ${color(JSON.stringify(final.topWord), "green")}`);
  console.log(`  steps  = ${color(JSON.stringify(final.steps), "green")}`);

  // ── ① reducer 决定合并语义：append vs replace ───────────────────────────────────
  divider("3) 结论核对（运行时判定，不写死）");
  const replaceGraph = buildTextPipeline({ accumulateSteps: false });
  const replaceFinal = await replaceGraph.invoke(INPUT);
  invariant(
    JSON.stringify(final.steps) === JSON.stringify(["normalize", "tokenize", "count"]),
    "append reducer 应累积全部三步",
  );
  invariant(
    JSON.stringify(replaceFinal.steps) === JSON.stringify(["count"]),
    "replace reducer 应只剩最后一步",
  );
  console.log(
    `  ① ${color("reducer 决定合并", "cyan")}：同样三个节点，append → steps=${color(JSON.stringify(final.steps), "green")}；replace → steps=${color(JSON.stringify(replaceFinal.steps), "red")}`,
  );

  // ── ② partial 更新持久化：count 没写 text/tokens，终态仍保留 ─────────────────────
  invariant(
    final.text.length > 0 && final.tokens.length > 0,
    "count 节点没写 text/tokens，但它们应被自动保留",
  );
  console.log(
    `  ② ${color("partial 更新持久化", "cyan")}：count 只返回 {topWord, steps}，但终态仍有 text/tokens（没碰的 channel 由上一状态保留）`,
  );

  // ── ③ 纯函数节点 ⇒ 完全确定 ─────────────────────────────────────────────────────
  const again = await graph.invoke(INPUT);
  invariant(JSON.stringify(again) === JSON.stringify(final), "同输入两次 invoke 结果应逐字节相等");
  console.log(`  ③ ${color("确定可复现", "cyan")}：同输入两次 invoke，终态逐字节相等（纯函数节点、无 LLM、无随机）`);

  // ── ④ topWord 真是词频最高（现场重算核对，构造对本输入为真）─────────────────────
  const freq = new Map<string, number>();
  for (const t of final.tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const maxCount = Math.max(...freq.values());
  invariant((freq.get(final.topWord) ?? 0) === maxCount, "topWord 应是词频最高的词");
  console.log(`  ④ ${color("topWord 经现场重算核对", "cyan")}：「${final.topWord}」出现 ${maxCount} 次，确为最高频`);

  divider("一句话总结");
  logger.success(
    "StateGraph = 带 reducer 的共享 State + 返回 partial 更新的函数节点 + 边。createReactAgent 只是其上预制了 messages channel(append) + 模型节点 + 工具节点 + 循环边——本章把这套机制手写了一遍。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
