---
title: "Notion 文章全文同步：SDK 版本删方法 + typecheck 作用域盲区 + 双唯一约束 upsert 卡死"
date: 2026-06-17
tags: [solution, notion, supabase, vitepress, sync, sdk-version, typecheck, security]
related_instincts: [verify-installed-sdk-api-before-use, audit-findings-verify-before-apply, supabase-selfhosted-sync]
aliases: ["接入 notion 文章", "notion 同步架构", "databases.query is not a function", "notion-to-md 用哪个版本", "typecheck 假绿", "双 unique 约束 upsert 整批失败"]
---

# Notion 文章全文同步子系统

## Problem

要在现有文章站（VitePress + 自托管 Supabase）基础上，**可配置地同步 Notion 文章**：只同步指定 Notion 文件夹/根页面下的 child_page 子树（database source 保留为可选兼容），把页面全文（blocks→markdown + 图片）同步进站，支持 cron 定时 + 手动 CLI 两种触发。落地中三处坑让"42 绿测 + build 成功 + bundle grep 全过"仍藏着上线即崩的 bug；追加优化还要求 DDL 直接执行，而不是停在 SQL Editor 手动步骤。

## Root Cause

三个独立根因，叠加 + 一个测试盲区放大：

1. **`@notionhq/client@5` 删掉了 `client.databases.query` 方法**。v5 默认 Notion-Version `2025-09-03`，迁到 **data source 模型**：运行时实测 `client.databases.query === undefined`，只有 `client.dataSources.query` 是函数。**用 header 版本 pin（`notionVersion:"2022-06-28"`）救不回方法的存在性**——版本头只改请求契约，不改 SDK 类上挂没挂这个方法。`notion-to-md@3.1.9` 的实战搭档是 v2.x。

2. **`pnpm typecheck` 根本不覆盖 `news-collector/` 与 `.vitepress/`**。根 `tsconfig.json` 的 `include` 只列 `["src","lessons","capstone","knowledge-graph","rag-advanced"]`。新子系统的代码（含既有 news-collector）**从不被 tsc 检查**，`typecheck` 报 0 错对它们是**假信号**。tsx 运行时也不查类型，esbuild `site:build` 同样不 typecheck → 类型层对"真实依赖 API 是否存在"零保护。

3. **双 unique 约束 + 单键 upsert = 整批中止 → 增量永久卡死**。`notion_articles` 同时有 `unique(notion_page_id)`（upsert 冲突键）**和** `unique(slug)`。`on_conflict=notion_page_id` 只 merge 第一个约束；两页派生出同一 slug 会撞 `unique(slug)` 抛 **23505**，让**整批** upsert 失败。而无状态增量水位 `max(notion_last_edited_time)` 是**读自表**的——这批没写成功 → 水位不前进 → 下次重抓同一批 → 同样失败 → 该源**永久卡死**。

4. **放大器：fake-everywhere 测试 + 不 typecheck 的 build 全绿**。42 个 node:test 全用注入 fake（从不调真实 `@notionhq/client`），build 用 esbuild（不查类型），bundle grep 只验"service_role 不在产物"——三道关都过，却没人核对 `databases.query` 在**真实安装的包**里是否存在。

## Solution

1. **刻意 pin `@notionhq/client@^2.3.0`**（v2 原生有 `databases.query` 且默认即 `2022-06-28`），搭 `notion-to-md@^3.1.9`。接任何 SDK 方法前先 `node -e` 核实真实存在：

   ```bash
   node -e "const{Client}=require('@notionhq/client');const c=new Client({auth:'x'});console.log(typeof c.databases.query)"
   # v2.x → "function"；v5 → "undefined"（只有 c.dataSources.query 是函数）
   ```

2. **建 scoped tsconfig 给 include 外的目录做真实类型检查**。`tsconfig.notion.json` extends 根 config，补 `lib:["ES2022","DOM","DOM.Iterable"]`（给主题文件的 HTMLElement/window/document）+ `types:["node","vite/client"]`（给 `import.meta.env`），include 列出所有 notion 文件，配 `pnpm notion:typecheck` 脚本。TS5.7 下 fetch body 的 `Uint8Array` 需收紧为 `Uint8Array<ArrayBuffer>` 才匹配 `BodyInit`。

