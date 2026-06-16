/**
 * 命令行入口：跑固定演示剧本，逐轮播报「用户 → 意图 → 回复 → 安全/审批/引用」，结尾打印成本。
 *
 * 运行：
 *   pnpm support-copilot
 *   npx tsx capstone/support-copilot/src/cli.ts
 *
 * 全程离线、零 key、确定可回归——把规则策略换成真 LLM 即可上真实业务（见 README）。
 */
import { divider } from "../../../src/shared/util/ui";
import { runScriptedSession } from "./scenario";

async function main(): Promise<void> {
  console.log("🎧 智能客服 Copilot · 离线演示\n");
  const { records, copilot } = await runScriptedSession();

  for (const rec of records) {
    divider(`第 ${rec.turn} 轮 · ${rec.note}`);
    console.log(`👤 用户：${rec.user}`);
    console.log(`🧭 意图：${rec.result.intent}`);
    if (rec.result.securityFlags.length > 0) {
      console.log(`🛡️  安全拦截：${rec.result.securityFlags.join(" / ")}`);
    }
    if (rec.approvedAndRetried) {
      console.log("✅ 人工审批已通过（HITL），重发放行");
    }
    console.log(`🤖 客服：${rec.result.reply}`);
  }

  divider("成本与可观测");
  const t = copilot.tracer;
  console.log(`工具调用：${t.toolCalls} 次 ${JSON.stringify(t.toolBreakdown)}`);
  console.log(`估算 token：输入 ${t.inputTokens} / 输出 ${t.outputTokens}`);
  console.log(`估算成本：$${t.costUsd().toFixed(6)}`);
}

main().catch((err) => {
  console.error("运行失败：", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
