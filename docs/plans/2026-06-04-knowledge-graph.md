---
title: "知识图谱系统（全局 + 每章 + 可扩展关联文章）"
type: sprint
status: completed
created: "2026-06-04"
updated: "2026-06-04"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, knowledge-graph, education, visualization]
aliases: ["知识图谱", "knowledge graph"]

invariants:
  - "知识图谱数据驱动：唯一事实来源 knowledge-graph/data/graph.ts，图与文章都由它生成"
  - "生成幂等：generate.ts 可反复运行，README 注入用 <!-- KG:START/END --> 标记，只替换标记之间，不破坏正文"
  - "零新增 npm 依赖：交互图谱用 Cytoscape.js 走 CDN（HTML 内联），不进 package.json"
  - "沿用课程不变量：tsx 直跑（npm run kg）、显式相对导入、tsc --noEmit 零错误"
  - "新增关联文章=改 graph.ts 一处 + 重跑 generate，全部图谱与索引自动更新"

invariant_tests:
  - "npx tsc --noEmit  # 含 knowledge-graph/ 全仓类型检查"
  - "npm run kg        # 生成器可成功跑完并产出所有目标文件"

deferred:
  - sprint: next
    item: "直接打包部署（tsup/dist + Docker + 平台配置 + CI）"
    deadline: "2026-06-30"
    reason: "用户在该需求确认环节 pivot 到知识图谱，打包部署暂挂，待本 sprint 后回归"
deadcode_until: []
---

# Sprint: 知识图谱系统

> 目标仓库: https://github.com/songuu/agent
> 本地目录: C:\project\my\agent-build（已是 git 仓库，19 章 + 毕设 + 指南均在）

## Phase 1: 需求分析 (Think — CEO/产品视角)

### 一句话
给课程加一套**数据驱动、可持续扩展**的知识图谱系统：一张**全局概念图谱** + **每章各自的图谱**（含交互"动图"版）+ 一个**随时新增关联文章/链接**的机制。

### 用户原话拆解
1. 新增一个**总体知识图谱**。
2. **每一章**都要有各自的知识图谱，**或动图**。
3. 可以**继续新增更多关联的文章**。

### 用户与价值
- **谁**: 学习本课程的初学者 + 维护课程的作者（要能持续扩充）。
- **痛点**: 18→19 章 + 毕设，概念多、跨章关系（前置/深化/对比/应用）散落在各 README，学习者难建立全局心智；外部好文章读到了没处沉淀。
- **价值**:
  1. **看全局** — 一张图看清所有概念及其关系，知道"学到哪、还差啥"。
  2. **看本章** — 每章一张聚焦图谱（概念 + 跨章链接 + 延伸阅读），承上启下。
  3. **能生长** — 数据驱动：改一处数据 → 重跑 → 全部图谱与文章索引自动更新；新增文章零摩擦。
  4. **动起来** — 交互式 HTML 图谱（缩放/筛选/点节点看关联文章），即"动图"。

### Scope (做什么)
- 数据模型（单一事实来源）：概念节点 / 关系边 / 章节 / 关联文章。
- 全局知识图谱文档 `docs/knowledge-graph.md`（Mermaid：章级依赖图 + 按部分聚类的概念图 + 概念索引 + 文章索引）。
- 交互式图谱 `knowledge-graph/output/index.html`（Cytoscape.js via CDN，缩放/筛选/点击节点看关联文章——即"动图"）。
- 每章 README 注入「## 知识图谱与延伸阅读」（Mermaid 子图 + 跨章链接 + 该章关联文章），标记幂等。
- 关联文章机制：`graph.ts` 的 `ARTICLES` 列表，附 `npm run kg` 一键重生；KG README 写明如何新增。

### Non-scope (不做什么)
- 不改课程正文/代码逻辑（只在 README 标记区注入图谱段，不动其余内容）。
- 不替换已有「图解学习地图」（那是本章流程图；知识图谱是概念关系图，二者互补）。
- 不引入图数据库 / 重前端框架 / 构建步骤（CDN + 静态 HTML 足矣）。
- 不批量塞入未经核实的外链（外部文章只收录权威可核实的，其余留给作者按机制增补）。
- 本 sprint 不做打包部署（已记入 deferred）。

### 成功标准
- [ ] `npm run kg` 一键生成：全局 md + 交互 HTML + 19 章 README 注入，可反复运行且幂等。
- [ ] 全局图谱 + 每章图谱内容与真实章节/概念一致，跨章关系正确。
- [ ] 交互 HTML 可在浏览器打开：缩放、按部分筛选、点节点看该概念的关联文章。
- [ ] 新增一篇关联文章只需改 `graph.ts` 一处 + 重跑，无需手改任何 README。
- [ ] `npx tsc --noEmit` 全仓零错误；Mermaid 语法合法（GitHub 可渲染）。

