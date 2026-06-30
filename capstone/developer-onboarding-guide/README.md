# 毕业项目 · 开发者入仓引导 Agent

> 所属阶段：**毕业项目 · 研发效率实战**
> 预计用时：3-4 小时 | 难度：⭐⭐⭐☆☆
> 全局导航：[课程导航](../../docs/navigation.md) · [完整大纲](../../docs/curriculum.md) · [毕业项目总览](../README.md) · [知识图谱](../../docs/knowledge-graph.md)

把仓库结构、脚本、架构文档和最近 PR 总结成新人可执行的第一周上手路线。

> 离线、零 key 可设计与验证：实现时先用 fixture 和确定性规则跑通端到端闭环。真实接入时，把 fixture 替换成业务系统数据源，把规则模块替换成可配置策略或模型调用，输出契约保持不变。

## 最终交付

- [ ] 一个 repo onboarding 工作流，输出环境检查、关键目录、首个任务、代码阅读路径和风险提醒。
- [ ] 一组可复现 fixture，覆盖正常、边界和高风险样例。
- [ ] 一个分层 Agent 设计：输入归一、决策、工具/检索、人工确认、报告输出。
- [ ] 一套验收清单，可直接转成 smoke/eval 测试。
- [ ] 一段作品集/简历话术和面试追问准备。

## 适用角色

- 新加入工程师
- Tech Lead
- 平台团队

## 核心流程

```text
扫描仓库清单
  -> 识别脚本和入口
  -> 提取架构文档
  -> 生成阅读路径
  -> 推荐首个小任务
  -> 输出环境检查清单
```

## 数据与接口

| 模块 | 职责 |
|------|------|
| `RepoScanner` | RepoScanner 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ScriptInventory` | ScriptInventory 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ArchitectureDocLinker` | ArchitectureDocLinker 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `ReadingPathBuilder` | ReadingPathBuilder 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |
| `FirstTaskRecommender` | FirstTaskRecommender 负责本流程中的一个稳定边界，便于替换为真实 API 或数据库实现。 |

建议 fixture：

- `repo-tree.txt`
- `package-scripts.json`
- `architecture.md`
- `recent-prs.json`

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

- 不读取 secrets
- 不建议破坏性命令
- 脚本说明必须来自真实 package/config
- 未知架构不硬编

## 里程碑

1. M0 仓库扫描和脚本索引
2. M1 阅读路径和任务推荐
3. M2 环境检查和 onboarding 报告

## 验收清单

- [ ] secret 文件被跳过
- [ ] 未知脚本不出现
- [ ] 阅读路径包含入口文件
- [ ] 首任务风险为低
- [ ] 缺架构文档给出缺口
- [ ] 命令带 dry-run 优先

## 可扩展方向

- 接 GitHub PR/issue
- 生成导师 check-in 问题
- 按岗位生成路线
- 更新 AGENTS.md 建议

## 如何写进简历

> 实现开发者入仓引导 Agent：扫描仓库结构、脚本、架构文档和 PR，生成新人第一周阅读路径、环境检查和低风险首任务。

## 面试追问

1. 为什么 onboarding Agent 不能靠猜脚本？
2. 如何避免读取 secrets？
3. 首个任务如何控制风险？
4. 如何让路线随仓库变化更新？

<!-- KG:START (由 npm run kg 自动生成，勿手改本标记区) -->

## 知识图谱与延伸阅读

> 本节由 `npm run kg` 自动生成（数据源 `knowledge-graph/data/graph.ts`）。要增删请改数据源后重跑。

### 本章概念图谱

> 节点：**橙框**=本章概念，蓝框=关联的其他章概念。连线按关系类型着色：前置(蓝) · 深化(紫) · 对比(玫红) · 应用(绿) · 组成(橙)。

```mermaid
graph LR
  classDef own fill:#fff7ed,stroke:#ea580c,stroke-width:3px,color:#7c2d12;
  classDef cross fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#312e81;
  n_cp_developer_onboarding_guide_workflow["仓库入口扫描"]
  n_cp_developer_onboarding_guide_quality["脚本事实索引"]
  n_cp_developer_onboarding_guide_handoff["低风险首任务"]
  n_cp_developer_onboarding_guide_workflow -->|前置| n_cp_developer_onboarding_guide_quality
  n_cp_developer_onboarding_guide_quality -->|前置| n_cp_developer_onboarding_guide_handoff
  class n_cp_developer_onboarding_guide_workflow,n_cp_developer_onboarding_guide_quality,n_cp_developer_onboarding_guide_handoff own;
  linkStyle 0 stroke:#2563eb,stroke-width:2px;
  linkStyle 1 stroke:#2563eb,stroke-width:2px;
```

### 延伸阅读

_暂无（可在 `graph.ts` 的 `ARTICLES` 中新增本章关联文章）。_

> 🗺️ 在[全局知识图谱](../../docs/knowledge-graph.md) / [交互式图谱](../../knowledge-graph/output/index.html) 中查看本章位置。

<!-- KG:END -->
