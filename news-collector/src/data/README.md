# 可替换内容库写入层

这个目录把五张应用内容表的写入协议固定为 `ContentRepository`。`news-collector` 与 Notion 同步的关系数据已通过它选择 Supabase/PostgREST 或 MySQL，业务编排不再直接依赖某个数据库驱动：

- `frontier_ecosystem_articles` → `slug`（同时保护 `source_url` 的唯一性）
- `interview_questions` → `slug`
- `glossary_terms` → `slug`
- `news_items` → `external_id`
- `notion_articles` → `notion_page_id`（同时保护 `slug` 的唯一性）

## Public exports

- `content-repository.ts` — `ContentRepository`、`ContentUpsertResult`
- `content-table-contracts.ts` — 五张表的列、自然键、JSON/时间字段契约
- `supabase-content-repository.ts` — 当前 PostgREST 协议适配器
- `mysql-content-repository.ts` — MySQL 参数化写入器、`MySqlExecutor`、`createMysql2Executor`
- `repository-config.ts` — `CONTENT_REPOSITORY_DRIVER` 和单一 URL/分项 MySQL 私有配置解析
- `runtime.ts` — worker composition root，按任务创建并关闭 Supabase/MySQL repository
- `mysql-schema.ts` — `MYSQL_CONTENT_SCHEMA_SQL`，MySQL 8.0.19+ 基线 schema

`mysql-content-repository.ts` 不安装也不 import `mysql2`。部署边界创建连接/连接池后，注入：

```ts
import { createPool } from "mysql2/promise"; // 仅部署应用的 composition root 依赖
import { createMysql2Executor, createMySqlContentRepository } from "./mysql-content-repository.ts";

const connection = await createPool({ /* CONTENT_MYSQL_* 私有配置 */ }).getConnection();
const repository = createMySqlContentRepository({ executor: createMysql2Executor(connection) });
```

生产 composition root 已按每次 job 生命周期创建并关闭连接池。密钥只允许服务端环境变量；推荐单一 URL，Content API、worker 与迁移器可共用：

```text
CONTENT_REPOSITORY_DRIVER=mysql
CONTENT_MYSQL_URL=mysql://collector:...@db.internal:3306/agent_build
CONTENT_MYSQL_SSL=true
```

也可改用 `CONTENT_MYSQL_HOST/PORT/DATABASE/USER/PASSWORD` 分项配置，但不得和 URL 混用。未设置 `CONTENT_REPOSITORY_DRIVER` 或任何 MySQL 配置时明确保持 `supabase`；设置为 `mysql` 却缺任一私有配置会报错，绝不静默写回旧 Supabase。

## MySQL 语义

值全部使用 prepared-statement 参数绑定；表名和列名只来自代码内契约。写入采用 MySQL 8.0.19 引入的 row alias 形式 `INSERT ... VALUES ... AS new ON DUPLICATE KEY UPDATE`，不使用已弃用的 `VALUES(column)`。

MySQL 的 duplicate-key 会命中任意唯一键，不像 PostgreSQL 的 `ON CONFLICT (key)` 只匹配指定键。因此更新表达式会校验自然键：若 `frontier.source_url` 或 `notion.slug` 撞上另一条自然键不同的记录，会触发数据库错误，而不是把两条内容悄悄合并。

`tags`、数组字段和 `metadata` 采用 MySQL `JSON`；时间统一转为 UTC `DATETIME(3)`；全文索引用 `FULLTEXT`，不能假定与 PostgreSQL `tsvector + GIN` 的中文分词/排序完全等价。

## 迁移边界（必须分开验收）

这个端口覆盖**关系型内容写入和 Notion 检查点读取**。当前 Notion 同步已将 cursor、asset manifest 和文章 upsert 接到该端口；完整替库还需要：

1. 先部署 `MYSQL_CONTENT_SCHEMA_SQL`，导入五张表并核对自然键、行数、抽样内容和排序。
2. 暂停所有 writer，记录 cutover 时刻；复制完成后校验后再启新 writer。否则增量窗口会丢写或重复写。
3. Notion 的 `notion_last_edited_time` 必须随表复制，才能继续增量同步；否则会全量 backfill。
4. Storage 独立迁移：`notion_articles.body_markdown`、`cover_image_url` 和 `metadata.assets.*.publicUrl` 都可能含 Supabase bucket URL；复制对象后需要定向重写，不能把旧 provider URL 当持久引用。
5. Auth、RLS、匿名读取、PostgREST REST API 不会随 MySQL 自动存在。当前 VitePress 读取端仍直连 PostgREST，必须与新的 server-side Content API/read repository 一起切换，不能只切 worker 写入。
6. 保留源库可读直到新库的写入、读取、Storage、前端发布和回滚演练分别验证完成。

其它数据库只需实现相同 `ContentRepository` 和五张 `ContentTableContract`，不应把某个 driver 反向 import 到同步编排层。

## 验证

```powershell
pnpm news:repository:typecheck
pnpm news:repository:test
```
