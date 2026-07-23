---
title: "AI HOT 启发的 Agent 学习与情报门户重构"
type: sprint
status: completed
created: "2026-07-23"
updated: "2026-07-23"
tasks_total: 5
tasks_completed: 5
tags: [sprint, website, information-architecture, vitepress, news]
aliases: ["AI HOT 参考重构", "agent portal rearchitecture"]
---

# AI HOT 启发的 Agent 学习与情报门户重构

## Phase 1: 需求分析（Think）

### 原始需求

> 参照 https://aihot.virxact.com/ 网站的实现和架构，重新架构下当前的网站。

### 产品判断

本次“参照”指借鉴 AI HOT 已被公开页面验证的信息架构和内容产品闭环，不复制其品牌、文案、内容或私有实现：

- 从“把所有内容铺在首页”改为“精选入口 + 完整目录”双轨。
- 从单一课程站改为面向 Agent 开发者的三类任务门户：学习、实践、跟踪。
- 用主题地图和分区导航降低课程、项目、源码、资讯、面试、Notion 文章之间的发现成本。
- 保留当前仓库的 VitePress、Markdown、Supabase 匿名只读数据与既有 URL，不做破坏性迁移。

主产品定位确定为：**Agent 工程知识门户——学 Agent、做项目、追前沿，一站完成。**
课程仍是体系化深度的主干，项目负责把知识转成作品，资讯/长文/面试负责持续更新与回访；三者不再以六套独立产品身份争抢一级入口。

### 当前站点问题基线

- 首页首屏后平铺 18 张同权卡片，混合课程阶段、项目、应用、运维、求职与蓝图。
- 顶栏约 10 个一级入口，多个入口又在“指南”中重复。
- 全局 sidebar 约 101 个可点击项，并覆盖资讯、面试、Notion 等不需要完整课程目录的页面。
- `/news/` 与第 20 章包装同一资讯数据流，首页却没有最新内容入口。
- “项目”更像链接索引，“已安排”主要面向维护者，但目前都占公众一级入口。
- 必须保留的差异化资产包括：完整课程、28 个 capstone、资讯列表/详情闭环、面试分类与详情、Notion 全文、源码问答/CodeMap、知识图谱、列表详情返回状态。

### 已验证参考事实

- AI HOT 顶层按“内容 / 接入 / 更多”分组，核心页面职责清晰：首页精选、全部动态、日报、主题、收藏、Agent 接入。
- 首页用“热点 TOP 5 + 最新精选”解决高频扫描；全量页保留来源、类型、搜索、分页。
- 主题地图按公司/模型、技术方向、内容形态组织长期内容。
- 详情页统一呈现推荐理由、摘要、来源、时间、标签、原文和关联报道；无可靠正文时明确降级。
- 公开响应头确认其为 Next.js + nginx，并采用不同页面粒度的边缘缓存；RSS/API/Skill 共享站内深链。
- 这些技术栈不是本项目必须照搬的结论；可迁移的是分层信息架构、统一内容合同、可缓存读模型和诚实降级。

### 本次要做

- 重构根首页为新的 Agent 门户，突出“今天看什么、从哪里学、做什么项目、如何深入源码”。
- 把顶栏从大量平铺入口重组为少量任务分组，保留所有关键入口。
- 把全站单一巨型 sidebar 改为按路由域分组的上下文 sidebar，让课程、RAG、源码、项目和内容页各自聚焦。
- 建立可复用、可测试的站点信息架构数据源，避免导航、首页入口和 sidebar 继续各自硬编码漂移。
- 复用既有内容和数据链路；首页只做现有入口与公开只读资讯的聚合展示。
- 完成桌面/移动、浅色/深色、无数据/配置缺失、减弱动效等关键状态验证。

### 本次不做

- 不复制 AI HOT 的 Logo、品牌视觉、新闻内容、文案或私有代码。
- 不把 VitePress 迁移到 Next.js；现有 Markdown 课程、构建和部署链路继续保留。
- 不重写 `news-collector`、Supabase schema、Notion 同步、面试同步或定时任务。
- 不新增登录、跨设备收藏、写接口、评论、支付或后台管理。
- 不修改当前工作树中与本任务无关的容器、Supabase 迁移及列表详情返回状态改动。
- 本轮默认交付本地构建与浏览器验收；除非用户另行要求，不执行生产发布。

