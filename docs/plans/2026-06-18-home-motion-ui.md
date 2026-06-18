---
title: "首页运动化 · 前沿动效"
type: sprint
status: in-progress
created: "2026-06-18"
updated: "2026-06-18"
parent: "docs/plans/2026-06-18-frontier-dark-ui.md"
checkpoints: 0
tasks_total: 7
tasks_completed: 0
tags: [sprint, ui, motion]
aliases: ["首页动效", "home-motion"]

invariants:
  - "新增 transform/位移/渐变/辉光动画必须镜像进 @media (prefers-reduced-motion: reduce)"
  - "backdrop-filter/filter/transform/will-change 不得加到 fixed 覆盖层(.diagram-zoom-overlay/.selection-chat-drawer/.selection-chat-popover, 均 body.append)的祖先链"
  - "hero name 渐变字达 WCAG AA large text 3:1（流动各位点）；流动+辉光仅暗色（近黑底对比充裕）"
  - "滚动揭示 FOUC-safe：默认可见，仅在支持 animation-timeline 且非减动时隐藏揭示；不支持/减动→卡片照常显示"
  - "卡 hover 用 translate 长属性与 scroll-driven transform 揭示组合，避免 cascade 互相覆盖"

invariant_tests:
  - .vitepress/theme/reduced-motion.test.mts
  - .vitepress/theme/diagram-zoom.test.mts

deferred:
  - sprint: "后续"
    item: "~37 处散落圆角迁移到 --radius-* token（来自 aurora-glass sprint）"
    deadline: "2026-07-18"
    reason: "纯整理，无功能影响"
  - sprint: "后续"
    item: "concept amber 浅色 ~3.2:1（pre-existing，来自 frontier-dark sprint）"
    deadline: "2026-07-18"
    reason: "large/icon 文本场景，非小字正文"
---

# 首页运动化 · 前沿动效 sprint

## Phase 1: 需求分析（Think）

**触发**：用户反馈「页面样式还是显得死气沉沉」，要求参考 heyorbi.com / dreamtype.xyz，**根路由 https://songuu.top/（=首页 index.md, layout:home）必须炫酷、更多动画效果**。

**根因诊断**：上轮 frontier-dark sprint 加的全是**静态增强 + hover**（深基底/噪点/紧字距/spotlight-lite）。首页加载即定、零入场/环境运动 → 感官「死气沉沉」。aurora mesh 虽飘但在内容之后、不够显眼。**缺口 = 运动（motion）**。

**参考站模式语言蒸馏**（heyorbi：近黑 navy + 电青 accent + 大号几何粗体 hero + 滚动揭示卡片 + hover lift + 微动渐变 + badge glow；dreamtype 类：kinetic 渐变字）。dreamtype.xyz 取站 502（JS SPA），按模式语言接地（与上轮一致）。

**Scope**：仅首页 hero + feature 卡的运动化（CSS 表现层，续 Aurora Glass）。
- T-A hero 入场编排（name/text/tagline/actions stagger fade-up，加载一次）
- T-B 流动渐变标题（hero name 渐变沿字横向流动，**仅暗色**）
- T-C feature 卡滚动揭示（CSS scroll-driven，零 JS，FOUC-safe）
- T-D hero 标题辉光呼吸（drop-shadow 脉动，**仅暗色**）
- T-E feature icon hover pop
- T-F 主 CTA hover sheen 扫光
- 守门：扩展 reduced-motion.test 覆盖新 hero 动画

**Non-scope**：news/interview-clinic/notion 组件（parallel session 在改，正交）；浅色大幅动效（保持克制）；新 JS 模块（scroll-driven CSS 替代）。

**Success**：暗色首页有入场编排 + 流动渐变字 + 辉光呼吸 + 滚动揭示卡 + 富 hover；不破任何继承不变量；reduced-motion/diagram-zoom 测试 + site:build 全绿。

**Risks**：cascade 冲突（scroll-driven transform vs hover）、FOUC、AA-large（cyan-on-white）、containing-block、parallel-session 文件冲突。已在设计层逐一规避（见 invariants）。

## Phase 2: 技术方案（Plan）

### 入场扫描 — Invariants 继承

| 子系统 | 继承 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| fixed 覆盖层 | filter/transform/will-change 禁上其祖先 | hero/feature/.VPHome 均非 body.append 覆盖层祖先；transform 仅落 .VPHero 子级/.VPFeature/伪元素，安全 |
| reduced-motion | 真 animation 必镜像关停 | 新 hero 动画进 reduce 块 + 扩展守门测试；scroll-driven 用 no-preference 包裹天然安全 |
| WCAG AA | 小字 4.5:1 / large 3:1 | 流动渐变字仅暗色 large text；浅色不动；入场/揭示只动 opacity/transform 不涉对比 |
| dark 基底单调序 | 不回归 | 本轮不动 token 基底 |

### 入场扫描 — 集成路径

| 改动点 | 触发 | 中间层 | 刷新后可见 |
|--------|------|--------|------------|
| hero 入场 | 页面加载 | CSS animation both | ✅ 纯表现 |
| 滚动揭示 | 滚动入视口 | CSS animation-timeline:view() | ✅ 支持浏览器；不支持→静态可见（graceful） |
| 流动渐变/辉光 | 持续 | CSS infinite（暗色） | ✅ reduce→静态 |

### 入场扫描 — 债务清单

见 frontmatter `deferred`（2 项，均非本轮，carry forward）。

### 任务表

| # | 任务 | 风险 | 验证 |
|---|------|------|------|
| T-A | hero 入场 stagger | L1 | build + 减动测试 |
| T-B | 流动渐变字（暗色） | L2 | build + AA-large 推断 |
| T-C | scroll-driven 卡揭示 | L2 | build + @supports/FOUC 推断 |
| T-D | 标题辉光呼吸（暗色） | L1 | build + 减动测试 |
| T-E | icon hover pop | L0 | build |
| T-F | CTA sheen | L1 | build + 减动测试 |
| 守门 | 扩展 reduced-motion.test | L1 | npx tsx --test |

## Phase 3: 变更日志（Work）

（实现中）

## Phase 4: 审查结果（Review）

（待 Phase 4）

## Phase 5: 复利记录（Compound）

（待 Phase 5）
