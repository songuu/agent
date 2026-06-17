---
title: "接入 Notion 文章：可配置全文同步"
type: sprint
status: completed
created: "2026-06-17"
updated: "2026-06-17"
checkpoints: 0
tasks_total: 23
tasks_completed: 22
tags: [sprint, feature, notion, supabase, vitepress]
aliases: ["Notion 文章同步", "notion-articles-sync"]

# 本 sprint 立的不变量（后续 sprint 必须保持）
invariants:
  - "service_role / NOTION_TOKEN 永不进前端 bundle，前端只用 anon 只读"
  - "幂等键 notion_articles.notion_page_id，重跑同步不增行"
  - "Notion 临时 S3 图片 URL 必须 sync 期重托管，库里不存会过期的链接"
  - "缺 NOTION_TOKEN 自动 dryRun，不写库（mirror loadConfig）"
  - "anon RLS USING(status='published')：草稿绝不漏给前端"
  - "Notion client 固定 notionVersion=2022-06-28（载荷性 pin，配 notion-to-md 3.1.9）"
  - "正文 innerHTML 前过 markdown-it html:false + DOMPurify（XSS 纵深防御）"

invariant_tests:
  - news-collector/__tests__/notion-config.test.mts
  - news-collector/__tests__/notion-sync.test.mts
  - news-collector/__tests__/notion-map.test.mts
  - news-collector/__tests__/notion-query.test.mts
  - news-collector/__tests__/notion-assets.test.mts
  - news-collector/__tests__/notion-store.test.mts
  - news-collector/__tests__/notion-client.test.mts
  - news-collector/__tests__/notion-client-version.test.mts
  - .vitepress/theme/notion-markdown.test.mts
  - .vitepress/theme/notion-articles-filter.test.mts
  # 一键：pnpm notion:test（10 文件 56 用例）+ pnpm notion:typecheck（真实类型检查）

deferred:
  - sprint: next
    item: "Notion dataSources.query 迁移（脱离 2022-06-28 pin）"
    deadline: "2026-09-01"
    reason: "v1 pin 旧契约让 notion-to-md 3.1.9 可用；Notion 弃用旧版前迁移"
  - sprint: next
    item: "硬 prune（Notion 删页→set-difference 归档）"
    deadline: "2026-09-01"
    reason: "默认 OFF，避免瞬时空查询误归档；v1 用 soft status 足够"
  - sprint: next
    item: "cover/icon/pdf/video 重托管（v1 仅图片）"
    deadline: "2026-09-01"
    reason: "v1 聚焦正文图片；其余 file.type='file' 资产后续覆盖"
  - sprint: next
    item: "详情页静态 SEO（动态路由/预渲染）"
    deadline: "2026-09-01"
    reason: "v1 运行时取与 news/frontier 一致；公开营销需求出现再做"
  - sprint: next
    item: "Notion 改回草稿/删除时站内自动下线（unpublish demote / prune）"
    deadline: "2026-09-01"
    reason: "v1 query 只取已发布页，unpublish 不被重抓；需查全量+status 映射或独立 prune"
  - sprint: next
    item: "详情页 SPA 同路径切 slug 重渲染（WeakSet 守卫升级）"
    deadline: "2026-09-01"
    reason: "v1 无文间互链不触发；加入上一篇/下一篇时需处理"

deadcode_until: []
---

# 接入 Notion 文章：可配置全文同步

> 在现有「文章」体系（news_items 每日资讯 / frontier_ecosystem_articles 策展档案）之外，
> 新增第三类内容：**Notion 文章**——把指定 Notion 文件夹/根页面下的文章**全文**可配置地
> 同步进自托管 Supabase 新表 `notion_articles`，并在站内**新列表页 + 详情页**渲染。

## 决策前提（用户已确认，2026-06-17）

| 分歧 | 选择 |
|------|------|
| 落库定位 | **新建独立 `notion_articles` 表 + 新页面**（非并入 news_items / frontier） |
| 正文粒度 | **全文同步进库站内渲染**（需 Notion blocks → markdown 转换器 + 图片托管） |
| 同步触发 | **cron + 手动 CLI 都要**，共用一个 `syncNotion()` 入口 |

---

## Phase 1: 需求分析（Think）

### 一句话目标
让站点支持「可配置地把指定 Notion 文件夹/根页面下的文章全文拉进来、站内阅读」，写一次配置（token + root page id）后，
cron 定时与手动 `pnpm notion:sync` 都能增量、幂等地把 published 文章同步进 `notion_articles` 并在站内渲染。

