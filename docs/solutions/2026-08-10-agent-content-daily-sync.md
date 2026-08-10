# 2026-08-10 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成写入和直接 PostgreSQL readback。
- 本轮结构化新增：前沿内容 6 条，面试题 6 条。
- 周一周末补采：今天是 2026-08-10 星期一，本轮覆盖 8 月 3 / 6 / 7 仍在周末前后有效的 GitHub Copilot 官方变更，并运行 `news:collect` 拉取最新文章流。
- Supabase 未同步成功：旧 PostgREST/Supabase 写入入口在当前仓库已下线；本轮按 prompt 尝试旧命令并记录失败，但成功边界以当前仓库保留的 pgSql `content:*` 写入为准。

## 本轮新增前沿内容

| slug / URL | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `https://github.blog/changelog/2026-08-07-github-copilot-weekly-releases-august-3` | GitHub Changelog | 2026-08-07 | product-ui / coding agent workflow | high |
| `https://github.blog/changelog/2026-08-06-customize-the-reasoning-level-for-copilot-cloud-agent` | GitHub Changelog | 2026-08-06 | model-platform / reasoning budget | high |
| `https://github.blog/changelog/2026-08-07-copilot-code-review-effort-levels-are-generally-available` | GitHub Changelog | 2026-08-07 | evaluation / AI code review | high |
| `https://docs.github.com/en/copilot/concepts/copilot-usage-metrics/copilot-metrics` | GitHub Docs | current docs snapshot | evaluation / usage attribution | high |
| `https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#enterprise-mcp-allowlist` | GitHub Docs | current docs snapshot | security-governance / MCP allowlist | high |
| `https://github.com/microsoft/Agents-for-python/blob/main/changelog.md` | Microsoft GitHub changelog | 2026-07-30 | runtime / open-source SDK | high |

## 本轮新增面试题

- `copilot-weekly-session-worktree-rewind-observability`
- `copilot-cloud-agent-reasoning-level-task-budget`
- `copilot-code-review-effort-level-risk-gating`
- `copilot-agent-app-activity-metrics-attribution`
- `mcp-allowlist-enterprise-managed-settings`
- `microsoft-agents-python-runtime-hosting-contract`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 6 条。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 6 条，`COLLECTED_DATE=2026-08-10`。
- `docs/career-guide.md`：高频工程题追加 Q125-Q130。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-08-10 / 8月10日 · 星期一`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 209 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 153 条 interview seed。
- `docs/solutions/2026-08-10-agent-content-daily-sync.md`：本报告。

## pgSql 同步证据

pgSql 目标：`.env` 当前配置的 `CONTENT_POSTGRES_URL` / `CONTENT_POSTGRES_WRITE_URL`，本轮为本机 Docker PostgreSQL `127.0.0.1:55432/agent_build`；本报告不输出连接串或密钥。

环境恢复：

- 初次 `npm run content:frontier-push` / `npm run content:interview-push` 失败：`connect ECONNREFUSED 127.0.0.1:55432`。
- Docker daemon 初始未运行：`docker version` 无法连接 `dockerDesktopLinuxEngine`。
- 已启动 Docker Desktop，并启动既有容器 `agent-build-content-pg`；`127.0.0.1:55432` 端口就绪后第 2 次上传成功。

执行结果：

- `npm run kg` -> 通过，`66 单元 / 335 概念 / 472 关系 / 273 文章`。
- `npm run supabase:frontier-seed` -> `Wrote 209 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 153 interview questions`。
- `npm run content:frontier-push` 第 1 次 -> 失败，`connect ECONNREFUSED 127.0.0.1:55432`。
- `npm run content:interview-push` 第 1 次 -> 失败，`connect ECONNREFUSED 127.0.0.1:55432`。
- `npm run content:frontier-push` 第 2 次 -> `PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=209, attempted=209, table count=209`。
- `npm run content:interview-push` 第 2 次 -> `PostgreSQL upsert OK. table=interview_questions pushed=153, attempted=153, table count=153`。
- `npm run news:collect` -> `sources=58/59 ok`、`fetched=740`、`dedupe=730`、`stored=730`、`table=1350`、Feishu notification sent。

直接 readback：

- `frontier_ecosystem_articles`：总量 `209`，`collected_date=2026-08-10` 为 `209`，本轮 6/6 URL 命中。
- `interview_questions`：总量 `153`，`collected_date=2026-08-10` 为 `153`，本轮 6/6 slug 命中。
- `news_items`：总量 `1350`，`collected_date=2026-08-10` 为 `730`。
- 去重：`interview_slug_dups=[]`，`frontier_url_dups_sample=[]`。

## 旧 Supabase/PostgREST 尝试

- `npm run supabase:frontier-push` -> 失败：`Missing script: "supabase:frontier-push"`；npm 建议当前可用入口为 `content:frontier-push`。
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` -> 失败：`ERR_MODULE_NOT_FOUND`，文件 `scripts/push-interview-questions-to-supabase.ts` 不存在。
- 请求目标：无。两条旧路径都在本地脚本/文件解析阶段终止，没有发起 HTTP 请求。
- 表名：旧目标应为 `frontier_ecosystem_articles`、`interview_questions`。
- 失败字段：无字段级失败；不是网络、权限、schema 或唯一约束错误，而是仓库策略和脚本结构已迁移到 pgSql `content:*`。
- 最小动作：如果必须恢复 PostgREST/Supabase 直写，需要恢复脚本和仓库策略；若接受当前项目约定，则继续使用 `npm run content:frontier-push`、`npm run content:interview-push`、`npm run news:collect`。

## 失败/未知项

- Hugging Face Blog feed 失败：`attempts=5/5`，`feed.xml` 与 `transformers/releases.atom` 都出现 timeout / fetch failed；已在 collector 报告中隔离，未阻塞 58 个成功来源和 730 条 `news_items` 写入。
- 旧 Supabase/PostgREST 未同步成功；当前已完成的是 pgSql 写入和 readback。
- 生产 PostgreSQL 未验证：本轮成功目标是 `.env` 指向的本机 Docker PostgreSQL，不是远程生产库。

## 验证

- `curl.exe -I -L`：6 个新增来源链接均最终返回 `200 OK` 或 `301 -> 200 OK`。
- `npm run typecheck`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- pgSql 三表 readback：通过。

## 运行时间

- 写入时间：2026-08-10T09:56:00+08:00
