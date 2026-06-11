# 知识图谱系统

一套**数据驱动、可持续扩展**的知识图谱：一张全局概念图谱、每章各自的图谱、一个交互式「动图」，以及随时可增补的关联文章。

## 一条命令生成全部

```bash
npm run kg          # = npx tsx knowledge-graph/generate.ts
npm run kg -- --no-inject   # 只生成全局 md + 交互 HTML，不改任何章节 README
```

会产出 / 更新：

| 产物 | 路径 | 说明 |
|------|------|------|
| 全局图谱 | [`docs/knowledge-graph.md`](../docs/knowledge-graph.md) | Mermaid 章节地图 + 概念图 + 概念索引 + 文章索引（GitHub 直接渲染） |
| 交互图谱（动图） | `knowledge-graph/output/index.html` | Cytoscape.js，缩放/拖拽/按部分筛选/点节点看关联文章。下载后用浏览器打开 |
| 每章图谱 | 各 `lessons/NN-*/README.md` 的「知识图谱与延伸阅读」节 | 本章概念子图 + 跨章关系 + 延伸阅读，写在 `<!-- KG:START/END -->` 标记区 |

## 唯一事实来源

知识图谱内容来自 [`knowledge-graph/data/graph.ts`](./data/graph.ts)。

- `CHAPTERS` — 章节清单（一般不动）。
- `CONCEPTS` — 概念节点：`{ id, label, chapter, summary? }`。
- `RELATIONS` — 概念关系：`{ from, to, type, note? }`，`type ∈ 前置|深化|对比|应用|组成`。
- `ARTICLES` — 关联文章：`{ title, url, kind, chapters[], note? }`，`kind ∈ paper|doc|blog|video|internal`。

网页里的「抽象概念可视化」模块来自 [`knowledge-graph/data/visuals.ts`](./data/visuals.ts)。它按 `chapter` 绑定到 `CHAPTERS.id`，由 VitePress 构建期自动注入到章节页第一张学习地图后；课程 README 正文不需要手动插 HTML。模块同时渲染代码内联绘制的 SVG 图片、「核心判断 / 易错边界」彩色加粗重点，以及来自 `ARTICLES` 的外部理解链接。`visuals.test.mts` 会强制检查每个课程都有 Mermaid 流程图或思维导图、Codex 绘制的 visual 模块、2 条重点标注和至少 1 条外部引用。

所有网页 Mermaid 图（流程图 / 思维导图）由 `.vitepress/theme/diagram-zoom.ts` 在客户端增强：支持按钮缩放、`Ctrl/⌘ + wheel` 缩放、拖拽平移和一键重置。Markdown 中仍保留标准 Mermaid 代码块，便于 GitHub/Obsidian 阅读。

## 怎么扩展

**新增一篇延伸文章**：在 `ARTICLES` 里加一条，写明它关联哪些章节，跑 `npm run kg`。该文章会自动出现在全局文章索引、相关章节的「延伸阅读」、以及交互图谱里这些章节概念的详情面板中。

```ts
{
  title: "Lost in the Middle: How Language Models Use Long Contexts",
  url: "https://arxiv.org/abs/2307.03172",
  kind: "paper",
  chapters: ["07", "09"],   // 关联到「短期记忆」「RAG」两章
  note: "长上下文中信息位置如何影响利用率——记忆/检索章的重要背景。",
},
```

**新增一个概念 / 一条关系**：在 `CONCEPTS` / `RELATIONS` 加条目（概念 id 全局唯一、kebab-case），跑 `npm run kg`，全局图、本章图、交互图同步更新。本章概念图谱会自动：**橙框**高亮本章概念、蓝框弱化关联的他章概念、连线按关系类型配色（前置=蓝 / 深化=紫 / 对比=玫红 / 应用=绿 / 组成=橙）；节点数超过 8 时从 `LR` 切到 `TB`（思维导图式自上而下），降低密集章节的横向拥挤。这些规则在 `buildChapterConceptGraph`（纯函数，可单测）里，改动后跑 `npx tsx knowledge-graph/generate.test.mts`。

**新增一个抽象概念可视化模块**：在 `CONCEPT_VISUALS` 中加一条，选择 `kind`（`loop` / `pipeline` / `fusion` / `space` / `compare` / `layers` / `stream` / `shield`），写明 `chapter`、`title`、`summary`、`steps`、`takeaway`；在 `CONCEPT_HIGHLIGHTS` 中补「核心判断 / 易错边界」；在 `ARTICLES` 中保证该章至少有一条外部理解链接。每个 `kind` 都会渲染一套专属的内联 SVG 动画场景（如 `loop`=椭圆循环环、`pipeline`=传送带、`fusion`=双路汇流、`space`=语义空间、`compare`=对比卡片、`layers`=分层、`stream`=流式 token），动画纯 CSS 且在 `prefers-reduced-motion` 下静止。visual 图片必须继续由 `visuals.ts` 生成内联 SVG，不新增外部图片资源。再跑 `npx tsx knowledge-graph/data/visuals.test.mts`、`npx tsx knowledge-graph/generate.test.mts`、`npx tsx .vitepress/theme/diagram-zoom.test.mts` 和 `pnpm site:build`。新增课程时必须同步补 README 的 Mermaid 流程图或思维导图和这里的 visual 数据。

## 设计要点

- **幂等**：`generate.ts` 可反复运行；README 只替换 `<!-- KG:START/END -->` 标记之间的内容，不动你的正文。
- **零新增依赖**：交互图用 Cytoscape.js 走 CDN，不进 `package.json`。
- **数据非法即报错**：概念引用了不存在的章节、关系引用了不存在的概念、文章关联了不存在的章节，生成器会 fail-fast 并指出哪一条。
- **与「图解学习地图」互补**：每章原有的 `图解学习地图` 讲的是本章流程；知识图谱讲的是概念之间的关系与跨章脉络。
- **视觉解释不改正文**：「抽象概念可视化」由 `visuals.ts` 数据驱动，样式集中在 `.vitepress/theme/custom.css`；Mermaid 缩放增强集中在 `.vitepress/theme/diagram-zoom.ts`，适合反复补图、流程、动画、重点标注和外部阅读入口而不污染课程 Markdown。
- **清晰度优先**：Mermaid 字号/字体/间距在 `.vitepress/config.mts` 的 `mermaid` 配置里统一调（`useMaxWidth:false` 让图按本征尺寸渲染，交给缩放层适配，文字不被压小）；`diagram-zoom.ts` 控制首屏可读尺度（小图放大、宽图至少 100% 开屏）与画布高度。改这些常量须同步更新 `diagram-zoom.test.mts`。不写死 Mermaid `theme`，保留明暗模式自适应。

> ⚠️ 外部文章链接请自行核实有效性——本系统只负责把它们组织好，不保证 URL 长期可用。
