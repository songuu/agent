# 毕业项目 · 招聘初筛 Agent

> 所属阶段：**毕业项目 · 招聘运营实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐⭐☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把 JD、简历、面试题库和合规要求转成结构化初筛，帮助招聘团队提升一致性。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个招聘初筛工作流，输出岗位匹配证据、缺口、面试问题和人工复核队列。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 招聘专员
- Hiring Manager
- 面试官

## 核心流程

```text
解析 JD 能力项
  -> 抽取简历证据
  -> 匹配必须/加分项
  -> 识别缺口
  -> 生成面试问题
  -> 进入人工复核
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `JobRequirementParser` | JobRequirementParser 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ResumeEvidenceExtractor` | ResumeEvidenceExtractor 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `SkillMatcher` | SkillMatcher 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `InterviewQuestionBuilder` | InterviewQuestionBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `FairnessReviewQueue` | FairnessReviewQueue 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `job-description.md`
- `resumes.json`
- `question-bank.json`
- `screening-policy.md`

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

- 不使用年龄、性别等受保护属性
- 不自动淘汰候选人
- 所有匹配必须有简历证据
- 缺证据和不匹配分开

## 里程碑

1. M0 JD 和简历结构化
2. M1 技能匹配和缺口
3. M2 面试问题和人工复核

## 验收清单

- [ ] 必须项缺失被标记
- [ ] 加分项不当成必须项
- [ ] 受保护属性被忽略
- [ ] 无证据不打分
- [ ] 问题与缺口对应
- [ ] 人工复核队列生成

## 可扩展方向

- 接 ATS 导出
- 生成面试评分表
- 按岗位族维护 rubrics
- 用已录用反馈校准权重

## 如何写进简历

> 实现招聘初筛 Agent：解析 JD 和简历证据，生成技能匹配、缺口、面试问题与公平性人工复核队列。

## 面试追问

1. 为什么不能自动淘汰候选人？
2. 受保护属性如何过滤？
3. 缺证据和不具备能力有什么区别？
4. 如何让初筛标准可审计？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_recruiting_screener_workflow["JD 能力项解析"]
  n_cp_recruiting_screener_quality["简历证据匹配"]
  n_cp_recruiting_screener_handoff["公平性复核队列"]
  n_cp_recruiting_screener_workflow -->|前置| n_cp_recruiting_screener_quality
  n_cp_recruiting_screener_quality -->|前置| n_cp_recruiting_screener_handoff
  class n_cp_recruiting_screener_workflow,n_cp_recruiting_screener_quality,n_cp_recruiting_screener_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
