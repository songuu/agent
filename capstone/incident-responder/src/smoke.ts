/**
 * 离线冒烟测试：断言告警分级、根因定位、runbook 选择、审批边界与复盘清单。
 *
 * 运行：pnpm incident-responder:smoke
 */
import { CHECKOUT_INCIDENT } from "./scenario";
import { runIncidentResponder } from "./responder";

const failures: string[] = [];
function check(label: string, cond: boolean): void {
  if (!cond) failures.push(label);
}

const report = runIncidentResponder(CHECKOUT_INCIDENT);

check("应判定为 SEV1", report.severity === "SEV1");
check("应选择数据库连接池 runbook", report.selectedRunbook === "rb-db-pool");
check("根因应包含连接池耗尽", /连接池耗尽/.test(report.diagnosis.rootCause));
check("证据应包含 checkout-api timeout", report.diagnosis.evidence.some((item) => /checkout-api.*timeout/i.test(item)));
check("应生成至少 3 个处置动作", report.actions.length >= 3);
check("高风险动作必须审批", report.actions.some((action) => action.status === "approval-required"));
check("安全动作可直接执行", report.actions.some((action) => action.status === "ready"));
check("客户话术应避免技术细节泄漏", !/Sequelize|sha|pool max/.test(report.customerMessage));
check("复盘清单应覆盖告警与压测", report.postmortemChecklist.some((item) => /压测/.test(item)));
check("token 成本应可估算", report.estimatedCostTokens > 0);

if (failures.length > 0) {
  console.error(`❌ incident-responder smoke 失败 ${failures.length} 项：`);
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}

console.log(`✅ incident-responder smoke 全绿：${report.severity} / ${report.selectedRunbook} / actions ${report.actions.length}`);
