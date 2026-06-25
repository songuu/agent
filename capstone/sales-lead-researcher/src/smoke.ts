/**
 * 离线冒烟测试：断言 ICP 评分、优先级排序、合规脱敏与下一步动作。
 *
 * 运行：pnpm sales-lead-researcher:smoke
 */
import { researchLeads } from "./researcher";
import { LEADS } from "./scenario";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

const briefs = researchLeads(LEADS);
const [top] = briefs;
const education = briefs.find((brief) => brief.id === "lead-002");

check("应产出 3 个 lead brief", briefs.length === 3);
check("最高优先级应为北辰制造", top?.name === "北辰制造");
check("北辰制造应为 priority", top?.qualification === "priority");
check("最高 lead talk track 应包含 PoC", /PoC/.test(top?.talkTrack ?? ""));
check("教育线索手机号应脱敏", education?.safeContactNote.includes("138****1234") === true);
check("合规风险应扣分", (education?.score.risk ?? 0) >= 12);
check("每条 brief 应有 next action", briefs.every((brief) => brief.nextAction.length > 0));
check("排序应按 total 降序", briefs.every((brief, index) => index === 0 || briefs[index - 1]!.score.total >= brief.score.total));

if (failures.length > 0) {
  console.error(`❌ sales-lead-researcher smoke 失败 ${failures.length} 项：`);
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}

console.log(`✅ sales-lead-researcher smoke 全绿：top ${top?.name} / ${top?.qualification} / score ${top?.score.total}`);
