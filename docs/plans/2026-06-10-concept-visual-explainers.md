---
title: "课程抽象概念可视化增强"
type: sprint
status: completed
created: "2026-06-10"
updated: "2026-06-10"
tasks_total: 5
tasks_completed: 5
tags: [sprint, website, education, visual-explainer, animation]
---

# 课程抽象概念可视化增强

## Phase 1: 需求分析

原始需求：

> 需要更多的加入图片，流程图，动画的效果，解析很多比较抽象或者复杂的概念。

核心判断：

- 课程已有 Mermaid「图解学习地图」，但页面视觉形态偏单一。
- 直接批量手改 README 会造成维护成本和样式漂移。
- 最小可持续方案：新增一个数据驱动的「抽象概念可视化」层，由 VitePress 构建期注入到章节页。

## Phase 2: 方案

Scope：

- 新增 `knowledge-graph/data/visuals.ts`，用章节 ID 绑定视觉解释模块。
- 支持 `loop` / `pipeline` / `space` / `compare` / `layers` / `stream` / `shield` / `fusion` 等表现形式。
- 在 `.vitepress/config.mts` 增加 markdown-it 注入器，自动插到第一张学习地图后。
- 在 `.vitepress/theme/custom.css` 集中维护流程图、示意图和 CSS 动画。
- README 与知识图谱说明补维护入口。

Non-scope：

- 不生成外部图片文件。
- 不手改每章 Markdown 正文。
- 不引入 Vue 组件或额外运行时 JS。

验收：

- 至少覆盖 10 个抽象概念页面。
- `pnpm typecheck` 通过。
- `npx tsx knowledge-graph/data/visuals.test.mts` 通过。
- `pnpm site:build` 通过。

## Phase 3: Work

- [x] T1 数据层：新增 `CONCEPT_VISUALS` 与 HTML 渲染器。
- [x] T2 注入层：VitePress markdown 构建期按章节自动注入。
- [x] T3 样式层：新增视觉 band、流程节点、语义空间示意图、流式动画、降级动画控制。
- [x] T4 文档层：README 与知识图谱维护说明同步更新。
- [x] T5 验证：数据测试、typecheck、site build、浏览器桌面/移动冒烟。

已覆盖章节：

- 01 Agent 公式
- 04 ReAct 循环
- 07 短期记忆
- 08 Embedding
- 09 RAG
- 10 推理范式
- 11 多 Agent 编排
- 13 结构化输出
- 14 流式 UX
- 17 安全护栏
- R2 混合检索
- R4 查询改写

## Phase 4: Review

结果：

- P0/P1：未发现。
- 课程 Markdown 正文保持零改动，visual 由数据和构建注入控制。
- 页面运行时未新增 JS；动画仅 CSS，且 `prefers-reduced-motion` 下静止。
- 浏览器桌面检查：第 08 章 visual 存在，位置在 Mermaid 后、demo runner 前，无横向溢出。
- 浏览器移动检查：390px 宽度下无横向溢出，visual band 宽 342px，节点最大宽 157px。

## Phase 5: Compound

沉淀：

- 后续补更多抽象概念图解时，只扩展 `CONCEPT_VISUALS`，避免手改章节正文。
- 构建期注入适合课程站这类静态内容增强：数据可测、样式集中、页面源码保持干净。

验证：

- `npx tsx knowledge-graph/data/visuals.test.mts` → pass（沙箱外，沙箱内 esbuild/tsx `spawn EPERM`）
- `pnpm typecheck` → pass
- `pnpm site:build` → pass（沙箱外，沙箱内 esbuild `spawn EPERM`）
- Browser desktop DOM check → pass
- Browser mobile 390x844 DOM check → pass
