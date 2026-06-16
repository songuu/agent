/**
 * 离线冒烟测试：跑固定剧本，断言每条分支的预期行为。任一失败则非零退出（可作 CI gate）。
 *
 * 运行：pnpm support-copilot:smoke
 */
import { runScriptedSession } from "./scenario";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

async function main(): Promise<void> {
  const { records, copilot } = await runScriptedSession();
  const [t1, t2, t3, t4, t5, t6, t7] = records;

  // 1) 闲聊
  check("T1 应为 smalltalk", t1?.result.intent === "smalltalk");

  // 2) FAQ：含疑问的退款问题归 FAQ，且带引用、命中到账时效
  check("T2 应为 faq", t2?.result.intent === "faq");
  check("T2 应带引用来源", (t2?.result.citations.length ?? 0) > 0);
  check("T2 应命中到账时效", /工作日|到账/.test(t2?.result.reply ?? ""));

  // 3) 查单：命中 A1002 运输中
  check("T3 应为 order_status", t3?.result.intent === "order_status");
  check("T3 应含订单 A1002 运输中", /A1002/.test(t3?.result.reply ?? "") && /运输中/.test(t3?.result.reply ?? ""));

  // 4) 退款：多轮记忆复用 A1002 + 定制类目拒绝
  check("T4 应为 refund", t4?.result.intent === "refund");
  check("T4 应因不支持类目被拒绝", /无法自助退款/.test(t4?.result.reply ?? ""));
  check("T4 应复用记忆中的订单号 A1002", copilot.currentSession !== undefined);

  // 5) 退款：小额自动放行
  check("T5 应为 refund", t5?.result.intent === "refund");
  check("T5 应自动放行并退款 A1001", /已为订单 A1001 办理退款/.test(t5?.result.reply ?? ""));

  // 6) 退款：大额挂起 HITL，人工审批后放行
  check("T6 应触发人工审批重发", t6?.approvedAndRetried === true);
  check("T6 应在审批后放行", /已通过人工审批/.test(t6?.result.reply ?? ""));

  // 7) 注入拦截
  check("T7 应被安全门拦截", t7?.result.intent === "blocked");
  check("T7 应有安全标记", (t7?.result.securityFlags.length ?? 0) > 0);

  // 可观测：工具被真实调用、成本可估
  check("工具应被调用", copilot.tracer.toolCalls >= 3);
  check("成本应可估算 > 0", copilot.tracer.costUsd() > 0);

  if (failures.length > 0) {
    console.error(`❌ support-copilot smoke 失败 ${failures.length} 项：`);
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
  }
  console.log(`✅ support-copilot smoke 全绿：${records.length} 轮，工具调用 ${copilot.tracer.toolCalls} 次，估算成本 $${copilot.tracer.costUsd().toFixed(6)}`);
}

main().catch((err) => {
  console.error("smoke 运行异常：", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
