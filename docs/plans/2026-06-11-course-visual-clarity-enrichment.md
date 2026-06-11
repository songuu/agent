---
title: "课程视觉清晰度与生动度全面增强"
type: sprint
status: completed
created: "2026-06-11"
updated: "2026-06-11"
checkpoints: 0
tasks_total: 7
tasks_completed: 7
tags: [sprint, website, education, visual-explainer, mermaid, animation, clarity]
aliases: ["视觉增强", "图表清晰度"]

invariants:
  - "CONCEPT_VISUALS.length === CHAPTERS.length（覆盖率门禁，不可破）"
  - "每章 core+warning highlight 各一、≥1 外部延伸阅读"
  - "concept-visual SVG 内不得出现 <img> / <script> / 省略号截断"
  - "课程章节正文零手改，概念图谱仅经 npm run kg 幂等重生成 KG:START/END 区"
  - "动画全部纯 CSS，prefers-reduced-motion 下静止，页面无新增运行时 JS（diagram-zoom 除外）"
  - "无外部图片文件，全部内联 SVG"

invariant_tests:
  - knowledge-graph/data/visuals.test.mts
  - .vitepress/theme/diagram-zoom.test.mts
  - knowledge-graph/generate.test.mts
  - .vitepress/theme/reduced-motion.test.mts

deferred: []

deadcode_until: []
---

# 课程视觉清晰度与生动度全面增强

## Phase 1: 需求分析

原始需求（含两张截图：第 07 章「图解学习地图」flowchart 与「本章概念图谱」graph 渲染过小、文字 135% 缩放仍不可读）：

> 项目里面很多的流程图和思维导图不够精准和清楚，图片也是不够完整，需要将整个的教学过程更加的完整和生动，适当的加入动画和图片。

### 根因（已勘察验证）

- **字号**：Mermaid 用默认主题，`config.mts:368-371` 仅设 maxTextSize/maxEdges，无 `themeVariables.fontSize` → 文字约 12px。
- **初始适配**：`diagram-zoom.ts` `INITIAL_MAX_SCALE=1.35`（截图 135% 即此上限）+ 画布 `clamp(180px,36vw,360px)` 把宽流程图压扁居中 → 留白多、字小。
- **概念图谱密集**：`generate.ts:220` 固定 `graph LR`，密章（如 09 约 16 节点/10 跨章边）成乱麻；关系类型（前置/深化/对比/应用/组成）无配色。
- **零真实图片**：全课程 0 个 png/jpg/svg，100% 靠 Mermaid 文本图 → "图片不完整"字面成立。
- **visual 偏单薄**：`visuals.ts` renderConceptVisualArt 中 loop/pipeline/fusion 三 kind 退化到通用 `renderFlowArt`，不够生动。

### Scope（用户确认：全面增强 · 内联 SVG · 概念图谱配色+保留全部）

- 清晰度：Mermaid 字号/主题、初始可读尺度、概念图谱关系配色 + 本章焦点 + 密章 TB 自适应。
- 生动度：CONCEPT_VISUALS 升级为更丰富的内联 SVG 场景 + 动画（loop/pipeline/fusion 三 kind 补独立场景）。
- 门禁：清晰度/生动度写入测试，防回归。

### Non-scope

- 改写课程文字正文、demo runner / LLM 运行逻辑。
- 手改每章 Markdown 正文（概念图谱只经 npm run kg）。
- 引入外部图片文件（png/jpg）—— 用内联 SVG 替代。
- 全局 280 节点知识图谱大改（已有交互式 HTML，单列后续）。

### 成功标准

- 第 07 章两图默认视图文字可读、不需手动放大即清晰。
- 概念图谱关系按类型配色，密章不再重叠成团。
- loop/pipeline/fusion 章 visual 呈现独立、生动、带动画的场景。
- 全部 invariant 测试 + typecheck + site:build 通过；明暗双主题、移动端无横向溢出。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

见 frontmatter `invariants`。本 sprint 全部改动只扩展渲染/生成/样式层，不触碰覆盖率与数据结构契约。

### 入场扫描 - 集成路径

| 改动点 | 触发 | 中间层 | 用户可见 |
|---|---|---|---|
| Mermaid 字号/主题 | site build | mermaid.initialize + CSS | ✅ 所有图清晰 |
| diagram-zoom 初值 | 页面加载 | theme/index.ts 副作用 | ✅ 默认视图可读 |
| 概念图谱配色/TB | npm run kg | README KG 区 → build | ✅ 26 章重渲染 |
| loop/pipeline/fusion 场景 | site build | inject-concept-visual | ✅ 对应章生动 |

无 dead code：所有改动均经构建期注入直达页面。

### 入场扫描 - 债务清单

本视觉层无继承阻塞债务（demo-live-runner 的 deferred 项属独立 demo runner 子系统）。

### 任务拆解

| Task | 内容 | 风险 |
|---|---|---|
| T1 | Mermaid 清晰度基线：config.mts themeVariables（字号↑/间距↑，保暗色自适应）+ custom.css 强制 .mermaid 文字字号/对比 | L2 |
| T2 | diagram-zoom.ts 初始可读尺度↑、密图画布高度自适应 + diagram-zoom.test 同步 + custom.css surface 高度 | L2 |
| T3 | generate.ts 概念图谱：关系类型 linkStyle 配色 + 本章/他章 classDef + 密章切 graph TB；抽可测纯函数；npm run kg 重生成 | L3 |
| T4 | visuals.ts loop/pipeline/fusion 独立生动 SVG 场景 + 动画；custom.css 三组动画（reduced-motion 安全） | L3 |
| T5 | 强化门禁：visuals.test（canvas kind 一致 + 动画类）、diagram-zoom.test（可读下限）、generate.test（配色/方向） | L2 |
| T6 | 文档维护说明同步（knowledge-graph/README.md + 根 README.md） | L1 |
| T7 | 全量验证 + 浏览器 QA（ch07 + ch09，明暗双主题，移动 390px） | L2 |