### Scope（做）
1. **新表** `notion_articles`：migration（RLS anon 只读 published + service_role 全 DML、tsvector、updated_at trigger、gin 索引），身份键 `notion_page_id`，增量字段 `notion_last_edited_time`。
2. **Notion 连接器**：`@notionhq/client` 从指定 root page/folder 递归遍历 child_page（database source 可选）→ 取页面 blocks（递归嵌套）→ blocks→markdown 全文。
3. **图片持久化**：Notion 文件是临时 AWS S3 签名 URL（~1h 过期）→ sync 期重托管到稳定存储（策略由设计 workflow 定：Supabase Storage / 下载提交 `public/`）。
4. **同步编排** `syncNotion()`：fetch(notion) → normalize → 图片重托管 → 幂等 upsert `notion_articles`；缺 token 自动 dryRun。
5. **配置**：`NOTION_TOKEN`（仅 .env）+ Notion 来源注册表（mirror `sources.ts`，默认 folder source，支持可选 database source），zod 边界校验。
6. **触发**：手动 CLI `pnpm notion:sync`（mirror `cli-collect.ts`，`--env-file=.env`）+ cron（复用/扩展 `news-collector/src/cron.ts` 加第二个 schedule，独立 `NOTION_CRON`）。
7. **渲染**：新**列表页**（日期/标签筛选，复用 anon 只读 + `fetchAllPostgrestRows` + MutationObserver 模式）+ **详情页**（全文 markdown 渲染）。
8. **测试**：纯逻辑离线测（property→field 映射 / blocks→markdown / 增量判定 / config zod / row 映射），smoke 免 key 先行；site:build 验证 bundle。

### Non-scope（不做）
- 反向同步（站内 → Notion 写回）。
- Notion 实时 webhook（本期 cron + 手动已够；列为可后续）。
- 评论 / 点赞写入（沿用现有只读语义，read_count 同 news_items）。
- 富文本所见即所得编辑器 / 在站内编辑 Notion。
- 多 workspace OAuth（单 integration token 即可）。
- 把 Notion 内容混进 `news_items` / `frontier_ecosystem_articles`（已定独立表）。

### Success（验收标准）
- 配 1 个 Notion 文件夹/根页面 + token，`pnpm notion:sync` 只把该 root 下 child_page 子树的文章全文 upsert 进 `notion_articles`；**重跑幂等**（不增行、不重复上传图片）。
- 站内列表页列出文章；详情页正确渲染正文（标题 / 列表 / 代码 / 图片），**图片 1 小时后仍可见**（重托管生效）。
- 缺 `NOTION_TOKEN` 自动 dryRun 不写库；**service_role / token 不进前端 bundle**（grep `dist/assets/chunks/theme.*.js` 验证）。
- **增量**：未改动的页面第二次同步被跳过（`last_edited_time` 比对）。
- 纯逻辑单测全绿 + `pnpm site:build` 通过。

### Risks（待 Phase 2 由设计 workflow 细化缓解）
| 风险 | 等级 | 方向 |
|------|------|------|
| Notion 图片 S3 URL ~1h 过期（**最大坑**） | 高 | sync 期重托管，库里只存稳定 URL |
| Notion API 限流 ~3 req/s + 分页 + 嵌套 block | 中 | 退避 + 递归取 children + 100/页游标 |
| blocks→markdown 保真（callout/toggle/embed/公式/代码语言） | 中 | 选成熟库 + 不支持块降级 + 单测固定样本 |
| 前端 `innerHTML` 渲染 markdown 的 XSS 面 | 中 | 内容自有 + 仍做 sanitize；评估谁能编辑 Notion |
| VitePress 详情页路由：build 期生成 vs 运行时取 | 中 | 与现有 news/frontier 运行时取保持一致性，workflow 定 |
| 自托管 Supabase DDL 要先 SQL Editor 手跑（PostgREST 不能 DDL） | 中 | migration 落库前提示手跑；参考 [[supabase-selfhosted-sync]] |
| 密钥纪律：`NOTION_TOKEN` 绝不进 tracked 文件 | 高 | 仅 .env + .env.example 占位；参考 [[secret-never-in-tracked-file]] |

