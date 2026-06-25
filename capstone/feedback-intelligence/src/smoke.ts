/**
 * 离线冒烟测试：断言注入隔离、PII 脱敏、主题聚类、权重排序与 roadmap 产物。
 *
 * 运行：pnpm feedback-intelligence:smoke
 */
import { analyzeFeedback } from "./intelligence";
import { FEEDBACK_BATCH } from "./scenario";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

const report = analyzeFeedback(FEEDBACK_BATCH);
const topTheme = report.themes[0];

check("应处理 6 条反馈", report.total === 6);
check("提示注入反馈应被隔离", report.quarantined.includes("fb-004"));
check("隔离反馈不应进入主题样本", report.themes.every((theme) => !theme.sampleIds.includes("fb-004")));
check("邮箱应脱敏", report.sanitizedItems.some((item) => item.sanitizedText.includes("f***@acme.example")));
check("手机号应脱敏", report.sanitizedItems.some((item) => item.sanitizedText.includes("138****1234")));
check("最高优先级应为账单与审计导出", topTheme?.id === "billing-export");
check("最高主题应覆盖 3 条样本", topTheme?.count === 3);
check("roadmap ticket 应含 owner", report.roadmapTickets.some((ticket) => ticket.startsWith("[platform]")));
check("应保留 Slack 集成主题", report.themes.some((theme) => theme.id === "integrations"));

if (failures.length > 0) {
  console.error(`❌ feedback-intelligence smoke 失败 ${failures.length} 项：`);
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}

console.log(`✅ feedback-intelligence smoke 全绿：themes ${report.themes.length} / top ${topTheme?.label}`);
