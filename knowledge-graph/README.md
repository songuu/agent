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

所有内容都来自一个文件：[`knowledge-graph/data/graph.ts`](./data/graph.ts)。

- `CHAPTERS` — 章节清单（一般不动）。
- `CONCEPTS` — 概念节点：`{ id, label, chapter, summary? }`。
- `RELATIONS` — 概念关系：`{ from, to, type, note? }`，`type ∈ 前置|深化|对比|应用|组成`。
- `ARTICLES` — 关联文章：`{ title, url, kind, chapters[], note? }`，`kind ∈ paper|doc|blog|video|internal`。

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

**新增一个概念 / 一条关系**：在 `CONCEPTS` / `RELATIONS` 加条目（概念 id 全局唯一、kebab-case），跑 `npm run kg`，全局图、本章图、交互图同步更新。

## 设计要点

- **幂等**：`generate.ts` 可反复运行；README 只替换 `<!-- KG:START/END -->` 标记之间的内容，不动你的正文。
- **零新增依赖**：交互图用 Cytoscape.js 走 CDN，不进 `package.json`。
- **数据非法即报错**：概念引用了不存在的章节、关系引用了不存在的概念、文章关联了不存在的章节，生成器会 fail-fast 并指出哪一条。
- **与「图解学习地图」互补**：每章原有的 `图解学习地图` 讲的是本章流程；知识图谱讲的是概念之间的关系与跨章脉络。

> ⚠️ 外部文章链接请自行核实有效性——本系统只负责把它们组织好，不保证 URL 长期可用。