### 与现有架构的契合点（为何低风险落地）
- `collectOnce()` 已是纯编排、副作用全注入 → 但 Notion 目标表/管线不同（无 RSS、无 url 去重、有全文 + 图片重托管），**倾向独立 sibling 模块复用 store/config 模式**而非硬塞进 news 管线（最终由 workflow 的 sync-orchestration 面裁定）。
- 渲染层已有「构建期注入 anon 配置 → `fetchAllPostgrestRows` → MutationObserver 挂载 → no-Vue 纯逻辑可测拆分」成熟模式，列表页直接复用。
- push 脚本 / npm script / migration 三件套约定成熟，照搬即可。

---

## Phase 2: 技术方案（Plan）

> 由设计 workflow `wymg94l4v`（5 agent 并行，357k tokens，强制 Research&Reuse：gh/npm/官方文档）综合。

### 入场扫描 — Invariants 继承（沿用 news-collector 子系统纪律）

| 子系统 | 继承 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| 渲染层 | service_role 永不进 bundle，前端仅 anon 只读 | 复用 `__FRONTIER_SUPABASE_CONFIG__`(anon)；service_role/NOTION_TOKEN 仅 Node 侧；site:build 后 grep dist 验无 service_role JWT |
| 存储层 | 幂等 upsert（冲突键 + merge-duplicates） | `notion_articles` 冲突键 `notion_page_id`，clone `upsertNewsItems` |
| 配置层 | 缺凭据自动 dryRun，密钥仅 .env | `loadNotionConfig` 缺 NOTION_TOKEN/Supabase → dryRun；`.env.example` 仅占位 |
| 主题层 | no-Vue 纯逻辑可测拆分 + bundle-grep 验证 | filter/markdown 纯逻辑抽模块 node:test；运行时字面量 grep `theme.*.js` |
| 主题层 | 动画↔reduced-motion 镜像 | 复用 frontier-* 卡片 CSS（已处理）；新增位移动画须同步 reduced-motion 块 + CSS-diff 守门 |
| 自托管 | 火山 AIDAP：PostgREST 不能 DDL | migration 须 SQL Editor 手跑（见 [[supabase-selfhosted-sync]]） |

### 入场扫描 — 集成路径

| 改动点 | 触发 | 中间层 | 持久化 | 刷新后可见 |
|--------|------|--------|--------|------------|
| Notion 编辑 published 页 | cron / `pnpm notion:sync` | `syncNotion` → 转换 → 图片重托管 → upsert | ✅ `notion_articles` | ✅ 列表/详情运行时 anon 取，**无需 rebuild** |
| 正文内图片 | 同步期 `rehostNotionImage` | Supabase Storage 上传 | ✅ Storage public bucket | ✅ 独立于 rebuild 服务 |
| 图片（Storage 不可用退化） | 同步期失败回退 | 写 `public/notion-assets/` | ✅ git tracked | ⚠️ **需 rebuild 才生效** ← 退化路径的已知代价 |

### 入场扫描 — 债务清单
本 sprint 为新子系统，无继承半完成债务。本期主动延后项见 frontmatter `deferred:`（dataSources.query 迁移 / 硬 prune / cover&pdf&video 重托管 / 静态 SEO）。

---

### 关键决策（已裁定）

1. **模块位置**：sibling `news-collector/src/notion/`——复用 config/store/cron/CLI/test 模式，但**独立管线**（无 RSS/无 classify/无 URL 去重/有全文+图片重托管），不硬塞进 `collectOnce()`。
2. **Notion SDK 版本**：`@notionhq/client@^5.22.0` 但 client 固定 `notionVersion:"2022-06-28"`（**载荷性 pin**）——让 `databases.query` 与 `notion-to-md@3.1.9` 内部调用同吃旧契约，避免 data_source 发现间接层。v1 刻意 stopgap，加版本断言 test；`dataSources.query` 迁移 → deferred。
3. **block→markdown**：`notion-to-md@^3.1.9`（成熟稳定，Pipedream/Flowise 在用；v4 仅 alpha 不用）。暴露 `setCustomTransformer("image")` 作图片 hook。
4. **图片持久化**：**Supabase Storage public bucket `notion-assets` 主**（运行时渲染 ⟹ 不能用 build 期 public/）；按 `file.type`('file' 重托管 / 'external' 直通)；稳定 key=S3 path **去 querystring**+blockId；per-page manifest 存 `metadata.assets` 保幂等。**探针先验 Storage 可用性**，不可用则 public/ 退化（接受 rebuild 耦合）。
5. **详情页 SoT**：**运行时 anon 取**（与 news/frontier 一致），非 VitePress 动态路由/build 数据加载——Notion 编辑即时可见、零 build 耦合。单壳 `docs/notion/article.md` + `?slug=` query 参（规避 README+rewrites+cleanUrls 断链坑）。
6. **正文渲染 XSS**：`markdown-it`(`html:false` 转义裸 HTML) + **DOMPurify** sanitize 再 innerHTML（Notion 多人可编辑，纵深防御）。`markdown-it`/`@types/markdown-it`/`dompurify` **必须直接声明 devDep**（验证 markdown-it 从根不可解析，重蹈 mermaid hoist 白屏坑）；DOMPurify 仅客户端（SSR 无 window）。
7. **RLS 可见性**：anon SELECT `USING(status='published')`（区别于 news/frontier 的 `USING(true)`）——草稿绝不漏给前端 bundle。
8. **增量**：无状态高水位——`SELECT max(notion_last_edited_time)` 当游标，`last_edited_time` on_or_after(含界) + 升序，幂等 upsert 让边界重取成 no-op；soft status（unpublish→status，非 DELETE）。

