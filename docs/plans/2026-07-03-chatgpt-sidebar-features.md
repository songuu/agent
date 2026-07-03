---
title: "ChatGPT sidebar features"
type: sprint
status: completed
created: "2026-07-03"
updated: "2026-07-03"
checkpoints: 0
tasks_total: 4
tasks_completed: 4
tags: [sprint, feature, navigation, vitepress]
aliases: ["项目与已安排入口"]
invariants:
  - "VitePress 导航仍由 .vitepress/config.mts 统一管理"
  - "新增入口只链接现有内容和脚本，不复制业务实现"
  - "已安排状态必须区分本地入口、生产守护和远端读回"
invariant_tests:
  - "pnpm typecheck"
  - "pnpm site:build"
deferred: []
---

# ChatGPT sidebar features

## Phase 1: 需求分析

截图 OCR 可见 ChatGPT 侧栏新增/前置功能项包含 `项目` 与 `已安排`。当前系统是 VitePress 学习站，已有课程、capstone、源码解析、资讯和定时同步脚本，但缺少同层级的“项目工作区”和“已安排任务”入口。

### Scope

- 新增 `docs/projects.md`，把课程项目、capstone、企业知识库、RAG 系统、源码解析和前沿内容收束成项目工作区。
- 新增 `docs/scheduled.md`，集中展示已有定时任务入口、默认节奏、数据落点、站内入口和验证边界。
- 接入 `.vitepress/config.mts` 顶部导航、侧栏和指南下拉。
- 更新首页和 `docs/navigation.md` 的快速入口。

### Non-scope

- 不实现登录、文件上传、用户级项目存储。
- 不新增真实后台调度器，不替代现有 `news:cron` / `notion:cron` / `codefather:interview-cron`。
- 不声明生产侧 daemon 正在运行；需要远端日志和读回另行证明。

### Success

- 用户能从顶部导航、侧栏、首页和全局导航进入 `项目` 与 `已安排`。
- 两个页面复用现有 Markdown/VitePress 架构，无新增运行时依赖。
- 构建或类型检查给出明确验证结果。

## Phase 2: 技术方案

### 入场扫描 - Invariants 继承

| 子系统 | 上 sprint invariant | 本 sprint 如何保持 |
|--------|---------------------|--------------------|
| VitePress 导航 | `.vitepress/config.mts` 统一管理 nav/sidebar | 只在 config 中加入口，不散落 DOM hack |
| 交互主题 | 自定义主题模块在 `.vitepress/theme/*` | 本期不新增交互模块 |
| 调度任务 | cron/CLI 共用同一业务入口 | 页面只登记已有入口与验证边界 |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 项目入口 | 点击导航/侧栏 | VitePress route | Markdown 文件 | ✅ 静态构建后可见 |
| 已安排入口 | 点击导航/侧栏 | VitePress route | Markdown 文件 | ✅ 静态构建后可见 |

### 入场扫描 - 债务清单

| 来源 sprint | 议题 | 本 sprint 决策 | deadline |
|-------------|------|----------------|----------|
| N/A | N/A | 无继承债务 | N/A |

### Task Breakdown

- [x] Task 1: 新增 `docs/projects.md`。
- [x] Task 2: 新增 `docs/scheduled.md`。
- [x] Task 3: 更新 `.vitepress/config.mts`、`index.md`、`docs/navigation.md`。
- [x] Task 4: 运行验证并记录结果。

## Phase 3: Work

- 新增项目工作区页面，按“工作区/目标/入口/完成证据”组织。
- 新增已安排页面，按“任务/默认节奏/入口/数据落点/站内入口”和“证据边界”组织。
- 导航接入顶栏、侧栏、指南下拉、首页 feature 和全局导航快速入口。

## Phase 4: Review

| 视角 | 结果 |
|------|------|
| 架构 | 复用 VitePress 配置与 Markdown 内容层，无新增框架 |
| 安全 | 未新增密钥、API、生产写入；已安排页明确密钥不入 tracked 文件 |
| 性能 | 静态内容页，构建影响可忽略 |
| 代码质量 | 入口集中在 config，内容页只做索引与边界说明 |
| 测试覆盖 | 类型检查和站点构建作为 L1/L2 验证 |
| 集成连续性 | 未破坏原有 sidebar/nav；新增页面由现有 rewrite/cleanUrls 处理 |

## Phase 5: Compound

### 经验

- 对截图型“借鉴小功能”，先识别信息架构层级，再映射到当前系统已有架构，避免把产品导航需求误做成后端功能。
- “已安排”类页面必须把本地脚本存在、daemon 运行、远端写入、页面展示四层证据分开写。

### 验证

- `pnpm typecheck`: pass，`tsc --noEmit` 通过。
- `pnpm site:build`: 沙箱内因 esbuild `spawn EPERM` 失败；无沙箱重跑通过，build complete in 43.93s，仅保留 chunk size warning。
- `curl.exe -I http://127.0.0.1:5176/docs/projects`: HTTP 200。
- `curl.exe -I http://127.0.0.1:5176/docs/scheduled`: HTTP 200。
