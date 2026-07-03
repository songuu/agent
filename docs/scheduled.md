---
title: "已安排"
description: "集中展示当前系统已有的定时任务、同步入口和验证边界。"
---

# 已安排

> 这个入口只展示已经在仓库里有脚本、配置或报告证据的任务。它不是“生产一定正在运行”的证明；生产侧是否运行，需要看 PM2/systemd/CI 日志和远端读回。

## 任务总览

| 任务 | 默认节奏 | 手动入口 | 常驻入口 | 数据落点 | 站内入口 |
|------|----------|----------|----------|----------|----------|
| AI 资讯收集 | `NEWS_CRON=0 8 * * *`，`Asia/Shanghai` | `pnpm news:collect` | `pnpm news:cron` | `news_items` | [AI 资讯](../news/index.md) |
| Notion 文章同步 | `NOTION_CRON=30 8 * * *`，`Asia/Shanghai` | `pnpm notion:sync` | `pnpm notion:cron` | `notion_articles` | [Notion 文章](../notion/index.md) |
| Codefather 面试题同步 | `CODEFATHER_INTERVIEW_CRON=5 */2 * * *`，`Asia/Shanghai` | `pnpm supabase:codefather-interview-sync` | `pnpm codefather:interview-cron` | `interview_questions` | [面试题库](../interview/index.md) |
| 每日项目总结 | 由外部 Codex automation 触发 | 复用日报审计命令组 | 外部 automation | `docs/solutions/*-daily-project-summary.md` | [解决方案记录](./solutions/2026-07-03-daily-project-summary.md) |

## 状态边界

| 证据层 | 能证明什么 | 不能证明什么 |
|--------|------------|--------------|
| package.json 脚本 | 本地有可调用入口 | 生产守护进程正在运行 |
| cron 配置源码 | 默认周期、时区、dry-run 行为 | 远端实际环境变量与源码一致 |
| 本地测试 | 解析、去重、分页、映射等逻辑仍可用 | 当前网络、远端 API、Supabase 写入一定成功 |
| Supabase 读回 | 数据真实可被站内匿名读取 | 最近一次任务由哪个 daemon 触发 |
| PM2/systemd/CI 日志 | 生产侧触发、失败、重启、退出码 | 站内页面视觉和交互完全正常 |

## 验证入口

| 任务 | 本地验证 | 线上/远端验证 |
|------|----------|---------------|
| AI 资讯收集 | `pnpm news:test` | Supabase `news_items` 行数、最新 `collected_at`、`/news/` 页面 |
| Notion 文章同步 | `pnpm notion:test` | Supabase `notion_articles` source 覆盖、`/notion/` 页面 |
| Codefather 面试题同步 | `node --experimental-transform-types --test scripts/sync-codefather-interview-to-supabase.test.mts` | Supabase `interview_questions` 的 `codefather-interview-*` 行、`/interview/` 页面 |
| 每日项目总结 | `pnpm typecheck` + 日报 trace 命令 | `docs/solutions/YYYY-MM-DD-daily-project-summary.md` 是否写入并区分事实/推断/未知 |

## 运行纪律

1. 缺少密钥时，任务应进入 dry-run 或显式失败，不把密钥写入 tracked 文件。
2. 写入型任务完成后，必须用目标表读回确认，而不是只看本地日志。
3. 页面展示异常时，先区分“数据没写入”和“前端过滤条件没展示”。
4. 生产状态必须从 PM2/systemd/CI 或远端 HTTP/Supabase 读取，不用本地成功替代。