### 数据模型 `notion_articles`（DDL 要点）

镜像 news_items 约定：pgcrypto / RLS / generated `search_text` tsvector / updated_at trigger / gin 索引 / notify pgrst。
列：`notion_page_id text UNIQUE`(冲突键) · `slug text UNIQUE`(详情路由) · `source_key` · `title` · `summary` · `body_markdown text`(全文) · `cover_image_url` · `tags text[]` · `status text CHECK(draft|published|archived)` · `published_at timestamptz` · `published_date date` · `notion_url` · `notion_last_edited_time timestamptz`(增量水位) · `metadata jsonb`(含 `assets` manifest) · `search_text`(title+summary+body) · `read_count` · created/updated_at。**省略 8 层 ecosystem 枚举**（Notion 作者驱动不可靠映射），用 tags 替代。
索引：gin(tags, search_text) + btree(published_date desc, notion_last_edited_time desc)。RLS：anon/authenticated SELECT `USING(status='published')`；service_role 全 DML。

### 任务拆解（23 task，按依赖分 6 组；每 5 task 自动 checkpoint 评估）

> 风险等级：L4=认证/数据/密钥 · L3=核心逻辑 · L2=常规 · L1=低风险新增 · L0=样式/文案

**A 数据底座**
- [ ] A1 加依赖：`@notionhq/client@^5.22.0`+`notion-to-md@^3.1.9`，devDep `markdown-it@^14.2`+`@types/markdown-it@^14.1`+`dompurify@^3.4`；`pnpm install` 后验 `require.resolve('markdown-it')` 从根可解析、`.npmrc` hoist 生效。`L1`
- [ ] A2 migration `supabase/migrations/20260617140000_create_notion_articles.sql`（上方 DDL；自托管须 SQL Editor 手跑）。`L2`
- [ ] A3 `notion/types.ts`：`NotionArticle` 接口(1:1 列) + `notionArticleSchema` zod 边界校验 + `notion-types.test.mts`(空 title/非法 UUID 拒绝、status 枚举、断言 RLS 文本含 `status='published'`)。`L2`

**B Notion 接入**
- [ ] B1 `notion/client.ts`：`createNotionClient` 固定 `notionVersion:"2022-06-28"`(WHY 注释) + 429 Retry-After 退避 + 并发限流；node:test 断言 pin 常量。`L3`
- [ ] B2 `notion/query.ts`：`databases.query` via `iteratePaginatedAPI`，filter=Published+`last_edited_time` on_or_after，升序；注入 fake 测 filter 形状 + 分页遍历。`L3`
- [ ] B3 `notion/convert.ts`：`NotionToMarkdown` 包装(`pageToMarkdown`→`toMarkdownString`)，暴露 `setCustomTransformer("image")` 图片 hook。`L2`
- [ ] B4 `notion/map.ts`：纯 `toNotionArticle`（title 取 title property **非 H1**；tags 来自 multi_select；slug；dates 回退 last_edited_time；watermark）+ zod；`map.test.mts`。`L3`

