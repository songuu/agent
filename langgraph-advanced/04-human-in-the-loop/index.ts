/**
 * 进阶 LangGraph · 第 04 章 demo：Human-in-the-Loop —— interrupt 暂停 + Command 续跑
 *
 * 这个 demo 演示什么？
 *   第 03 章给图加了 checkpointer（能记住状态、从中途重放）。本章在它之上让图能**停下来等人**：
 *   节点里 `interrupt(payload)` 把 payload 交给人、就地暂停整张图；人给出决定后用
 *   `invoke(new Command({ resume }), cfg)` 续跑，`interrupt()` 返回那个决定。这就是「审批门」。
 *   把「人」抽象成确定地传入的 resume 值，于是 approve / reject 两条路径完全离线确定。
 *
 * 教学结论由【构造保证】，用 invariant() 运行时硬核对，且全部【旋钮无关】（改 AMOUNT/审批词不会误报崩）：
 *   暂停在审批节点、payload 可读、批准放行、拒绝拦截、路由完全由人给的 resume 值决定；
 *   以及一个关键坑——暂停时必须用 Command 才能 resume，普通 invoke 会重跑并再次暂停。
 *
 * 运行：npx tsx langgraph-advanced/04-human-in-the-loop/index.ts
 */
import { buildApprovalGraph, readPendingInterrupt, threadConfig } from "../../src/shared/langgraph";
import { Command } from "@langchain/langgraph";
import { divider, logger, color } from "../../src/shared";

function invariant(cond: boolean, message: string): void {
  if (!cond) {
    throw new Error(`构造不变量被破坏：${message}`);
  }
}

// ── 旋钮（全确定；下面的 invariant 对任意合理取值都成立）─────────────────────────
const AMOUNT = 500; // 待审批的数额
const APPROVE_WORD = "approve"; // 视为批准的关键字
const REJECT_WORD = "reject"; // 任意非 APPROVE_WORD 的词都按拒绝处理

