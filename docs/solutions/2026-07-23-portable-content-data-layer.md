# 可替换内容数据层与 Supabase → MySQL 迁移手册

## 结论

内容数据平面不再要求浏览器、新闻采集器和 Notion 文章库直连 Supabase。当前实现把五张内容表的读写协议固定为可替换端口，已经可在 **Supabase** 与 **MySQL 8.0.19+** 间切换；后续接入 PostgreSQL、自建 TiDB 或其他数据库时，只需新增服务端适配器，不改前端页面和采集编排。

```mermaid
flowchart LR
  browser["VitePress 浏览器"] --> api["同源 Content API"]
  api --> readPort["ContentReadRepository"]
  readPort --> supaRead["Supabase 适配器"]
  readPort --> mysqlRead["MySQL 适配器"]
  news["news-collector"] --> writePort["ContentRepository"]
  notion["Notion 同步"] --> writePort
  writePort --> supaWrite["Supabase 适配器"]
  writePort --> mysqlWrite["MySQL 适配器"]
  notion --> assets["对象存储：当前仍为 Supabase Storage"]
```

上图的对象存储刻意没有塞进 MySQL：关系数据、附件对象和公开读 API 是三个独立的替换边界。

## 当前已落地的能力

| 范围 | 现状 | 验收边界 |
| --- | --- | --- |
| 五张内容表 | `frontier_ecosystem_articles`、`interview_questions`、`glossary_terms`、`news_items`、`notion_articles` 有固定列、自然键、MySQL DDL 和参数化 upsert | 行数与稳定内容 hash |
| 浏览器读取 | 8 个原直连页面先调用同源 `/api/content/v1/*`，Supabase 仅可选灰度回退 | 不再向浏览器发布 DB URL/key 后仍可读 |
| 新闻采集器 | `collectFromConfig()` 会按 `CONTENT_REPOSITORY_DRIVER` 选择 Supabase 或 MySQL，并在一次任务后关闭 MySQL pool | 报告中的 `stored`、`tableCount` 与目标库 readback |
| Notion 关系数据 | 游标、图片 manifest、`notion_articles` upsert 走同一内容仓库 | MySQL 可接管文章/游标；图片上传仍须有对象存储 |
| 公开权限 | Content API 限定资源、字段、过滤/排序；Notion 读取强制 `status=published` | 不依赖旧 Supabase RLS 才能保护草稿 |
| 一键关系迁移 | `content:migrate:mysql` 按预检 → 建表 → 复制 → hash 校验执行，并要求显式停写确认 | 只覆盖五张关系表，不等同完整 Supabase 平台迁移 |

## 运行时配置

服务端可使用一条 MySQL URL，或使用分项凭据，不能混用。它们只放在运行时 env，绝不能使用 `NEXT_PUBLIC_` 前缀。

```dotenv
CONTENT_API_ENABLED=1
CONTENT_REPOSITORY_DRIVER=mysql
CONTENT_MYSQL_URL=mysql://content_app:replace-password@mysql.internal:3306/agent_build
CONTENT_MYSQL_SSL=true

# 浏览器只得到同源路径；没有数据库 host、用户、密码或 service role。
NEXT_PUBLIC_CONTENT_API_BASE_URL=/agent-build/api/content/v1
```