**C 图片托管**
- [ ] C1 探针：curl `POST /storage/v1/bucket` 验自托管 Storage 可用性 → 定主策略；不可用记入 deferred 改 public/ 退化为主。`L1`
- [ ] C2 `notion/storage.ts`：`ensureBucket(public,409 当成功)`、`uploadObject`(Bearer service_role、x-upsert、cache immutable、Content-Type)、`publicUrl`；注入 fetchImpl。`L3`
- [ ] C3 `notion/assets.ts`+`asset-manifest.ts`：`rehostNotionImage` 按 `file.type` 分支，稳定 key=path 去 querystring+blockId，manifest 幂等(不重传)，per-image 故障隔离 → public/ 退化；`assets.test.mts`(直通/重传一次/querystring 变不重传/失败退化/content-type)。`L3`

**D 编排**
- [ ] D1 `notion/notion-sources.ts` 注册表(mirror sources.ts：key/name/databaseId/defaultTags/enabled，可配多库) + `notion/config.ts` zod + `loadNotionConfig`(缺 token→dryRun) + `NOTION_CRON/TZ/MAX_PAGES/CONCURRENCY`；`notion-config.test.mts`。`L2`
- [ ] D2 `notion/cursor.ts`：`fetchMaxLastEdited`(无状态 DB-max 高水位，per source_key)。`L2`
- [ ] D3 `notion/store.ts`：`upsertNotionArticles` on_conflict=notion_page_id、merge-duplicates、逐行 zod 校验、content-range 回读（clone `upsertNewsItems`，service_role 仅 Node）。`L4`
- [ ] D4 `notion/sync.ts`：纯 `syncNotion`(注入 client/query/convert/now/dryRun/maxPages) + `syncFromConfig`；每源 cursor→增量 query→转换→图片重托管→map→validate→水位单调推进→幂等 upsert→soft status；`notion-sync.test.mts` 离线（注入 fake，故障隔离/dryRun 跳过/确定性报告）。`L3`
- [ ] D5 `notion/report.ts`+`cli-sync.ts`(显式 exit、全失败才非零)+`cron.ts`(独立 NOTION_CRON、noOverlap、runAtBoot、优雅退出) + package.json `notion:sync`/`notion:cron`、扩 `news:test`；`.env.example` 记 `NOTION_TOKEN` 等占位。`L2`
- [ ] D6 `notion/smoke.ts`：无 token dryRun + fixtures 离线确定性报告（免 key 先行）。`L1`

**E 渲染**
- [ ] E1 `.vitepress/theme/notion-markdown.ts`：单例 markdown-it(`html:false`/linkify/highlight→`language-*`) + DOMPurify sanitize（客户端 guard）；`notion-markdown.test.mts` 含 XSS 载荷(`<script>`/`<img onerror>`/`javascript:`)中和。`L3`
- [ ] E2 `.vitepress/theme/notion-articles-filter.ts` 纯逻辑(tag/date/search/counts，仿 glossary-filter；date 轴复用 frontier-date-filter) + `.test.mts`。`L2`
- [ ] E3 `.vitepress/theme/notion-articles-list.ts`：anon 取 published **卡片列(不含 body_markdown)**、复用 frontier-date-filter + 新 filter、frontier-* 卡片、链 `/docs/notion/article?slug=`、MutationObserver。`L2`
- [ ] E4 `.vitepress/theme/notion-article-detail.ts`：读 `?slug=`、取单行(含 body_markdown)、`notion-markdown` 渲染进 prose、missing/not-found/error 态。`L3`
- [ ] E5 `docs/notion/index.md`+`docs/notion/article.md` 挂载壳；`theme/index.ts` 注册两模块；nav/sidebar 加「Notion 文章」入口。`L1`
- [ ] E6 seed+push：`scripts/generate-notion-articles-seed.ts`→`supabase/seed/notion_articles.sql`(离线确定性渲染) + `scripts/push-notion-articles-to-supabase.ts` + npm `supabase:notion-seed`/`supabase:notion-push`。`L2`

**F 验证**
- [ ] F1 `pnpm site:build`(SSR) → grep `dist/assets/chunks/theme.*.js` 验 `data-notion-articles`/`data-notion-article` 已打包 + grep dist 验**无 service_role JWT** + preview 点卡片验详情路由解析/正文渲染/图片可见。`L2`

### 落地前需用户提供（不阻塞 Plan，阻塞真实 smoke）
目标 Notion 文件夹/根页面的 `rootPageId`。该页面须**共享给 integration**（否则 pages/blocks API 报 object_not_found）。若选择可选 database source，再提供属性名映射：title 属性键 · 「Published」判定（select 'Status'='Published' / checkbox / status 类型）· 'Tags' multi_select 名 · 可选 'Slug' rich_text · 日期属性名。

