# 增加实践型毕业项目

日期：2026-06-25

## 目标

增加更多实践性质很强的毕业项目，覆盖真实工作场景，并保持离线可跑、可验证、可写入作品集。

## 范围

- 新增告警响应 Agent：从告警、日志、指标和 runbook 生成分级处置建议、审批边界、客户沟通和复盘清单。
- 新增用户反馈洞察 Agent：从多渠道反馈中做注入隔离、PII 脱敏、主题聚类、价值加权和 roadmap ticket。
- 新增销售线索研究 Agent：从 CRM、网站、招聘和新闻信号中做 ICP 评分、风险提示、销售话术和下一步动作。
- 更新课程入口、导航、学习路线、知识图谱和 package 脚本。

## 风险评估

测试等级：L2 标准。

原因：新增多个可运行 TypeScript 项目和课程索引，涉及运行入口、smoke 断言、知识图谱生成和文档导航，但不触碰生产数据、认证、支付或远端写入。

## 执行记录

- 新增 `capstone/incident-responder`，包含场景数据、处置引擎、CLI、smoke 和 README。
- 新增 `capstone/feedback-intelligence`，包含场景数据、洞察引擎、CLI、smoke 和 README。
- 新增 `capstone/sales-lead-researcher`，包含场景数据、研究引擎、CLI、smoke 和 README。
- 更新 `package.json`，加入 3 个项目的运行脚本和 smoke 脚本，并纳入 `pnpm capstone:smoke`。
- 更新 `knowledge-graph/data/graph.ts`，为 3 个新毕业项目补齐章节、概念和关系。
- 更新 `docs/curriculum.md`、`docs/navigation.md`、`docs/agent-learning-guides.md`、`README.md`、`index.md` 和生成后的知识图谱页面。

## 验证

- `pnpm incident-responder:smoke`：通过。
- `pnpm feedback-intelligence:smoke`：通过。
- `pnpm sales-lead-researcher:smoke`：通过。
- `pnpm capstone:smoke`：通过。
- `pnpm typecheck`：通过。
- `pnpm kg`：通过，生成 44 单元 / 257 概念 / 402 关系 / 151 文章，并完成 11 个 README 的知识图谱注入。

## 说明

沙盒内运行 `tsx` 时遇到 `spawn EPERM`，按当前 Windows 环境已知限制处理；使用已批准的 PowerShell 命令重跑后通过。当前工作区存在用户既有未提交改动，本次未做 revert、stage 或 commit。