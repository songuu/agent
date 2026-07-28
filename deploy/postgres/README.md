# Agent Build PostgreSQL

该目录是 Agent Build 的自建 PostgreSQL 运行资产：内容表与 `content_assets` 二进制图片均由
PostgreSQL 保存，浏览器仅通过同源 Content API 读取。

## 运行边界

- PostgreSQL 只绑定 `127.0.0.1:5432`，不暴露公网。
- `agent_build_reader` 只读且受 RLS 约束。
- `agent_build_writer` 仅供服务器定时任务使用，不进入浏览器或静态产物。
- 密码文件只保存在部署机 `secrets/`，权限必须是 `0600`，禁止提交。
- 数据目录为部署机 `data/`，不随站点 release 切换。

## 部署目录

生产机使用 `/opt/agent-build/shared/postgres`：

```text
postgres/
├── compose.yml
├── data/
├── init/
│   └── 00-create-roles.sh
└── secrets/
    ├── postgres-admin-password
    ├── agent-build-reader-password
    └── agent-build-writer-password
```

## 资产表

部署或恢复环境时，先应用 `20-content-assets.sql`。它创建 `public.content_assets` 并只授权：

- `agent_build_writer`：同步任务写入、覆盖或删除图片；
- `agent_build_reader`：Content API 的只读访问。

Notion 同步会把图片直接写入该表，URL 固定为
`/agent-build/api/content/v1/assets/notion-assets/<object-key>`。`CONTENT_ASSET_PUBLIC_BASE_URL`
必须保持同源绝对路径，不能填写外部 URL。

从旧 Supabase Storage 导入时，使用
`scripts/migrate-supabase-storage-to-postgres.ts --execute --confirm MIGRATE_SUPABASE_STORAGE_TO_POSTGRES`。
该脚本逐对象下载、计算 SHA-256、写入 PG 后再回读校验，并只改写精确匹配的旧公开对象 URL。
