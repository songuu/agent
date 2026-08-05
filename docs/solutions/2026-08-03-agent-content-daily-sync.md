# 2026-08-03 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成写入与直接 readback。
- 本轮结构化新增：前沿内容 3 条，面试题 3 条。
- 周一补采周末：补入 2026-07-27、2026-07-30 和 2026-08-03 的可信来源信号，覆盖周末前后的 runtime、低代码 agent 控制面与企业 coding-agent 组合治理。
- 线上生产库未知：本轮在本机创建独立 Docker PostgreSQL 容器 `agent-build-content-pg` 作为 pgSql 目标；仓库没有真实非 Supabase 服务器 PostgreSQL 连接串。若要同步到生产 PostgreSQL，只需替换 `.env` 的 `CONTENT_POSTGRES_URL` 或 `CONTENT_POSTGRES_WRITE_URL` 后重跑同一命令组。

## 本轮新增前沿内容

| slug | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `cloudflare-agents-sdk-0-20-0-package-and-docs` | https://www.npmjs.com/package/agents | 2026-08-03 | runtime / edge durable agent runtime | high |
| `make-ai-agent-sub-agents-and-tool-output-filtering` | https://help.make.com/ai-agents/make-ai-agent-sub-agents-and-tool-output-filtering | 2026-07-27 | runtime / sub-agent delegation and context filtering | high |
| `disney-steers-developers-from-github-copilot-toward-codex-claude-code-and-cursor` | https://www.businessinsider.com/disney-microsoft-github-copilot-openai-codex-ai-tools-claude-cursor-2026-7 | 2026-07-30 | product-ui / enterprise coding-agent portfolio governance | medium |

## 本轮新增面试题

- `cloudflare-agents-durable-edge-runtime-boundary`
- `make-ai-agent-subagents-output-filtering-boundary`
- `enterprise-coding-agent-portfolio-governance`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 3 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 3 条，`COLLECTED_DATE=2026-08-03`。
- `docs/career-guide.md`：高频工程题追加 Q115-Q117。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-08-03 / 8月3日 · 星期一`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 196 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 140 条 interview seed。
- `.env`（ignored）：`CONTENT_POSTGRES_URL` 指向本机 Docker PostgreSQL，`CONTENT_POSTGRES_SSL=false`。

## pgSql 同步证据

pgSql 目标：本机 Docker 容器 `agent-build-content-pg`，PostgreSQL 16 alpine，端口 `127.0.0.1:55432`，数据库 `agent_build`。该目标不是 Supabase；旧 Supabase/PostgREST 写入仍被仓库脚本拒绝。

表结构：

- 已应用仓库迁移：`20260616090000_create_frontier_ecosystem_articles.sql`、`20260616112000_add_frontier_ecosystem_article_layers.sql`、`20260616120000_create_interview_questions.sql`、`20260617120000_create_news_items.sql`、`20260624113000_add_news_item_content_fields.sql`、`20260730143000_add_news_item_translation_fields.sql`。
- 本地 PostgreSQL 需要兼容迁移中的 Supabase grant 角色；已创建本地 no-login 角色 `anon`、`authenticated`、`service_role` 后重跑 news migration。
- schema readback：`frontier_ecosystem_articles=22` 列、`interview_questions=16` 列、`news_items=31` 列。

执行路径：

- `npm run kg` -> 通过，`66 单元 / 335 概念 / 472 关系 / 260 文章`，README 注入 `更新 1 · 未变 65 · 缺失 0`。
- direct import -> `FRONTIER_ARTICLES=196`、`INTERVIEW_QUESTIONS=140`，frontier/interview slug 均唯一，新增 slug 命中。
- `npm run supabase:frontier-seed` -> `Wrote 196 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 140 interview questions`。
- `npm run content:frontier-push` -> `PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=196, attempted=196, table count=196`。
- `npm run content:interview-push` -> `PostgreSQL upsert OK. table=interview_questions pushed=140, attempted=140, table count=140`。
- `npm run news:collect` 第 1 次 -> 失败，已触达 pgSql，但 `news_items` 缺少 `title_zh` 字段。
- 应用 `20260730143000_add_news_item_translation_fields.sql` 后，`npm run news:collect` 第 2 次 -> 成功，`sources=58/59 ok`，`fetched=740`，`dedupe=730`，`content=80/730 fetched empty=34 failed=0`，`stored=730`，`table=730`。

直接 readback：

- `frontier_ecosystem_articles`：总量 `196`，`collected_date=2026-08-03` 为 `196`，本轮 3/3 slug 命中。
- `interview_questions`：总量 `140`，`collected_date=2026-08-03` 为 `140`，本轮 3/3 slug 命中。
- `news_items`：总量 `730`，`collected_date=2026-08-03` 为 `730`。

## 验证

- 本地 direct import：`frontier=196`、`interviews=140`、`frontierUnique=196`、`interviewUnique=140`，新增 slug 均命中。
- `npm run typecheck`：通过。
- `git diff --check`：通过。
- Seed 生成和 pgSql 写入/readback：通过。

## 失败/未知项

- 生产 PostgreSQL 未验证：当前仓库没有真实非 Supabase 服务器 PostgreSQL URL；本轮为完成 pgSql 写入验证，使用本机独立 Docker PostgreSQL。若生产库连接串补齐，需要重跑同一同步命令。
- `news:collect` 中 `LlamaIndex Python Releases` 源失败：GitHub API `403 rate-limit remaining=0`，Atom fallback 8s timeout；其余 58/59 源成功，命令整体完成 pgSql 写入。
- 初始阻塞已修复：facts 源写入先前被 sandbox/审批挡住，本轮已完成写入；pgSql 配置先前为空，本轮已配置到本地 PostgreSQL。
- Supabase 未同步成功：这是预期结果；当前仓库策略禁止 Supabase/PostgREST 数据上传，本轮没有向 Supabase 写入。

## 运行时间

- 写入时间：2026-08-03T12:05:00+08:00