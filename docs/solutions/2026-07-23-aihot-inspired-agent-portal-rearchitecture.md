---
title: "VitePress 内容站重构为任务导向 Agent 知识门户"
date: 2026-07-23
tags: [solution, vitepress, information-architecture, progressive-enhancement, accessibility]
related_instincts: []
aliases: ["AI HOT 启发的网站重构", "Agent 工程知识门户重构"]
---

# VitePress 内容站重构为任务导向 Agent 知识门户

## Problem

站点同时承载课程、项目、资讯、技术长文、面试、源码解析和知识图谱，但首页、顶栏和全局侧栏把这些内容近似同权平铺。用户进入后需要先理解内部目录，而不是直接完成“学习、实践、跟踪前沿”任务。

## Root Cause

- 导航、首页入口和 sidebar 分别硬编码，没有统一的信息架构数据源。
- 一套约 101 项的课程侧栏覆盖资讯、文章等无关页面，形成跨域噪声。
- 首页只有静态资源入口，没有复用既有 `news_items` 读模型展示最新内容。
- 原有全局 CSS 已很大，继续追加非命名空间样式会扩大回归面。
- 动态增强缺少完整生命周期边界：配置请求、数据请求、SPA 离页和陈旧 DOM 写入需要统一治理。

## Solution

1. 保留 VitePress、Markdown、既有 URL 和部署链路，只迁移参考站已公开验证的产品原则：精选入口、完整归档、主题地图和站内深链。
2. 用 `.vitepress/site-information-architecture.ts` 集中定义六组顶栏导航、三条产品支柱和分域 sidebar；配置文件只负责装配。
3. 将根 `index.md` 改为静态优先的语义门户。无 JavaScript 时，“学习 / 实践 / 情报”、主题地图、源码和资讯归档仍全部可用。
4. 以独立 `portal-home.ts` 渐进增强最新情报：
   - 只取最新 5 条，不请求 `count=exact`；
   - 配置与数据读取共用 8 秒生命周期 deadline；
   - SPA 离页同时取消配置和数据请求，并用“节点仍连接 + 当前仍为首页”阻止陈旧写入；
   - 使用 `textContent`，不拼接不可信 HTML；
   - 复用 `withReturnPath`，详情页可返回来源首页。
5. 样式全部收口在 `.agent-portal-home`，分离 text/fill/on-accent token，深浅主题普通文本保持 WCAG AA；小型行动入口至少提供 44px 触控目标，并保留 reduced-motion 规则。

```ts
const lifecycleController = new AbortController();
const deadlineId = window.setTimeout(
  () => lifecycleController.abort(),
  PORTAL_NEWS_TIMEOUT_MS,
);

const config = await getSupabaseRuntimeConfig({
  signal: lifecycleController.signal,
  timeoutMs: PORTAL_NEWS_TIMEOUT_MS,
});
const result = await loadPortalNews(
  config,
  fetch,
  PORTAL_NEWS_TIMEOUT_MS,
  lifecycleController.signal,
);
```

## Verification

- 定向回归：`39/39` 通过，覆盖信息架构、静态退路、运行时状态、超时/取消、无精确计数、返回路径、对比度和 reduced-motion。
- 类型检查：根 `pnpm typecheck`、VitePress 配置与主题文件定向 `tsc` 均通过。
- 生产构建：VitePress 1.6.4 构建完成；仅保留既有的大 chunk 警告。
- 浏览器：1440px 与 390px、浅色与深色均无横向溢出；最新资讯 `ready` 且展示 5 条；新闻入口为 44×44；首页→课程→首页 SPA 跳转、首页→资讯详情→返回首页均通过；干净标签页控制台无错误。
- Windows 受管环境的 Git 时间戳子进程仍会触发 `spawn EPERM/UNKNOWN`。最终构建仅在构建期间临时关闭 `lastUpdated`，并在 `finally` 中恢复源码配置；这属于环境验证绕行，不是产品运行逻辑。

## Prevention

- 新公共内容域必须先加入统一 IA 数据源，并补“入口可达 + sidebar 不串域”测试。
- 首页动态内容必须是可取消、有 deadline 的附加读模型，不能成为静态主旅程的单点故障。
- 子路径部署中的静态入口使用 base-relative 链接；动态链接必须复用项目现有 URL/返回协议。
- 主题颜色不能只凭视觉判断；用相对亮度测试固定 4.5:1 下限。
- 真实浏览器验收要同时检查计算样式、横向溢出、动态状态、SPA 往返和干净控制台。

## Related

- [[2026-07-23-aihot-inspired-site-rearchitecture]]
- [[2026-07-23-async-list-detail-return-restoration]]
- [[session-2026-07-23]]
