# 毕业项目 · 新员工入职教练 Agent

> 所属阶段：**毕业项目 · HR 与团队运营实战**
> 预计用时：2-3 小时 | 难度：⭐⭐⭐☆☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把入职手册、团队制度、岗位清单和学习任务转成个性化 30/60/90 天计划，帮助新人尽快进入工作流。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个入职教练工作流，输出学习路径、任务节奏、导师检查点和风险提醒。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- HRBP
- 团队导师
- 新员工

## 核心流程

```text
读取岗位画像
  -> 匹配入职材料
  -> 生成阶段计划
  -> 安排导师检查点
  -> 识别阻塞风险
  -> 输出周报模板
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `RoleProfileLoader` | RoleProfileLoader 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `PolicyRetriever` | PolicyRetriever 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `PlanBuilder` | PlanBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `MentorCheckpointPlanner` | MentorCheckpointPlanner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ProgressReporter` | ProgressReporter 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `role-profile.json`
- `employee-handbook.md`
- `team-checklist.json`
- `mentor-notes.json`

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

- 不推断敏感个人特征
- 绩效结论必须由人确认
- 资料过期时标记待更新
- 计划必须允许人工覆盖

## 里程碑

1. M0 岗位画像和资料匹配
2. M1 30/60/90 天计划生成
3. M2 导师检查和周报闭环

## 验收清单

- [ ] 岗位缺失时报错
- [ ] 过期制度被标记
- [ ] 计划含 30/60/90 三阶段
- [ ] 敏感字段不进入报告
- [ ] 导师检查点不重复
- [ ] 周报保留阻塞项

## 可扩展方向

- 接 Notion/Confluence
- 同步日历提醒
- 接 LMS 学习系统
- 用满意度反馈调整计划

## 如何写进简历

> 实现新员工入职教练 Agent：按岗位画像和团队资料生成 30/60/90 天计划、导师检查点、学习任务和风险周报。

## 面试追问

1. 入职计划如何个性化但不过度推断？
2. 过期政策如何处理？
3. 为什么绩效判断要人工确认？
4. 如何衡量入职 Agent 效果？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_onboarding_coach_agent_workflow["30/60/90 入职计划"]
  n_cp_onboarding_coach_agent_quality["导师检查点"]
  n_cp_onboarding_coach_agent_handoff["资料过期标记"]
  n_cp_onboarding_coach_agent_workflow -->|前置| n_cp_onboarding_coach_agent_quality
  n_cp_onboarding_coach_agent_quality -->|前置| n_cp_onboarding_coach_agent_handoff
  class n_cp_onboarding_coach_agent_workflow,n_cp_onboarding_coach_agent_quality,n_cp_onboarding_coach_agent_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