### 关键决策

- "逐章插画" = per-kind 生动场景 × 每章 steps 参数化，非 26 张手绘（延续数据驱动，可维护、可测、不漂移）。
- 字号清晰度优先 CSS 覆盖（主题无关，不碰插件暗色逻辑），themeVariables 辅助。
- 概念图谱配色用 `linkStyle <序号>`（边按生成顺序确定），非脆弱全局规则。

## Phase 3: Work

- [x] T1 Mermaid 清晰度基线（config + css）— fontSize 16/CSS 下限、useMaxWidth:false
- [x] T2 diagram-zoom 初始可读尺度 + 画布高度 — READABLE 1.0 / MAX_SCALE 1.8 / 画布 460
- [x] T3 概念图谱配色 + 密章 TB（generate + 重生成）— buildChapterConceptGraph 抽出，26 章重生成（幂等）
- [x] T4 loop/pipeline/fusion 生动 SVG 场景 + 动画 — 环形/传送带/双路汇流 + conceptLoopFlow
- [x] T5 强化视觉门禁（三测试）— 场景 kind 一致 / 配色序号 / 可读下限
- [x] T6 文档维护说明同步 — knowledge-graph/README.md + 根 README.md
- [x] T7 全量验证 — typecheck/3 测试/kg 幂等/site:build/dist 产物核验全绿；浏览器像素级目测待手动（pnpm site:preview）

### 变更日志

- 改动文件：`.vitepress/config.mts`、`.vitepress/theme/{custom.css,diagram-zoom.ts,diagram-zoom.test.mts}`、`knowledge-graph/generate.ts`、`knowledge-graph/generate.test.mts`(新)、`knowledge-graph/data/{visuals.ts,visuals.test.mts}`、`knowledge-graph/README.md`、`README.md`、26 章 README 的 KG 区（npm run kg 重生成）。
- 验证：`tsc --noEmit` pass；`visuals.test.mts` / `generate.test.mts` / `diagram-zoom.test.mts` pass；`npm run kg` 幂等（未变 26）；`vitepress build` pass（33.98s）；dist 含 12 章新场景 + 概念图谱配色源 + 字号/动画 CSS。

## Phase 4: Review

方式：5 视角对抗审查 workflow（架构/集成连续性、正确性/清晰度、无障碍、测试门禁质量、设计一致性），每条 P0/P1 经独立 skeptic 验证真伪。9 agents / 140 工具调用。

结果：

- **P0**：0。
- **P1（已修）**：`custom.css` 的 `@media (prefers-reduced-motion: reduce)` 关停列表漏了 `.concept-svg-node rect`。T4 把该选择器加进 `conceptNodePulse` 动画组，却只把 `.concept-svg-ring` 加进减动列表 → loop/pipeline/fusion（12/25 visual）的方块节点在减动偏好下仍 `translateY` 浮动，**破坏「动画必须 prefers-reduced-motion 下静止」不可破 invariant**。4/5 视角独立命中、4 个 skeptic 全判 isReal。
  - 修复：列表补 `.concept-svg-node rect`。
  - 防回归：新增 `.vitepress/theme/reduced-motion.test.mts` —— 扫描所有带真实 `animation` 的 concept 选择器，断言每个都出现在减动关停列表（把软 invariant 变硬门禁）。
- **第 6 视角（集成连续性）**：无 dead code（`renderFlowArt` 干净移除、`buildChapterConceptGraph` 已被 `buildChapterSection` 调用、`concept-svg-pulse` 在 pipeline 场景复用）；无 invariant 残留破坏；无半下沉漂移；概念图谱仅经 `npm run kg` 重生成，正文零改。
- **设计一致性**：0 确认发现（三新场景 SVG 几何在 720×240 viewBox 内，无越界/重叠）。

验证（修复后）：`tsc` pass；`visuals/generate/diagram-zoom/reduced-motion` 四测试 pass；`vitepress build` pass（31.39s）；dist minified CSS 中 `.concept-svg-node rect` 出现 2 次（动画规则 + `animation:none`），修复已进 shipped 产物。

遗留（非 P0/P1）：实时浏览器像素级目测（明暗双主题、移动 390px、缩放交互、动画体感）——本环境无浏览器自动化，建议 `pnpm site:preview` 手动眼检 ch07（截图章）与 ch09（密图）。

## Phase 5: Compound

沉淀：

- **动画 ↔ reduced-motion 选择器必须镜像**：新增任何带位移/缩放动画的选择器，必须同步加进 `@media (prefers-reduced-motion: reduce)` 关停列表；tsc/结构化 HTML 测试/site build 全绿都测不到 CSS 减动行为，必须专门用 CSS-diff 守门测试拦截。已沉淀为 `reduced-motion.test.mts` 与记忆。
- **多视角对抗审查的价值**：本次唯一真 P1 是无障碍 invariant 破坏，4/5 视角独立命中——单视角 self-review 很可能漏。值得对"有 invariant 约束 + 全绿门禁"的改动常态化。
- **数据驱动视觉层的可持续扩展**：概念图谱配色/方向（`buildChapterConceptGraph`）、per-kind SVG 场景（`visuals.ts`）、清晰度配置（mermaid + diagram-zoom）三层均数据/构建驱动、可测、不改正文，延续前两个视觉 sprint 的架构纪律。

知识：1 条经验记忆（reduced-motion 镜像 + 守门）；1 个新硬门禁（reduced-motion.test.mts）。