3. **多 unique 约束的表，派生键要构造性全局唯一**。slug **始终拼 pageId 短前缀**：`const slug = slugBase ? \`${slugBase}-${shortPageId(page.id)}\` : shortPageId(page.id);`（`map.ts`），从源头消除 `unique(slug)` 碰撞，配回归测试守"两页同 explicit slug 必得不同 slug"。

4. **架构：sibling 注入式管线，镜像既有 `collectOnce()`**。`news-collector/src/notion/` 与新闻收集并列、不纠缠：纯编排 `syncNotion(deps)` 注入所有副作用（Notion client / Supabase fetch / Storage / 时钟），cron 与 CLI 共用同一入口。增量无状态：水位 = `max(notion_last_edited_time)`、升序排、`on_or_after` 含界（边界页重取靠 `notion_page_id` 幂等抵消）。**图片重托管**：Notion S3 URL ~1h 过期 → 下载传 Supabase Storage 公共桶，稳定键 `{pageId}/{blockId}-{srcHash}`（srcHash 剥 querystring），per-page manifest 存 `metadata.assets` 供跨运行复用。**安全边界**：RLS anon 只读 `status='published'`，service_role 只进 `.env`、绝不进 bundle；前端 no-Vue 渲染用 markdown-it（`html:false` 转义裸 HTML）+ DOMPurify（client-only 动态 import，SSR 安全）双层防 XSS，纯 filter 模块与 DOM 胶水拆分。

5. **folder scope 优先，不做 workspace 搜索**。`NotionSource` 拆成 `folder | database`，默认模板用 `kind:"folder"` + `rootPageId`；`iterateFolderPages()` 只从该 root 的 `child_page` 递归遍历，root 本身只是边界。即使旧父页没过增量水位也继续递归检查子页，避免旧父页下的新子页被误挡。database source 仍保留，但不再是默认需求。

6. **DDL 可直连 PG 执行并核验**。用 `.env` 的 `SUPABASE_DB_URL` 直连 Postgres 执行 `supabase/migrations/20260617140000_create_notion_articles.sql`，不回显连接串；执行后核验 `notion_articles` exists=true、19 columns、RLS enabled=true。PostgREST 仍只负责 DML，不负责 DDL。

7. **提交前多视角对抗复核核对真实安装包**。本次正是 6 维对抗式审查（核对真实包的运行时 API / 类型）揪出 P0-C（`databases.query` 不存在），fake 测试 + 不 typecheck 的 build 全没发现。

## Prevention

- 接任何外部 SDK：先 `node -e` 核实方法/导出在**当前安装版本**真实存在，再写调用；锁主版本号，升级跨大版本前查 changelog 的 breaking（v5 的 data source 迁移）。见 [[verify-installed-sdk-api-before-use]]。
- 新子系统不在主 `tsconfig.json` 的 include 内时，立刻建 scoped tsconfig + 专用 typecheck 脚本，别信全局 `typecheck` 的 0 错。
- 多 unique 约束的表，所有派生键（slug 等）必须构造性全局唯一；upsert 的 `on_conflict` 只能覆盖一个约束，其余约束的碰撞会让整批 23505 失败。
- 凭据零提交：`NOTION_TOKEN` / `SUPABASE_SERVICE_ROLE_KEY` 只进 `.env`（先 `git check-ignore .env`）；anon RLS 只暴露 `status='published'`；service_role 绝不进前端 bundle（build 后 grep dist 确认缺席）。见 [[secret-never-in-tracked-file]]。
- fake-everywhere 单测 + 不 typecheck 的 build 对"真实依赖 API/类型"零保护：提交前对抗式复核必须有一条核对真实安装包。见 [[precommit-adversarial-review-catches-dom-races]]。

## Related
- [[verify-installed-sdk-api-before-use]] — 本次提炼的高复利本能（SDK 方法落地前核实存在）
- [[audit-findings-verify-before-apply]] — 对抗式审查 findings 落地前对照 ground truth
- [[supabase-selfhosted-sync]] — 自托管 Supabase DML/DDL 双通道 + 凭据零提交
- [[news-collector-system]] — 被镜像的 `collectOnce()` 注入式管线
- `news-collector/src/notion/`（folder/database source + 20 文件管线）、`.vitepress/theme/notion-*.ts`、`supabase/migrations/20260617140000_create_notion_articles.sql`、`tsconfig.notion.json`
- `docs/plans/2026-06-17-notion-articles-sync.md` — 本次 sprint 全文
