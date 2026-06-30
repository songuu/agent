# 毕业项目 · 安全告警分诊 Agent

> 所属阶段：**毕业项目 · 安全运营实战**
> 预计用时：4-6 小时 | 难度：⭐⭐⭐⭐⭐
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把 SIEM 告警、资产信息、身份日志和威胁情报变成可审计分诊，帮助 SOC 降低噪音和漏报。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个安全分诊工作流，输出严重度、攻击链阶段、证据、误报理由、containment 建议和升级队列。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- SOC 分析师
- 安全负责人
- IT 运维

## 核心流程

```text
读取告警批次
  -> 关联资产和身份
  -> 匹配攻击模式
  -> 计算严重度
  -> 区分误报/真阳性
  -> 生成 containment 建议
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `AlertNormalizer` | AlertNormalizer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `AssetContextJoiner` | AssetContextJoiner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ThreatPatternMatcher` | ThreatPatternMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SeverityScorer` | SeverityScorer 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ContainmentAdvisor` | ContainmentAdvisor 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `siem-alerts.json`
- `asset-inventory.json`
- `identity-events.json`
- `threat-patterns.json`

最小输出契约：

```ts
type CapstoneResult = {
  status: "ok" | "needs_review" | "blocked";
  summary: string;
  evidence: Array<{ source: string; quote: string; confidence: "low" | "medium" | "high" }>;
  actions: Array<{ owner: string; nextStep: string; due?: string; requiresApproval: boolean }>;
  risks: Array<{ level: "low" | "medium" | "high"; reason: string }>;
};
```

## 护栏与人工确认

- 不自动隔离生产资产
- containment 动作必须按风险分级
- 证据不足时标记 inconclusive
- 敏感账号只展示最小必要字段

## 里程碑

1. M0 告警归一和上下文关联
2. M1 攻击模式和严重度
3. M2 分诊报告和 containment 队列

## 验收清单

- [ ] 高危资产提高严重度
- [ ] 已知误报被解释
- [ ] 多事件合并成一个 incident
- [ ] 证据不足不强判
- [ ] 隔离动作需审批
- [ ] 账号字段脱敏

## 可扩展方向

- 接 Sigma/YARA 规则
- 同步工单系统
- 生成 timeline 图
- 把复盘结果回写规则调优

## 如何写进简历

> 实现安全告警分诊 Agent：关联 SIEM、资产、身份和威胁模式，输出严重度、证据链、误报解释、containment 建议和人工升级队列。

## 面试追问

1. 如何避免安全 Agent 放大误报？
2. containment 为什么必须审批？
3. 资产重要性如何影响严重度？
4. 证据不足时应该怎么输出？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_security_triage_analyst_workflow["SIEM 告警关联"]
  n_cp_security_triage_analyst_quality["攻击链严重度"]
  n_cp_security_triage_analyst_handoff["Containment 审批队列"]
  n_cp_security_triage_analyst_workflow -->|前置| n_cp_security_triage_analyst_quality
  n_cp_security_triage_analyst_quality -->|前置| n_cp_security_triage_analyst_handoff
  class n_cp_security_triage_analyst_workflow,n_cp_security_triage_analyst_quality,n_cp_security_triage_analyst_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