### 成功标准

- [x] 用户进入首页后，不展开大目录也能在一个屏幕内理解“学习 / 实践 / 情报”三个主任务，并进入对应入口。
- [x] 顶栏主入口数量显著收敛，课程、项目、源码、资讯、面试、Notion、知识图谱仍全部可达。
- [x] 不同路由域使用各自的上下文导航，不再让资讯或文章页承担完整课程目录。
- [x] 首页精选区域在公开数据可用时展示最新内容；配置缺失、空数据或网络失败时给出明确可行动的降级入口。
- [x] 既有公开 URL、Markdown 正文、动态列表与详情页继续工作。
- [x] L2 验证通过：纯逻辑回归测试、类型检查、VitePress 生产构建和桌面/移动浏览器验收。

### 风险和假设

- 假设“重新架构”优先指站点入口、信息架构、导航和首页内容模型，不是替换整个采集后端。
- 当前工作树已有未提交改动，且部分涉及资讯/文章运行时；实现必须尽量新增独立文件，只在干净的入口/配置/CSS 接缝接线。
- `custom.css` 已超过 100 KB；新样式必须以独立命名空间收口，避免继续无边界覆盖默认主题。
- 首页动态资讯不能成为首屏单点故障；SSR/Markdown 必须保留静态入口，运行时增强失败仍可导航。
- 参考站点的内部数据库、队列和模型编排并未公开，任何相关判断都只能视为未知，不能照推断实施。

### 验收条件

1. WHEN 用户打开根路由，THE SYSTEM SHALL 显示任务导向的门户首页，并提供学习、实践、情报三个可操作入口。
2. WHEN 用户访问课程、RAG、源码、项目或内容路由，THE SYSTEM SHALL 显示与当前域匹配的上下文导航，同时保留跨域顶栏入口。
3. WHEN Supabase 公开配置可用且存在资讯，THE SYSTEM SHALL 在首页展示有限数量的最新条目，并链接到现有站内详情页。
4. WHEN Supabase 配置缺失、查询失败或结果为空，THE SYSTEM SHALL 显示明确降级状态和“进入 AI 资讯”入口，不阻塞其他首页内容。
5. WHEN 用户使用窄屏、深浅主题或 `prefers-reduced-motion`，THE SYSTEM SHALL 保持主要入口可达、文本可读且不强制播放位移动画。

## Phase 2: 技术方案（Plan）

### 方案概述

保留 VitePress 的静态内容与现有 Supabase 匿名只读链路，把“页面清单”重构成三层架构：

1. **站点信息架构层**：新增纯数据模块，集中定义顶栏、三大产品支柱、上下文 sidebar 和关键路由；`.vitepress/config.mts` 只负责装配。
2. **服务器可读的首页内容层**：根 `index.md` 改为语义化门户，静态 HTML/Markdown 先提供完整的学习、实践、情报入口，JavaScript 失败也可用。
3. **小型客户端增强层**：独立 `portal-home.ts` 仅查询最近 5 条公开资讯并增强首页；复用运行时 Supabase 配置、PostgREST 分页器和既有站内详情 URL，失败时诚实降级。

视觉采用独立的 `portal-home.css` 命名空间，避免继续向 100KB 全局 CSS 追加无边界规则。参考 AI HOT 的“墨青编辑部”只转译为信息密度、层级、时间线和卡片节奏，不复制品牌皮肤。

### 架构接缝

| 接缝 | Before | After | 兼容边界 |
|------|--------|-------|----------|
| 顶栏 | 约 10 个平铺/重复入口 | 首页、学习、项目、情报、源码、更多六组任务入口 | 所有既有 URL 保留 |
| Sidebar | 全站共享约 101 项 | 主课、RAG、LangGraph、源码、项目、情报、知识资源分域 | 课程仍保留章节前后关系 |
| 首页 | VitePress hero + 18 张同权 feature 卡 | 静态语义门户 + 三条主旅程 + 主题地图 + 最新情报增强 | 无 JS / 无数据仍可导航 |
| 最新资讯 | 仅 `/news/` 与第 20 章展示 | 首页限量预览复用同一 `news_items` 与详情页 | 不新增表、不复制数据 |
| 样式 | 全局 `custom.css` 持续膨胀 | 首页新样式独立命名空间 | 不改现有业务组件选择器 |

