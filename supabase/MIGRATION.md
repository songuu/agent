# Supabase 地址迁移运行手册

本仓库的迁移器覆盖“Agent course 内容数据面”：5 张 `public` 表和 Notion 图片 bucket `notion-assets`。
> 范围提醒：本手册和 `pnpm supabase:move` 只处理 **Supabase → Supabase** 地址/项目迁移。若目标是自建 MySQL 或其他数据库，请使用 [可替换内容数据层与 Supabase → MySQL 迁移手册](../docs/solutions/2026-07-23-portable-content-data-layer.md)；两者的对象存储、公开 API 与 writer 切换门禁不同，不能混用。

它不把以下对象误报为已迁移：Auth 用户/会话、Edge Functions、Realtime 配置、Dashboard 配置、第三方 cron、未纳入清单的扩展或 bucket。它们需要单独审计并显式迁移。

## 为什么不能只替换 URL

当前定时任务从 `.env` 和 `news-collector/.env` 读取 `SUPABASE_URL`；前端公开 URL/anon key 过去会在构建期注入静态站。迁移必须同时完成：

1. 新库 schema、数据、RLS/Data API 和匿名读取验证；
2. `notion-assets` 对象复制，并把 `notion_articles` 中的旧 Storage public URL 改为新地址；
3. 写入任务切到 target；
4. 前端公开配置切到 target；
5. 旧端保留，直至观察期结束。

`site:build` 会生成 `.vitepress/public/supabase-runtime-config.json`。该文件只含 URL、anon key、schema；绝不含 service role。已部署包含运行时配置读取器的版本后，前端可优先从该文件取得新地址，构建期注入值只作为回退。

## 准备 profile

在仓库内、且受 `.gitignore` 保护的位置创建两份 profile（cutover 会拒绝工作区外的 profile 路径）：

```powershell
Copy-Item supabase/migration-profile.env.example .env.supabase-source
Copy-Item supabase/migration-profile.env.example .env.supabase-target
```

两份文件都填入自己的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、公开 anon 配置；target 的 `SUPABASE_DB_URL` 必须是新的 PostgreSQL 直连，cutover 也会拒绝缺少该值的 profile，避免残留旧库地址。`NOTION_STORAGE_BUCKET` 缺省时会显式写为 `notion-assets`。profile 绝不提交。

迁移 runner 使用 `psql` 对 target 依次执行 `supabase/migrations/`。如果 runner 没有 `psql`，preflight 会明确停止；不要把 DDL 错误地交给 PostgREST。

## 一键迁移（推荐）

只读演练会执行 preflight 并写入脱敏产物，不会改 target 或 active 配置：

```powershell
pnpm supabase:move -- --migration-id 20260723-supabase-move --source-env .env.supabase-source --target-env .env.supabase-target
```

确认所有写入者均已停住且在途任务已结束后，执行固定序列 `preflight -> stage -> copy -> verify -> cutover`：

```powershell
pnpm supabase:move -- --migration-id 20260723-supabase-move --source-env .env.supabase-source --target-env .env.supabase-target --execute --confirm 20260723-supabase-move --writers-paused
```

该命令不提供跳过 verify 的开关。只有同一 migration id 的 `verify.json` 已写入且所有范围表/Storage 都通过，才会原子切换本地 active 配置。若 target schema 已由受审计流程提前 stage，可额外传 `--skip-schema`。
## 推荐切换序列

先把三个写入者停住或设为 dry-run，等待在途任务结束：

- `NEWS_DRY_RUN=true`
- `NOTION_DRY_RUN=true`
- `CODEFATHER_INTERVIEW_DRY_RUN=true`

然后执行只读预检：

```powershell
pnpm supabase:migrate -- --phase preflight --migration-id 20260723-supabase-move --source-env .env.supabase-source --target-env .env.supabase-target
```

预检通过后，执行 stage、复制与校验。写操作必须带 `--execute`：

```powershell
pnpm supabase:migrate -- --phase all --migration-id 20260723-supabase-move --source-env .env.supabase-source --target-env .env.supabase-target --execute --writers-paused
```

通过后才切本地 active profile。`supabase:cutover --execute` 会强制读取同一 migration id 的 `.supabase-migration/<id>/verify.json`，要求 5 张范围表和 `notion-assets` 都为 `passed: true`；不能用独立 cutover 跳过验收。迁移报告和 cutover 快照统一保存在 `.supabase-migration/<id>/`；该动作会先把当前 `.env`、`news-collector/.env` 与 runtime public config 快照到 `.supabase-migration/<id>/cutover/`，再原子写入新值：

```powershell
pnpm supabase:cutover -- --target-env .env.supabase-target --migration-id 20260723-supabase-move --execute --confirm 20260723-supabase-move
```

最后发布与重启写入者：

- GitHub Actions：更新 `AGENT_BUILD_PRODUCTION_ENV` 中的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，再发布静态站；它绝不能包含 service role。
- PM2/systemd/Compose：将 target 的服务端 Supabase 值部署到实际运行环境，重启 `news-collector`、Notion cron、Codefather 同步；首轮运行后做 target readback。
- 在观察期内保留旧 endpoint 和旧静态 release，确认没有请求继续命中旧地址后再下线。

## 回滚

回滚只恢复 active 配置和前端 public config，不把 target 新写入的数据反向覆盖 source：

```powershell
pnpm supabase:cutover -- --rollback .supabase-migration/20260723-supabase-move/cutover --migration-id 20260723-supabase-move --execute --confirm 20260723-supabase-move
```

随后恢复旧静态 release、旧 writer 环境并重启任务。目标库的迁移产物保留用于排障。

## 验收边界

迁移器分别记录：

- source/target 表行数、自然键集合和稳定内容 hash；
- service-role 读与 anon 读是否都通过；
- `notion-assets` 对象数量、复制结果和 Storage URL 重写；
- schema stage 是否执行、哪些 migration 已处理；
- 是否有未纳入本仓库范围的 Supabase 产品需要人工迁移。

任何一项失败都不得执行 cutover。尤其要确认 target 的 Data API 已暴露相应表：RLS policy 或 GRANT 成功不等于 PostgREST 一定可访问。