async function main(): Promise<void> {
  const graph = buildApprovalGraph({ approveWord: APPROVE_WORD });

  // ── ①② 暂停在审批节点 + 读取 interrupt payload ───────────────────────────────
  divider("1) interrupt：节点中途暂停，把待批数额交给人");
  const threadApprove = threadConfig("req-approve");
  const paused = await graph.invoke({ amount: AMOUNT }, threadApprove);
  const pausedSnap = await graph.getState(threadApprove);
  const payload = await readPendingInterrupt(graph, threadApprove);
  console.log(`  提交数额 ${color(String(AMOUNT), "yellow")} → 图跑到 humanReview 就${color("暂停", "red")}了：`);
  console.log(`    status=${color(paused.status, "gray")}，待执行 next=${color(JSON.stringify(pausedSnap.next), "cyan")}，轨迹=${color(JSON.stringify(paused.log), "gray")}`);
  console.log(`    交给人的 payload（从 getState().tasks[].interrupts[].value 取）：${color(JSON.stringify(payload), "green")}`);

  divider("结论核对（运行时判定，旋钮无关）");
  // ① 暂停在审批节点：状态仍 pending，next 指向 humanReview，下游(apply/cancel)都没跑。
  invariant(paused.status === "pending", "未 resume 前 status 应停在 pending");
  invariant(JSON.stringify(pausedSnap.next) === JSON.stringify(["humanReview"]), "图应暂停在 humanReview 节点");
  invariant(!paused.log.includes("apply") && !paused.log.includes("cancel"), "暂停时下游不应执行");
  console.log(`  ① ${color("中途暂停", "cyan")}：interrupt 让图停在 humanReview（next=["humanReview"]），下游 apply/cancel 都没跑——等人拍板`);

  // ② interrupt payload 可读，且就是提交给人的数额（旋钮无关：=== 输入 AMOUNT）。
  const payloadAmount = (payload as { amount?: number } | undefined)?.amount;
  invariant(payloadAmount === AMOUNT, "interrupt payload 应携带提交给人审批的数额");
  console.log(`  ② ${color("payload 可读", "cyan")}：交给人的数额 ${payloadAmount} === 提交的 ${AMOUNT}（注意：它不在 invoke 返回值顶层，要从 getState().tasks[].interrupts[].value 取）`);

  // ── ③ 批准放行 ──────────────────────────────────────────────────────────────
  divider("2) Command({ resume }) 续跑：人批准 → 放行");
  const approved = await graph.invoke(new Command({ resume: APPROVE_WORD }), threadApprove);
  const approvedSnap = await graph.getState(threadApprove);
  console.log(`  人回复「${color(APPROVE_WORD, "green")}」→ status=${color(approved.status, "green")}，轨迹=${color(JSON.stringify(approved.log), "gray")}`);
  // ③ 批准 → 走 apply，终态 applied:<amount>，图到 END。
  invariant(approved.status === `applied:${AMOUNT}`, "批准后应走 apply 写入 applied 终态");
  invariant(approved.log.includes("apply") && approved.log.includes(`review:${APPROVE_WORD}`), "批准轨迹应含 review + apply");
  invariant(approvedSnap.next.length === 0, "续跑后图应到 END");
  console.log(`  ③ ${color("批准放行", "cyan")}：resume=「${APPROVE_WORD}」→ 条件边走 apply → status=${approved.status}，next=[]（到 END）`);

  // ── ④ 拒绝拦截（另一 thread，同样的提交，不同的人为决定）──────────────────────
  divider("3) 另一笔同样的请求，人拒绝 → 拦截");
  const threadReject = threadConfig("req-reject");
  await graph.invoke({ amount: AMOUNT }, threadReject);
  const rejected = await graph.invoke(new Command({ resume: REJECT_WORD }), threadReject);
  console.log(`  人回复「${color(REJECT_WORD, "red")}」→ status=${color(rejected.status, "red")}，轨迹=${color(JSON.stringify(rejected.log), "gray")}`);
  // ④ 非批准词 → 走 cancel，终态 rejected，apply 没跑。
  invariant(rejected.status === "rejected", "拒绝后应走 cancel 写入 rejected 终态");
  invariant(!rejected.log.includes("apply") && rejected.log.includes("cancel"), "拒绝轨迹应含 cancel、不含 apply");
  console.log(`  ④ ${color("拒绝拦截", "cyan")}：resume=「${REJECT_WORD}」→ 条件边走 cancel → status=rejected，apply 从未执行`);

  // ⑤ 路由完全由人给的 resume 值决定：两条 thread 提交一样，终态相反。
  invariant(approved.status !== rejected.status, "approve 与 reject 应导向不同终态");
  console.log(`  ⑤ ${color("人决定走向", "cyan")}：两笔提交完全一样（amount=${AMOUNT}），终态相反（${approved.status} vs ${rejected.status}）——差异 100% 来自人给的 resume 值`);

  // ── ⑥ 关键坑：暂停时必须用 Command 才能 resume ──────────────────────────────
  divider("4) 易错点：暂停时用普通 invoke 不会 resume，会重跑并再次暂停");
  const threadOops = threadConfig("req-oops");
  await graph.invoke({ amount: AMOUNT }, threadOops);
  const plain = await graph.invoke({ amount: 999 }, threadOops); // 普通输入，不是 Command
  const oopsSnap = await graph.getState(threadOops);
  const proposeCount = plain.log.filter((entry) => entry.startsWith("propose")).length;
  // ⑥ 普通 invoke 不 resume：仍停在 humanReview、status 仍 pending、propose 跑了两次（重跑）。
  invariant(plain.status === "pending", "普通 invoke 不应 resume，status 仍 pending");
  invariant(JSON.stringify(oopsSnap.next) === JSON.stringify(["humanReview"]), "普通 invoke 后应仍暂停在 humanReview");
  invariant(proposeCount === 2, "普通 invoke 会从头重跑，propose 应出现两次");
  console.log(`  ⑥ ${color("必须用 Command", "cyan")}：暂停时普通 invoke({...}) 不 resume——图从头重跑(propose×${proposeCount})又停在 humanReview；只有 new Command({resume}) 能真正放行`);

  divider("一句话总结");
  logger.success(
    "interrupt(payload) 在节点中途暂停整张图并把 payload 交给人（从 getState().tasks[].interrupts[].value 取）；人用 invoke(new Command({resume}), cfg) 续跑，interrupt() 返回该值，条件边按它决定放行还是拦截——这是审批门 / 人工纠偏的底座，建立在第 03 章 checkpointer 之上。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