### 任务拆解

- [x] **Task 1 [P]**：建立站点信息架构单一数据源与回归测试；定义主导航、产品支柱、分域 sidebar 和关键路由可达性。— 文件：`.vitepress/site-information-architecture.ts`、`.vitepress/site-information-architecture.test.mts` — 风险：L2
- [x] **Task 2 [P]**：重写根首页的静态语义结构并创建隔离样式；保证无 JavaScript 时三条主旅程、主题地图和完整入口仍可用。— 文件：`index.md`、`.vitepress/theme/portal-home.css` — 风险：L2
- [x] **Task 3**：实现首页最新资讯客户端增强与纯逻辑测试，覆盖正常、空数据、配置缺失和请求失败；接入主题入口。— 依赖 Task 2 — 文件：`.vitepress/theme/portal-home.ts`、`.vitepress/theme/portal-home.test.mts`、`.vitepress/theme/index.ts` — 风险：L2
- [x] **Task 4**：让 VitePress 配置消费新的信息架构，切换到分域 sidebar，收敛搜索与导航文案；保持现有 markdown/plugin/build 接缝。— 依赖 Task 1 — 文件：`.vitepress/config.mts` — 风险：L2
- [x] **Task 5**：运行 L2 验证、浏览器桌面/移动与深浅主题验收，修复 findings，并记录架构决策与交付证据。— 依赖 Task 1–4 — 文件：`.codex/rules/architecture.md`、本计划文档 — 风险：L2

并行判定：Task 1 与 Task 2 文件集合无交集、无前置依赖且风险均为 L2，因此标记 `[P]`；Task 3/4 各自依赖前置接口，Task 5 依赖全部实现，均串行。

### 数据与错误合同

- 首页只读查询 `news_items`，页大小固定为 5，按 `published_date desc, published_at desc` 排序。
- 详情深链沿用 `/news/article?id=<external_id>`；不触碰现有列表/详情返回状态实现。
- 配置缺失、HTTP 非 2xx、返回非数组和空数组分别归一为用户可理解的降级状态；页面始终保留“进入 AI 资讯”链接。
- DOM 渲染只使用 `textContent` 和显式属性，不拼接不受信任 HTML。
- 不把 service role、采集器配置或内部错误堆栈暴露到客户端。

### 测试策略

- **单元测试**：信息架构关键路由可达、分域 sidebar 不串域；首页资讯行归一化、日期/摘要、查询参数与空/错状态。
- **源码回归**：首页静态主入口、客户端挂载点、独立 CSS 命名空间、减弱动效规则。
- **现有高信号基线**：`home-style-regression`、`reduced-motion`、`supabase-runtime-config`、`postgrest-pagination`（Plan 阶段已验证 9/9 通过）。
- **集成测试**：`pnpm typecheck` 与 `pnpm site:build`；检查根页、课程、RAG、源码、项目、资讯、面试、Notion 产物仍生成。
- **浏览器验收**：桌面与 390px 窄屏、浅色/深色、资讯正常与降级状态、顶栏/侧栏路由、控制台错误。

### 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 分域 sidebar 漏掉页面或破坏前后章 | 中 | 高 | 从 `CHAPTERS` 数据生成，测试所有关键路由和章节数量，构建后抽查 |
| 首页运行时查询成为首屏阻塞 | 低 | 中 | 静态内容先渲染，资讯为有限客户端增强，失败不影响导航 |
| 与现有未提交资讯改动冲突 | 中 | 高 | 不修改 `daily-news-*`、`notion-*`、`interview-*`；只新增首页模块并接入口 |
| 全局 CSS 产生回归 | 低 | 中 | 新建 `portal-home.css`，所有选择器以 `.agent-portal-home` 收口 |
| VitePress SSR 导入浏览器对象失败 | 低 | 高 | DOM 安装放在 `typeof window !== "undefined"` 后；纯函数可离线测试 |
| 参考站技术栈被过度照搬 | 低 | 中 | 明确保留 VitePress/现有部署，只迁移可验证的架构原则 |

### 涉及文件