迁移灰度期间可保留以下两个公开 Supabase 字段作为只读回退。Content API 成功稳定后移除它们，再重新构建静态站：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://old-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=old-anon-key
```

`CONTENT_REPOSITORY_DRIVER=mysql` 却缺凭据会启动即失败，不会静默把写入送回旧 Supabase。未设置 driver/任何 MySQL 配置时保持既有 Supabase 兼容行为。

## 一键迁移五张关系表

先准备本地、被 `.gitignore` 保护的 profile：

```powershell
Copy-Item scripts/content-migrate/source.env.example .env.content-source
Copy-Item scripts/content-migrate/target.mysql.env.example .env.content-mysql
```

先运行只读预检；默认不会连接或写入 MySQL：

```powershell
pnpm content:migrate:mysql -- --migration-id 20260723-content-mysql --source-env .env.content-source --target-env .env.content-mysql
```

确认所有内容写入者已停住、在途任务已结束后，再执行固定序列：

```powershell
pnpm content:migrate:mysql -- --phase all --execute --writers-paused --migration-id 20260723-content-mysql --source-env .env.content-source --target-env .env.content-mysql
```

该命令会：

1. 输出脱敏预检范围；
2. 在 MySQL 建立五张内容表，并通过 `INFORMATION_SCHEMA` 核验列类型、InnoDB/utf8mb4、主键、自然键唯一约束和查询索引；已有但不符合契约的表会失败，不能蒙混进入 copy；
3. 通过 Supabase service-role 分页读取受控字段，强制 `Prefer: count=exact` 和精确 `Content-Range`；服务端 `max_rows` 截断、忽略 Range 或总数变化会直接失败，不能把短页当作末页；
4. 按自然键参数化 upsert 到 MySQL，再重新读取两端，比较行数和去除 JSON key 顺序/UTC 格式差异后的稳定 hash；
5. 把每阶段脱敏结果写入 `.content-migration/<migration-id>/`。

复制和建表必须同时提供 `--execute`；复制还必须提供 `--writers-paused`。后者是**人工停写确认，不是分布式锁**：它不能远程停止 Codefather、旧 `push-*-to-supabase` 或其他独立 cron。执行前必须在部署侧实际停住这些 writer、等待在途任务结束，并在切换后将它们改接 `ContentRepository`；否则不能宣称完成无丢写迁移。

## 切换顺序

1. 暂停 `news-collector`、Notion cron、Codefather 同步和任何手工 `supabase:*push` 任务。
2. 运行关系表迁移并确认 `verify.passed=true`。
3. 迁移 `notion-assets` 到 S3/MinIO/OSS/COS 等目标对象存储，核对对象 key、数量、Content-Type 和抽样下载。
4. 定向改写 `notion_articles.body_markdown`、`metadata.assets.*.publicUrl`，并防御性检查 `cover_image_url` 中是否仍有旧 Storage 域名。
5. 部署 `agent-build-content-api`，先同时保留 Supabase public fallback 做灰度；检查浏览器请求已优先命中 `/api/content/v1/*`。
6. 将 runtime env 切至 MySQL，重新启动 content API、news collector 和 Notion cron；分别做 DB readback 与最近日志检查。
7. 移除 `NEXT_PUBLIC_SUPABASE_*`、重新发布静态站；观察期内保留旧库和旧对象域可读，验证回滚。

## 未自动覆盖的边界

- **Supabase Storage**：当前 Notion 图片仍通过 `news-collector/src/notion/storage.ts` 上传。MySQL 切换后可保留它作为临时资产后端，但“完全不使用 Supabase”需要新增 `AssetStore` 的 S3/MinIO/OSS/COS 适配器后再切。
- **Codefather 与旧手工推送脚本**：`sync-codefather-interview-to-supabase.ts`、`push-*-to-supabase.ts` 仍是旧 PostgREST 专用入口。切换窗口必须停住它们；后续应改为调用 `ContentRepository.upsertTableRows()`，再允许它们重新启用。
- **Supabase 专属平台能力**：Auth、RLS、Edge Functions、Realtime、Dashboard 配置不在关系迁移内。公开读取授权已由 Content API 实施；其余能力需单独选型。
- **对象 URL 的建模**：未来应持久化稳定 `storageKey`，由 API/CDN 解析可访问 URL，不再把 provider public URL 当作永久业务标识。

## 扩展到其他数据库

新增数据库时实现两条服务端端口即可：

- `ContentRepository`：五张表的 upsert、Notion cursor、Notion asset manifest；
- `ContentReadRepository`：Content API 的白名单读取操作。

前端不得增加新的数据库 SDK 或公开凭据。迁移器则应从同一 `CONTENT_TABLES` manifest 做导出、写入与 hash 校验，保持自然键不变。

## 验证命令

```powershell
pnpm content:api:typecheck
pnpm content:api:test
pnpm news:repository:typecheck
pnpm news:repository:test
pnpm notion:typecheck
pnpm content:migrate:mysql:typecheck
pnpm content:migrate:mysql:test
```

这些都是本地契约/类型验证；本次没有使用真实 Supabase 或 MySQL 凭据执行远端迁移。远端切换仍需按上面的数据、对象存储、前端 API 和 writer 日志四层分别验收。