---
title: "自托管 Supabase(火山 AIDAP) 数据同步：PostgREST 只能 DML、DDL 走直连"
date: 2026-06-16
tags: [solution, supabase, self-hosted, postgrest, postgres, data-sync, security]
related_instincts: [supabase-selfhosted-sync, kg-data-driven-doc-generation]
aliases: ["自托管 supabase 怎么同步", "PostgREST 不能建表", "password authentication failed 排查", "interview_questions 同步"]
---

# 自托管 Supabase 数据同步

## Problem

要把课程侧结构化数据（`interview_questions` 26 条、`frontier_ecosystem_articles`）同步进一套**自托管 Supabase**（Volcengine AIDAP，host 形如 `*.aidap-global.cn-beijing.volces.com`）。仓库本身无连接配置，本机也无 PG 客户端。期间连接串反复鉴权失败，绕了很多弯才打通。

## Root Cause

自托管 Supabase 把**数据通道**和 **DDL 通道**用**不同认证**隔离：

- PostgREST（`/rest/v1/`，service_role key 认证）只暴露表的 CRUD/RPC，**不能执行 DDL**。
- Studio 内部建表用的 SQL/meta 端点（`/pg/query`、`/platform/pg-meta/default/query`）由**独立网关**守，service_role key 进不去 → 返回 **401**（不是 404，说明端点存在但认证域不同）。
- 直连 Postgres 需要**真实角色密码**；而 Studio 的 Connect → Direct connection 串里密码是 `[YOUR-PASSWORD]` 占位符，**真实值从不显示**。这套 AIDAP 变体的 Settings 也没有「Database password」重置页（只有 API Keys / Data API / JWT Keys）。

结果就是「能写数据 ≠ 能建表」，且「连接串看着对、却一直 `password authentication failed`」。

## Solution

**分两条通道，各司其职：**

1. **建表（DDL）走 SQL Editor 或直连 PG**。表必须先存在，PostgREST 才能灌数。本仓库 migration `supabase/migrations/20260616120000_create_interview_questions.sql` 可直接粘进 SQL Editor 跑。

2. **灌数据（DML）走 PostgREST + service_role key**（HTTP，幂等 upsert）：

   ```ts
   await fetch(`${SUPABASE_URL}/rest/v1/interview_questions?on_conflict=slug`, {
     method: "POST",
     headers: {
       apikey: SERVICE_ROLE_KEY,
       Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
       "Content-Type": "application/json",
       "Content-Profile": "public",                       // 指定 schema
       Prefer: "resolution=merge-duplicates,return=minimal", // on_conflict 幂等
     },
     body: JSON.stringify(rows),
   });
   ```

   回读核对：`?select=slug` + `Prefer: count=exact` + `Range: 0-0` → 读响应头 `content-range`（如 `0-0/26`）。
   见 `scripts/push-interview-questions-to-supabase.ts`。

3. **直连 Postgres（全自动 DDL+DML 用）**：串形如
   `postgresql://postgres:<真实密码>@<ref>.pg.aidap-…:5432/postgres?sslmode=require`，用户名/库名默认都是 `postgres`（别自创角色名瞎试）。本机无 pg 客户端时临时把 `postgres`（porsager，零依赖）装到**仓库外目录**再用绝对路径 require，不污染仓库依赖：

   ```bash
   cd /c/tmp && npm i postgres
   node --env-file=/c/project/my/agent-build/.env -e '
     const sql = require("C:/tmp/node_modules/postgres")(process.env.SUPABASE_DB_URL, { ssl:{ rejectUnauthorized:false } });
     // select count(*) ... '
   ```

4. **`password authentication failed for user X` 排查铁律**：这说明已到达 pg_hba、host/port/ssl 都对，**纯粹是密码不对**——改用户名/库名都没用，唯一变量是密码。没有正确密码就在 SQL Editor 跑 `alter user postgres with password '...'` 重置（一般**不影响 PostgREST**，它内部用独立 `authenticator` 角色连），或建专用 login role 并 `grant create, usage on schema public`。

5. **数据完整性两路交叉验证**：PostgREST count + 直连 `select count/group by` + schema 体检（列/索引/约束/触发器/RLS/FTS 全到位）。本次确认 26 行 = 9 principle + 9 engineering + 8 project，且 `question_id` **无 unique**（吸取 frontier 的位置代理键 P2 教训）。

## Prevention

- **凭据零提交铁律**：连接串 / service_role key 只经 `.env`（先 `git check-ignore .env` 确认被忽略）+ `node --env-file=.env` 注入环境变量；**绝不硬编码、不回显、不提交**。提交后用 `git grep -nE '<password>|<key>|eyJ[A-Za-z0-9_-]{20,}'` 扫 tracked 文件确认零泄漏。
- 新建任何「结构化数据 → Supabase」同步：先确认**表是否已存在**（PostgREST GET `?limit=1` 看 200/404），再决定要不要先建表。
- 单一事实源派生 seed（数据模块 → 生成器 → SQL），seed 的 on-conflict 目标用**稳定自然键**（slug），不要给**按下标派生的代理键**加 unique，否则增删/重排后重跑会撞唯一约束整条失败。

## Related
- [[supabase-selfhosted-sync]] — 本经验的精简记忆版
- [[kg-data-driven-doc-generation]] — 单一事实源派生（seed 的上游模式）
- `scripts/push-interview-questions-to-supabase.ts` / `scripts/generate-interview-questions-supabase-seed.ts`
- `supabase/migrations/20260616120000_create_interview_questions.sql`