- 新建：`.vitepress/site-information-architecture.ts`
- 新建：`.vitepress/site-information-architecture.test.mts`
- 新建：`.vitepress/theme/portal-home.ts`
- 新建：`.vitepress/theme/portal-home.test.mts`
- 新建：`.vitepress/theme/portal-home.css`
- 修改：`.vitepress/config.mts`
- 修改：`.vitepress/theme/index.ts`
- 修改：`index.md`
- 修改：`.codex/rules/architecture.md`
- 修改：`docs/plans/2026-07-23-aihot-inspired-site-rearchitecture.md`

### 置信度

高置信（约 88%）。关键接缝已有现成运行时配置、PostgREST 分页器、详情路由和 VitePress 数据驱动章节源；主要未知是最终视觉在真实浏览器的表现，已安排多视口验收。任务数 5、最高风险 L2，满足自动进入 Work 的条件。

## Phase 3: 变更日志（Work）

- 新增统一信息架构模块，顶栏收敛为“首页 / 学习 / 项目 / 情报 / 源码 / 更多”，并按课程、RAG、LangGraph、源码、项目、情报、文档、知识图谱切分上下文 sidebar。
- 重写根首页为静态优先的 Agent 工程门户，建立“学习 / 实践 / 情报”三条主旅程、主题地图、源码系统入口和中性资讯退路。
- 新增命名空间 CSS，覆盖桌面/移动、深浅主题、reduced-motion、AA 对比度与 44px 触控目标。
- 新增首页最新资讯渐进增强：复用公开 Supabase 配置与 `news_items`，固定 5 条、关闭精确计数、使用站内详情路由并保存首页返回路径。
- 为运行时配置和资讯读取建立统一 8 秒生命周期 deadline；SPA 离页取消请求，非首页不执行 DOM 全页扫描，陈旧结果不写入已卸载页面。
- 保留 VitePress、Markdown、既有 URL、数据表和部署架构；未执行生产发布。

## Phase 4: 审查结果（Review）

- 导航审查修复了 VitePress `DefaultTheme` 类型契约和 `/knowledge-graph/` 孤立入口；最终关键路由全部可达，`/agent-build/` 子路径链接不逃逸。
- 运行时审查修复了挂起请求、全站 MutationObserver 扫描、首页无用 `count=exact`、详情返回上下文，以及配置请求不受 deadline 控制的问题；最终 reviewer 无剩余 finding。
- 视觉审查修复了深浅主题小字对比度、34px 新闻触控目标和不真实的无 JS“正在同步”文案；颜色算法测试固定普通文本 4.5:1 下限。
- 代码审查三组 reviewer 最终均报告“未发现仍成立的可操作问题”。
- 定向测试 `39/39`、根 `pnpm typecheck`、VitePress 配置/主题定向 `tsc` 和 VitePress 1.6.4 生产构建通过。
- 浏览器验证：1440×1000 与 390×844 均无横向溢出；浅/深主题正确；最新资讯 `ready` 且为 5 条；箭头为 44×44；首页→课程→首页、首页→详情→返回首页通过；干净标签页控制台无错误。
- 构建只保留既有 >500KB chunk 警告。Windows 受管环境读取 Git 更新时间会报 `spawn EPERM/UNKNOWN`，最终构建期间临时关闭 `lastUpdated` 并在 `finally` 自动恢复为 `true`。

## Phase 5: 复利记录（Compound）

- 架构决策已写入 `.codex/rules/architecture.md`：VitePress 保留、统一 IA、静态优先首页、分域 sidebar、可取消的限量公开读模型、子路径与可访问性合同。
- 解决方案已沉淀到 `docs/solutions/2026-07-23-aihot-inspired-agent-portal-rearchitecture.md`，并关联本计划、列表详情返回方案和会话节点。
- 本轮没有新增跨项目行为本能；关键结论均为本仓库架构和测试合同。
- 本仓库不存在 `scripts/sync-solution-index.js` 与 `docs/solutions/index.jsonl`，按仓库既有约定直接维护 `docs/solutions/*.md`，未伪造同步成功。
- Skill 健康信号目录当前仅有 `compound` 4 条历史记录，低于 healthy=5，状态为 observe；本轮无 20+ 次或纠正 3+ 次的诊断触发条件。