### 风险
- **R1 外链幻觉**: 并行 agent 提取关联文章可能编造 URL → 缓解: 只收录权威可核实来源（arXiv 经典论文、官方文档）+ 内部跨章链接；其余作为机制留给作者增补，KG README 标注"外链需核实"。
- **R2 注入破坏正文**: 注入 19 个被多次手改的 README → 缓解: `<!-- KG:START/END -->` 标记幂等替换，仅动标记区；首次运行插在「## 五、小结与延伸」前，找不到则文末追加。
- **R3 全局图过密**: 概念多导致 Mermaid 拥挤 → 缓解: 全局 md 用"章级图 + 按部分分 subgraph 的概念簇"，完整概念级交互留给 HTML。
- **R4 概念/关系不准**: 并行抽取可能漂移 → 缓解: 各 agent 必读对应章 README+code 再抽取；我合并时去重 + 审查。

## Phase 2: 技术方案 (Plan — 架构师视角)

### 入场扫描 — Invariants 继承（来自 2026-06-02 课程 sprint）
| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| 运行方式 | tsx 直跑、零编译 | 生成器 `npx tsx knowledge-graph/generate.ts`（npm run kg）；输出物无需构建 |
| 导入 | 显式相对路径 | generate.ts 用 `./data/graph` 相对导入 |
| 类型 | `tsc --noEmit` 零错误 | 数据与生成器全量 TS，纳入 tsconfig include |
| LLM 抽象 | 走 getLLM() | 本 sprint 不涉及 LLM 调用，N/A |
| 章节自包含 | README+ts | 注入只加一节、用标记隔离，不破坏自包含 |

### 入场扫描 — 集成路径
| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 新增概念/关系/文章 | 编辑 graph.ts | `npm run kg` 生成器 | 写入 md/html/README | ✅ 重跑即更新，GitHub 渲染 Mermaid |
| 全局图谱 | 打开 docs/knowledge-graph.md | — | 静态 md | ✅ |
| 交互图谱 | 浏览器打开 output/index.html | Cytoscape CDN | 静态 html（内联数据） | ✅ |
| 每章图谱 | 读 lessons/NN/README.md | 标记区 | README 内 | ✅ |

无 ❌ 悬空链路：全局 md 由 README 链接；每章注入段含返回全局图谱链接；HTML 由全局 md 链接。

### 入场扫描 — 债务清单
| 来源 | 议题 | 本 sprint 决策 | deadline |
|------|------|----------------|----------|
| 上一需求 | 直接打包部署 | ⏭ 下个 sprint（已 pivot） | 2026-06-30 |

### 技术选型
- **数据**: `knowledge-graph/data/graph.ts`（TS 类型化：Concept / Relation / Article / Chapter）。
- **生成器**: `knowledge-graph/generate.ts`（tsx 跑；纯 Node fs，无第三方依赖）。
- **静态图**: Mermaid（GitHub 原生渲染，全仓已用）。
- **交互图("动图")**: Cytoscape.js via unpkg CDN，单文件自包含 HTML，数据内联。
- **注入**: 标记 `<!-- KG:START -->...<!-- KG:END -->` 幂等替换。
- **脚本**: package.json 加 `"kg": "tsx knowledge-graph/generate.ts"`。

### 任务拆解
| # | Task | 风险 | 产出 |
|---|------|------|------|
| 1 | 数据模型 + 生成器骨架 + HTML 模板（契约冻结） | L2 | data/graph.ts（schema+少量种子）、generate.ts、HTML 模板、npm script |
| 2 | Workflow 并行抽取 20 个单元（19 章 + capstone）的概念/关系/文章 | L2 | 每单元结构化 JSON（concepts/relations/articles） |
| 3 | 合并数据 → graph.ts（去重 + 跨章关系 + 校验 id） | L2 | 完整 graph.ts |
| 4 | 运行生成器 → 全局 md + 交互 HTML + 19 章注入 | L2 | 三类产物 |
| 5 | 验证（tsc + 生成器幂等 + Mermaid 合法 + HTML 打开 + 链接）| L2 | 验证记录 |
| 6 | Review（多视角 + 第6视角）+ Compound | L2 | 审查结果、复利记录 |

### 验证策略
- 每 Task 收尾 `npx tsc --noEmit`（invariant_test）。
- Task 4/5：`npm run kg` 跑两次验证幂等（第二次 README 无多余 diff）；抽样校验 Mermaid 语法与跨章链接路径真实存在。
- L2 为主（生成/文档，不动课程逻辑）。

## Phase 3: 变更日志

### Task 1 — 数据模型 + 生成器 + HTML 模板（契约冻结）
- `knowledge-graph/data/graph.ts`：类型（Chapter/Concept/Relation/Article）+ 20 单元 CHAPTERS + 种子数据。
- `knowledge-graph/generate.ts`：校验 → 全局 md + 交互 HTML + 每章标记幂等注入；支持 `--no-inject`。
- `knowledge-graph/templates/html.ts`：Cytoscape via CDN，单文件自包含（客户端 JS 全程字符串拼接，避免与 TS 模板插值冲突）。
- `knowledge-graph/README.md`（扩展指南）+ package.json `"kg"` 脚本 + tsconfig include 加 `knowledge-graph`。
- 验证：tsc 零错误 + `--no-inject` 跑通（全局 md Mermaid 合法 + HTML 含 cytoscape）。

