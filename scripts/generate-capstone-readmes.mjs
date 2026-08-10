import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPSTONE_PROJECTS } from "../capstone/project-catalog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 这些项目拥有真实 CLI/源码，不属于 20 个 catalog blueprint；单独维护，避免
// catalog generator 覆盖它们的手写 README。
const RUNNABLE_CAPSTONES = [
  { slug: "deep-research-agent", title: "Deep Research Agent", domain: "综合研究", difficulty: "⭐⭐⭐⭐", duration: "6-10 小时" },
  { slug: "support-copilot", title: "客服 Copilot", domain: "服务运营", difficulty: "⭐⭐⭐⭐", duration: "3-4 小时" },
  { slug: "code-review-crew", title: "代码评审团", domain: "研发效率", difficulty: "⭐⭐⭐", duration: "2-3 小时" },
  { slug: "agent-eval-harness", title: "Agent 评测与回归门", domain: "质量工程", difficulty: "⭐⭐⭐", duration: "2-3 小时" },
  { slug: "mini-agent-harness", title: "Mini Agent Harness", domain: "Agent Runtime", difficulty: "⭐⭐⭐⭐⭐", duration: "8-12 小时" },
  { slug: "incident-responder", title: "告警响应 Agent", domain: "运维实战", difficulty: "⭐⭐⭐⭐", duration: "3-4 小时" },
  { slug: "feedback-intelligence", title: "用户反馈洞察 Agent", domain: "产品实战", difficulty: "⭐⭐⭐", duration: "3-4 小时" },
  { slug: "sales-lead-researcher", title: "销售线索研究 Agent", domain: "增长实战", difficulty: "⭐⭐⭐", duration: "3-4 小时" },
  { slug: "enterprise-knowledge-base-agent", title: "企业知识库 Agent", domain: "纵向全栈", difficulty: "⭐⭐⭐⭐⭐", duration: "4 周" },
];

function checkboxLines(items) {
  return items.map((item) => `- [ ] ${item}`);
}

function bulletLines(items) {
  return items.map((item) => `- ${item}`);
}

function numberedLines(items) {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

function buildReadme(project) {
  const lines = [
    `# 毕业项目 · ${project.title}`,
    "",
    `> 所属阶段：**毕业项目 · ${project.domain}实战**`,
    `> 预计用时：${project.duration} | 难度：${project.difficulty}`,
    "> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)",
    "",
    project.scenario,
    "",
    `> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。`,
    "",
    "## 最终交付",
    "",
    ...checkboxLines([
      project.outcome,
      "一组可复现 fixture，覆盖正常、边界和高风险样例。",
      "一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。",
      "一套验收清单，可直接转成 smoke/eval 测试。",
      "一段作品集/简历话术和面试追问准备。",
    ]),
    "",
    "## 适用角色",
    "",
    ...bulletLines(project.users),
    "",
    "## 核心流程",
    "",
    "```text",
    ...project.workflow.map((step, index) => `${index === 0 ? "" : "  -> "}${step}`),
    "```",
    "",
    "## 数据与接口",
    "",
    "| 模块 | 职责 |",
    "|------|------|",
    ...project.modules.map((moduleName) => `| \`${moduleName}\` | ${moduleName} 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |`),
    "",
    "建议 fixture：",
    "",
    ...bulletLines(project.fixtures.map((fixture) => `\`${fixture}\``)),
    "",
    "最小输出契约：",
    "",
    "```ts",
    "type CapstoneResult = {",
    "  status: \"ok\" | \"needs_review\" | \"blocked\";",
    "  summary: string;",
    "  evidence: Array<{ source: string; quote: string; confidence: \"low\" | \"medium\" | \"high\" }>;",
    "  actions: Array<{ owner: string; nextStep: string; due?: string; requiresApproval: boolean }>;",
    "  risks: Array<{ level: \"low\" | \"medium\" | \"high\"; reason: string }>;",
    "};",
    "```",
    "",
    "## 护栏与人工确认",
    "",
    ...bulletLines(project.guardrails),
    "",
    "## 里程碑",
    "",
    ...numberedLines(project.milestones),
    "",
    "## 验收清单",
    "",
    ...checkboxLines(project.tests),
    "",
    "## 可扩展方向",
    "",
    ...bulletLines(project.extensions),
    "",
    "## 如何写进简历",
    "",
    `> ${project.resume}`,
    "",
    "## 面试追问",
    "",
    ...numberedLines(project.interview),
    "",
    "<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->",
    "",
    "## 知识图谱与延伸阅读",
    "",
    "> 首次生成后由 `pnpm kg` 自动维护。本标记区请勿手改。",
    "",
    "<!-- KG:END -->",
    "",
  ];

  return lines.join("\n");
}

function buildHub() {
  const totalCapstones = RUNNABLE_CAPSTONES.length + CAPSTONE_PROJECTS.length;
  const lines = [
    "# 毕业项目总览",
    "",
    `这里集中管理课程的 ${totalCapstones} 个作品集项目：9 个可运行综合项目，加上覆盖协作、法务、数据、HR、售前、医疗运营、安全、合规、研发效率、质量、客户成功、电商、教育、招聘、科研、供应链、现场服务和隐私合规的 20 个领域项目蓝图。`,
    "",
    "可运行项目提供源码、CLI 与 smoke；领域项目按统一交付规格组织：最终交付、核心流程、数据与接口、护栏、里程碑、验收清单、扩展方向、简历话术和面试追问。",
    "",
    "## 可运行综合项目",
    "",
    "| # | 项目 | 领域 | 难度 | 预计用时 |",
    "|---|------|------|------|----------|",
    ...RUNNABLE_CAPSTONES.map((project, index) => `| ${index + 1} | [${project.title}](./${project.slug}/README.md) | ${project.domain} | ${project.difficulty} | ${project.duration} |`),
    "",
    "## 领域项目蓝图（20 个）",
    "",
    "| # | 项目 | 领域 | 难度 | 预计用时 |",
    "|---|------|------|------|----------|",
    ...CAPSTONE_PROJECTS.map((project, index) => `| ${index + 1} | [${project.title}](./${project.slug}/README.md) | ${project.domain} | ${project.difficulty} | ${project.duration} |`),
    "",
    "## 选题覆盖",
    "",
    "- 业务前台：RFP、客户成功、电商、招聘、学习教练。",
    "- 企业中台：合同、合规、财务、隐私请求、数据质量。",
    "- 研发与安全：开发者入仓、测试生成、安全分诊、供应链风险。",
    "- 运营交付：会议行动项、入职教练、现场服务调度、临床 intake、科研申请。",
    "",
    "## 使用方式",
    "",
    "1. 先选一个与你目标岗位最接近的项目。",
    "2. 用 README 的里程碑拆任务，先离线跑通 fixture。",
    "3. 把验收清单转成 smoke/eval，再接真实数据源。",
    "4. 最后把简历话术和面试追问补成作品集说明。",
    "",
  ];

  return lines.join("\n");
}

for (const project of CAPSTONE_PROJECTS) {
  const dir = join(ROOT, "capstone", project.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "README.md"), buildReadme(project), "utf8");
}

writeFileSync(join(ROOT, "capstone", "README.md"), buildHub(), "utf8");

console.log(`generated ${CAPSTONE_PROJECTS.length} capstone project READMEs`);