### 测试策略（风险自适应）
- 纯逻辑离线 node:test（免 key）：types/map/query/config/cursor/assets/notion-markdown/filter + 版本 pin 断言 → 进 `invariant_tests`。
- L4 `store.ts` / L3 `client.ts`：边界 + 注入 fake 覆盖，真实写库经 smoke 人工验。
- 集成：`smoke.ts` dryRun 离线 + `site:build` + bundle grep（service_role 缺席 + 模块打包在场）。
- XSS 回归：`<script>`/onerror/`javascript:` 载荷断言中和（永不删除）。

---

## Phase 3: 变更日志（Work）

22/23 task 完成（C1 Storage 探针为凭据门控运行时检查，留待真实环境）。全程在主树按依赖顺序直写、每组 `tsc`+离线测当反馈环。

### 落地文件

**后端 `news-collector/src/notion/`**（独立 sibling 管线）
- `types.ts` — NotionArticle 接口 + `notionArticleSchema` zod + NotionPublishRule/PropertyMapping
- `notion-sources.ts` — 可配多库注册表（模板 enabled:false）
- `config.ts` — zod env + `loadNotionConfig`（缺 token/Supabase→dryRun）
- `client.ts` — `createNotionClient` 固定 `notionVersion=2022-06-28` + 429 退避 + 并发闸
- `query.ts` — `buildArticleQuery`（纯）+ `iterateArticlePages`（增量 filter+升序）
- `convert.ts` — notion-to-md 包装 + 图片 transformer hook
- `map.ts` — 纯 `toNotionArticle`（title 取属性非 H1/slug/tags/日期/发布态/封面）
- `storage.ts` — Supabase Storage REST（ensureBucket/uploadObject/publicUrl）
- `asset-manifest.ts` — srcHash（去 querystring）+ 稳定 storageKey
- `assets.ts` — `rehostImage`（external 直通/file 重托管/manifest 幂等/失败退化）+ 图片 transformer
- `image-io.ts` — download/upload 绑定 + public/ 退化
- `cursor.ts` — 无状态 `fetchMaxLastEdited` 高水位
- `store.ts` — `upsertNotionArticles`（on_conflict=notion_page_id，逐条 zod）`L4`
- `sync.ts` — 纯 `syncNotion`（注入式编排，per-page 隔离）+ `syncFromConfig` 真接线
- `report.ts` / `cli-sync.ts` / `cron.ts` — 报告 + CLI（显式 exit）+ 独立 cron daemon
- `fixtures.ts` / `smoke.ts` / `sample-data.ts` — 离线 fixtures + smoke + 样例数据

**前端 `.vitepress/theme/`**
- `notion-markdown.ts` — markdown-it(`html:false`)+DOMPurify(客户端动态 import)；可注入 sanitizer
- `notion-articles-filter.ts` — 纯 tag/search/counts
- `notion-articles-list.ts` — anon 取 published 卡片列（不含 body）+ tag/date/search + 卡片链详情
- `notion-article-detail.ts` — 读 `?slug=` 取单行渲染全文，含缺失/未找到/错误态
- `index.ts` 注册两模块；`custom.css` 追加 `.notion-*`（仅颜色/边框过渡，无 transform）；`config.mts` nav 加「Notion 文章」

**其它**：`supabase/migrations/20260617140000_create_notion_articles.sql`（RLS published-only）· `supabase/seed/notion_articles.sql`（生成）· `scripts/generate-notion-articles-seed.ts` + `push-notion-articles-to-supabase.ts` · `notion/index.md` + `notion/article.md` · `.env.example` 加 NOTION_* · package.json 加 `notion:sync/cron/smoke/test` + `supabase:notion-seed/push` · 依赖 `@notionhq/client@5.22 notion-to-md@3.1.9` + devDep `markdown-it@14.2 @types/markdown-it dompurify@3.4`

### 验证（全绿）
- `pnpm typecheck` → 0 错
- `pnpm notion:test` → 42/42 通过（types/map/query/config/client-version/assets/sync + theme filter/markdown XSS）
- `pnpm notion:smoke` → 离线确定性报告（免 token）
- `pnpm site:build` → 成功（markdown-it/dompurify 解析，无白屏）
- bundle grep → `data-notion-articles`/`[data-notion-article]` 已打包 + **service_role 绝对缺席 dist**

