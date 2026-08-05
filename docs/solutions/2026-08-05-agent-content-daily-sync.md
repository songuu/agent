# 2026-08-05 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 均完成写入和直接 PostgreSQL readback。
- 后续 Supabase 同步步骤已取消：用户在 2026-08-05 明确后续脚本不再支持 Supabase 同步；成功边界改为 pgSql `content:*` 写入与直接 readback。
- 本轮结构化新增：前沿内容 3 条，面试题 3 条。
- 去重处理：工作区已有未提交内容已经包含 GitHub managed settings、GitHub Copilot JetBrains OTel/MCP/custom agents、MCP TypeScript SDK v2 相关条目；本轮未重复写入这些来源，只保留 Cloudflare tracing、Cloudflare computer、Microsoft MCP-hosted Agent Skills 三条新增。
- 周末补采：今天是 2026-08-05 星期三；不是周一，本轮不执行额外周末补采窗口。

## 本轮新增前沿内容

| slug / URL | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `https://developers.cloudflare.com/changelog/post/2026-08-04-agent-tracing/` | Cloudflare Changelog | 2026-08-04 | evaluation / agent tracing | high |
| `https://developers.cloudflare.com/changelog/post/2026-08-03-cloudflare-computer/` | Cloudflare Changelog | 2026-08-03 | runtime / gated agent execution | high |
| `https://devblogs.microsoft.com/agent-framework/discover-agent-skills-from-mcp-servers-in-net/` | Microsoft Agent Framework Blog | 2026-07-28 | runtime / MCP-hosted Agent Skills | high |

## 本轮新增面试题

- `cloudflare-agent-traces-observability-boundary`
- `cloudflare-computer-vfs-container-execution-boundary`
- `microsoft-mcp-skills-central-distribution-boundary`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 3 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 3 条，`COLLECTED_DATE=2026-08-05`。
- `docs/career-guide.md`：高频工程题追加 Q122-Q124。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-08-05 / 8月5日 · 星期三`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 203 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 147 条 interview seed。
- `docs/solutions/2026-08-05-agent-content-daily-sync.md`：本报告。

## pgSql 同步证据

pgSql 目标：`.env` 当前配置的 `CONTENT_POSTGRES_URL`，本轮为本机 Docker PostgreSQL `127.0.0.1:55432/agent_build`；本报告不输出连接串或密钥。

环境恢复：

- 初次 `npm run content:frontier-push` / `npm run content:interview-push` 失败：`connect ECONNREFUSED 127.0.0.1:55432`。
- Docker Desktop 初始未运行：`docker ps` / `docker version` 都无法连接 `dockerDesktopLinuxEngine`。
- 已启动 Docker Desktop，并启动已存在容器 `agent-build-content-pg`；`127.0.0.1:55432` 端口就绪后重试成功。

执行结果：

- `npm run kg` -> 通过，`66 单元 / 335 概念 / 472 关系 / 267 文章`。
- direct import -> `articles=267`、本轮 3/3 URL 命中；`interviews=147`、`interviewUnique=147`、本轮 3/3 slug 命中。
- `npm run supabase:frontier-seed` -> `Wrote 203 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 147 interview questions`。
- `npm run content:frontier-push` -> `PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=203, attempted=203, table count=203`。
- `npm run content:interview-push` -> `PostgreSQL upsert OK. table=interview_questions pushed=147, attempted=147, table count=147`。
- `npm run news:collect` -> `sources=59/59 ok`、`fetched=811`、`dedupe=801`、`stored=801`、`table=1113`。

直接 readback：

- `frontier_ecosystem_articles`：总量 `203`，`collected_date=2026-08-05` 为 `203`，本轮 3/3 URL 命中。
- `interview_questions`：总量 `147`，`collected_date=2026-08-05` 为 `147`，本轮 3/3 slug 命中。
- `news_items`：总量 `1113`，`collected_date=2026-08-05` 为 `801`。

## 本轮历史 Supabase 尝试（已取消）

- `npm run supabase:frontier-push` -> 初次 + 3 次重试均失败：`supabase:frontier-push refused: Supabase/PostgREST data uploads are disabled for this project; use server PostgreSQL content commands instead.`
- `node scripts/push-frontier-seed-to-supabase.mjs` -> 失败：`Supabase/PostgREST data uploads are disabled for this project; use npm run content:frontier-push.`
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` -> 初次 + 3 次重试均失败：`Supabase/PostgREST data uploads are disabled for this project; use npm run content:interview-push.`
- 请求目标：无。三条 Supabase/PostgREST 路径都在本地策略断言处终止，没有发起 HTTP 请求。
- 表名：`frontier_ecosystem_articles`、`interview_questions`。
- 失败字段：无字段级失败；不是网络、权限、schema 或唯一约束错误，而是仓库策略显式禁用 Supabase/PostgREST data uploads。
- 后续处理：该步骤已从 package data-upload scripts 中移除；不再恢复/授权 Supabase/PostgREST 写入策略。

## 后续脚本调整

- 已移除 package.json 中的 Supabase data-upload 命令：supabase:frontier-push、supabase:glossary-push、supabase:codefather-interview-sync、supabase:notion-push。
- 已删除 frontier/interview/notion/glossary 的旧 Supabase/PostgREST push 脚本和 frontier seed fallback。
- 保留 supabase:*seed 生成器，因为当前事实源仍需要生成可审计 SQL seed；后续同步只跑 
pm run content:frontier-push、
pm run content:interview-push 和 
pm run news:collect。

## 验证

- `npm run typecheck`：通过。
- `git diff --check`：通过。
- pgSql 三表 readback：通过。

## 失败/未知项

- Supabase 同步不再作为后续成功条件：用户已明确取消该步骤；本轮保留取消前的失败证据仅作审计。
- 生产 PostgreSQL 未验证：本轮成功目标是 `.env` 指向的本机 Docker PostgreSQL，不是远程生产库。
- 文章 URL 全局唯一性存在历史残留：`ReAct` 与 `Reflexion` 两个 arXiv URL 各有一组旧重复；本轮 3 条新增 URL 均唯一且未扩大重复。

## 运行时间

- 写入时间：2026-08-05T09:05:16+08:00