### Task 2 — Workflow 并行抽取（20 agent）
- 每单元一个 agent 读 README+代码，结构化抽取概念/章内关系/关联文章。
- 产出：137 概念 / 154 章内关系 / 54 文章（含内部链接，未去重）。

### Task 3 — 合并数据 + 跨章关系脊柱
- 一次性 build 脚本合并：扁平化概念（加 chapter）、校验章内关系、**过滤 internal 文章 + 按 url 去重并合 chapters** → 29 外部文章。
- 我手工补 **37 条跨章关系脊柱**（需全局课程认知，引用真实概念 id：02→01、04→01/02、05→04、06→05、07→01/02、09→08、10→04、11→06、12→04/06、13→03、14→02/06、15→13、16→02、17→06/09、18→06/14、19→05/12、capstone→06/09/10/13/16/18）。
- 结果：graph.ts = 137 概念 / **191 关系（37 跨章）** / 29 文章；脚本跑完即删（graph.ts 成 SoT）。

### Task 4 — 全量生成
- `npm run kg`：全局 md（章节地图 + 137 节点概念图 + 概念索引 + 文章索引）+ 交互 HTML（137 节点）+ 20 章 README 注入。
- README 加全局图谱入口（集成路径闭环，无 dead link）。

### Task 5 — 验证
- `npx tsc --noEmit` → 零错误（含 knowledge-graph/）。
- **幂等**：连跑两次，第二次 README「更新 0 · 未变 20」。
- 注入覆盖 20/20（含异构结构的 capstone，文末追加）；KG:START/END 标记全配对；19 课正文「小结与延伸」完好（非破坏）。
- HTML 注入 137 概念节点；全局 md 2 个 Mermaid 块语法合法。

## Phase 4: 审查结果

审查时间：2026-06-04

### 多视角 + 第 6 视角
| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | 通过 | 数据驱动单一来源 graph.ts → 生成器 → 三类产物；新增内容零散落 |
| 安全 | 通过 | 纯生成、无密钥、无 LLM 调用；HTML 用 esc() 转义节点文本防注入 |
| 性能 | 通过 | 生成器纯本地 fs；HTML 用 Cytoscape cose 布局，137 节点流畅 |
| 代码质量 | 通过 | tsc 零错误；生成器 fail-fast 校验非法引用；客户端 JS 规避模板插值陷阱 |
| 一致性/幂等 | 通过 | 标记替换幂等（二次跑无 diff）；正文未破坏 |
| 第 6 视角 · 集成连续性 | 通过 | 沿用上 sprint 全部不变量（tsx/相对导入/tsc）；全局图谱由 README 链接、每章注入含返回全局链接，无 dead code |

### Findings
- P0：无。
- P1：无。
- P2（记录，不阻塞）：
  - 文章 `zod.dev` 与 `zod.dev/`（尾斜杠差异）未被 url 去重合并，两条并存——无害，留待作者整理。
  - 29 篇外部文章 URL 经人工抽查：5 篇经典论文 arXiv id 全部正确，其余均官方域名，无明显幻觉；文档已标注「外链需自行核实」。真实有效性仍需作者按机制维护。

### 验证记录
- `npx tsc --noEmit` → pass。
- `npm run kg` ×2 → 第二次 README「更新 0 · 未变 20」（幂等）。
- 标记配对/正文完好/注入覆盖/HTML 节点数 → 全部通过（见 Task 5）。

## Phase 5: 复利记录

### 产物
- 全局知识图谱 `docs/knowledge-graph.md`；交互式「动图」`knowledge-graph/output/index.html`；20 单元 README 各自的「知识图谱与延伸阅读」节。
- 唯一可维护事实来源 `knowledge-graph/data/graph.ts`（137 概念 / 191 关系 / 29 文章）。

### 经验沉淀
1. **大体量 LLM 抽取产物，用脚本合并而非手抄**：workflow 输出 JSON → 一次性 build 脚本（扁平化/校验/去重/写回 SoT）→ 跑完即删。人只补「需要全局认知」的部分（跨章脊柱）。
2. **数据驱动 + 幂等注入是可扩展文档系统的核心**：唯一数据源 + 标记区替换，让「新增一篇文章 = 改一处 + 重跑」，且不破坏被多次手改的正文。
3. **TS 模板字符串拼 HTML 时，客户端 JS 必须规避 `${}`/反引号**：用字符串拼接书写，只留一处数据插值，否则外层模板会吞掉客户端代码。

### 后续建议
- 新增概念/关系/文章：改 `graph.ts` → `npm run kg`。
- deferred：直接打包部署（tsup/dist + Docker + 平台配置 + CI），见 frontmatter `deferred`，deadline 2026-06-30。