### 关键决策落实记录
- API 版本 pin `2022-06-28`（`notion-client-version.test.mts` 守门）
- 图片走 Storage 主（运行时渲染耦合）+ public/ 退化；稳定 srcHash key 防重复对象
- 增量无状态高水位 + 幂等 upsert；soft status（非 DELETE）

### 凭据门控待办（用户提供后执行）
1. Supabase SQL Editor 跑 migration 建表
2. 填 `notion-sources.ts` 真实 databaseId + 属性映射，数据库共享给 integration
3. `.env` 配 `NOTION_TOKEN` + `SUPABASE_*` + `NEXT_PUBLIC_SUPABASE_*`
4. C1：`curl -X POST {SUPABASE_URL}/storage/v1/bucket` 验自托管 Storage 可用；不可用则退 public/
5. `pnpm notion:sync` 真实同步 → 验图片 1h 后仍可见 + 重跑幂等

---

## Phase 4: 审查结果（Review）

6 维对抗式审查 workflow（18 agent，1.04M tokens，含逐条 refute 核验）。23 findings → 12 P0/P1 → 核验确认 11 真 1 驳回。**全部 P0/P1 已修或文档化**。

### P0（已修）
- **slug 唯一约束让整批 upsert 永久卡死**（store.ts + migration:42）：单批 upsert on_conflict=notion_page_id，但**第二个** unique(slug) 约束被两页同 explicit slug 撞 → 23505 整批失败 → 增量水位永不前进 → 该源永久卡死。**修**：map.ts slug 始终拼 pageId 短前缀 → 全局唯一，约束永不跨页冲突；加同-slug-不同-页回归测试。
- **typecheck 漏掉整个 notion 子系统**（tsconfig include 不含 news-collector/.vitepress）→ "0 错"是假信号。**修**：新增 `tsconfig.notion.json`（含 DOM+vite/client lib）+ `pnpm notion:typecheck`；真实 typecheck = **0 错**。
- **`databases.query` 在 @notionhq/client@5 不存在**（运行时实测 `client.databases.query===undefined`，v5 改 dataSources 模型）→ query 路径运行时必炸，仅因上条 typecheck 漏检才没暴露。**修**：降级到 `@notionhq/client@^2.3.0`（runtime 实测 databases.query 是函数；notion-to-md@3.1.9 的原生契合版本，Pipedream/Flowise 同款组合）；client.ts WHY 注释改写为 v2 事实。

### P1（已修）
- 图片每次重传（sync.ts 硬编 `existing:{}`，manifest 只写不读）→ 加 `cursor.ts fetchArticleManifest`，renderPage 跨次读 manifest，srcHash 命中跳过。
- retry/限流器建了没接 → `withNotionRetry` 接入 `iterateArticlePages` 查询分页；删除未用的 `createLimiter`（死代码）+ 清理孤儿 `NOTION_REQUEST_CONCURRENCY` 配置。
- `import.meta.env` 未类型化 → notion tsconfig 加 vite/client。
- public/ 退化路径站点根绝对路径在非根 base 部署下 404 → `createPublicDirFallback` 加 basePath（读 VITEPRESS_BASE 归一）。
- maxPages+升序使超大积压最新延后可见 → 文档化（config + .env.example 注释；默认 0 不触发）。
- 测试缺口（L4 store / 增量游标 / retry 退避全未测）→ 新增 `notion-store.test.mts`、`notion-client.test.mts`、sync 增量游标测试 + `withNotionRetry` 加可注入 `isRetryable`。

### P2（处置）
- 已修：map→schema 契约测试（防 map/schema 漂移）。
- 文档化为已知限制：Notion 改回草稿不自动下线（query 只取已发布；见 query.ts 注释 + deferred）；SPA 同路径切 slug 的 WeakSet 守卫（v1 无文间互链不触发）。
- 驳回/无效：`convert.ts md.parent ?? ""` 非死代码（noUncheckedIndexedAccess 下确为 string|undefined）；body 链接无 target=_blank 故无 tabnabbing。

### 复核后验证（最终态）
- `pnpm notion:typecheck` → **0 错**（真实覆盖）
- `pnpm notion:test` → **55/55**（含 slug 回归 / store L4 / retry 退避 / 增量游标 / map↔schema）
- `pnpm notion:smoke` → 离线确定性（slug 后缀生效）
- `pnpm site:build` + bundle grep → 通过 + service_role 缺席 dist

---

## Phase 5: 复利记录（Compound）

### 沉淀经验（写入本能/记忆）
1. **research-agent 的 SDK API 断言必须运行时核实**：notion-api 研究 agent 自信断言"pin 2022-06-28 让 databases.query 继续可用"——但 @notionhq/client@5 把 `databases.query` **方法从 client 上删了**（header 版本 pin ≠ 方法存在性），运行时 `client.databases.query===undefined`。若不验证就是上线即崩。→ 见 [[notion-sync-sdk-and-typecheck-gotchas]]。
2. **typecheck 作用域盲区 = 假绿**：`pnpm typecheck` 的 tsconfig `include` 只含 `src/lessons/capstone/knowledge-graph/rag-advanced`，**不含 `news-collector` 与 `.vitepress`**——这两处的新代码（及既有代码）从不被 tsc 覆盖，"0 错"对它们无意义。解法=scoped `tsconfig.notion.json`（含 DOM+vite/client lib）+ 专用脚本。
3. **proven 版本组合 > latest**：`notion-to-md@3.1.9` 的实战搭档是 `@notionhq/client@2.x`（Pipedream/Flowise）；装 latest v5 反而炸。"默认用最新"在伴随库锁旧 major 时是错的。
4. **双 unique 约束 + 单键 upsert = 整批中止地雷**：`on_conflict` 只处理一个约束；第二个 unique(slug) 撞了会让**整批** INSERT 失败；配合"水位读自表"，一页冲突→永久卡死。派生唯一键要**构造性全局唯一**（拼稳定 id 后缀）。
5. **假注入测试 + esbuild build 会掩盖真实 API/类型 bug**：42 个绿测 + build 成功 + bundle grep 全过，却藏着运行时崩溃（databases.query）——因测试全注入 fake 从不调真实 API、build 不 typecheck、文件不在 tsc 作用域。多维对抗式审查（TS 维核对真实安装包类型）揪了出来。强化 [[precommit-adversarial-review-catches-dom-races]]。

### 复利效应
- `tsconfig.notion.json` + `pnpm notion:typecheck` 模式可复用到任何"不在主 tsconfig include 内"的子系统真实类型检查。
- sibling 管线 + 注入式纯编排 + 离线 fixtures 模式（mirror news-collector）再次验证，下次接新数据源更快。

🏁 Sprint 完成。doc: `docs/plans/2026-06-17-notion-articles-sync.md`
知识：5 条经验 + 1 记忆文件；凭据门控落地步骤见 Phase 3 末。

---

## 2026-06-17 追加优化：folder scope + 直接建表

### 用户修正
- 同步范围：只同步 Notion 中指定文件夹/根页面，不搜索/同步整个 workspace；database source 仅保留为可选兼容模式。
- DDL：不再停留在“手动去 SQL Editor 跑”，直接用 `.env` 中的 `SUPABASE_DB_URL` 直连 Postgres 执行 `supabase/migrations/20260617140000_create_notion_articles.sql`。

### 变更
- `notion-sources.ts`：`NotionSource` 改为 `folder | database` 联合；默认模板推荐 `kind:"folder"` + `rootPageId`，`enabledNotionSources()` 只放行启用且非占位的源。
- `query.ts`：新增 `iterateFolderPages()`，从 `rootPageId` 递归遍历 `child_page`；root 只作为边界，不作为文章入库；增量水位只过滤文章页，不截断旧父页下的新子页。
- `sync.ts`：按 `source.kind` 分派 folder/database 查询路径。
- `map.ts`：metadata 记录 `sourceKind`，folder 记录 `sourceRootPageId`，database 记录 `sourceDatabaseId`。
- `notion/index.md`、`news-collector/README.md`：接入口径改成指定文件夹/根页面优先。

### 验证
- `pnpm notion:typecheck` → pass。
- `node node_modules\tsx\dist\cli.mjs --test ...notion 全量 10 文件` → 56/56 pass。
- `node node_modules\tsx\dist\cli.mjs news-collector\src\notion\smoke.ts` → pass（dry-run fixtures 2 pages）。
- `pnpm site:build`（非沙箱，沙箱内 Vite/esbuild `spawn EPERM`）→ pass。
- 远端 DDL 执行结果：`notion_articles` exists=true，columns=19，RLS enabled=true。

### 已知环境限制
- Windows 沙箱内 `pnpm notion:test` / `pnpm notion:smoke` / `pnpm site:build` 会因 Node/esbuild 子进程 `spawn EPERM` 失败；等价的本地 tsx CLI 或非沙箱构建可通过。
