# 2026-08-11 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成写入和直接 PostgreSQL readback。
- 本轮结构化新增：前沿内容 8 条，面试题 8 条。
- 今日是 2026-08-11 星期二：不触发周一周末补采规则；本轮重点覆盖上次 2026-08-10T09:21+08:00 之后出现或被今日采集器捕获的 2026-08-10 / 2026-08-11 内容。
- Supabase 未同步成功：旧 PostgREST/Supabase 写入入口在当前仓库仍不存在；本轮按 prompt 尝试旧命令并记录失败，但成功边界以当前仓库保留的 pgSql `content:*` 写入和 readback 为准。

## 本轮新增前沿内容

| slug / URL | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `https://github.blog/changelog/2026-08-10-copilot-on-web-expands-conversation-controls` | GitHub Changelog | 2026-08-10 | product-ui / conversation lifecycle | high |
| `https://github.blog/engineering/using-the-github-copilot-sdk-for-java/` | GitHub Engineering Blog | 2026-08-10 | runtime / SDK integration | high |
| `https://blog.cloudflare.com/agents-week-review-august-2026/` | Cloudflare Blog | 2026-08-10 | model-platform / agent platform control plane | high |
| `https://aws.amazon.com/blogs/machine-learning/how-nops-shipped-finops-agents-75-faster-with-amazon-bedrock-agentcore/` | AWS Machine Learning Blog | 2026-08-10 | runtime / enterprise AgentCore | high |
| `https://the-decoder.com/told-to-book-a-gym-class-an-ai-agent-hacked-the-site-instead-to-move-its-user-up-the-waitlist/` | The Decoder | 2026-08-10 | security-governance / unauthorized action | medium |
| `https://the-decoder.com/hidden-text-in-a-pdf-is-enough-to-steal-sensitive-data-through-atlassians-ai-agent-rovo/` | The Decoder | 2026-08-10 | security-governance / indirect prompt injection | medium |
| `https://arxiv.org/abs/2608.06745` | arXiv | 2026-08-10 | data-memory / long-horizon memory | medium |
| `https://arxiv.org/abs/2608.06503` | arXiv | 2026-08-10 | evaluation / context compression stability | medium |

## 本轮新增面试题

- `copilot-web-conversation-lifecycle-controls`
- `github-copilot-sdk-java-application-contract`
- `cloudflare-agents-week-platform-control-plane`
- `bedrock-agentcore-finops-runtime-governance`
- `web-agent-goal-achievement-vs-unauthorized-action`
- `document-ingestion-indirect-prompt-injection-rovo`
- `memprism-task-conditioned-relational-memory`
- `context-compression-execution-instability`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 8 条，并整理前次尾部挤在同一行的对象分隔。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 8 条，`COLLECTED_DATE=2026-08-11`。
- `docs/career-guide.md`：高频工程题追加 Q131-Q138。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-08-11 / 8月11日 · 星期二`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`README` 注入目标、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成或更新。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 217 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 161 条 interview seed。
- `docs/solutions/2026-08-11-agent-content-daily-sync.md`：本报告。

## pgSql 同步证据

pgSql 目标：`.env` 当前配置的 `CONTENT_POSTGRES_URL` / `CONTENT_POSTGRES_WRITE_URL`，本轮为本机 Docker PostgreSQL `127.0.0.1:55432/agent_build`；本报告不输出连接串或密钥。

环境恢复：

- 第 1 次 `npm run news:collect` 失败：`connect ECONNREFUSED 127.0.0.1:55432`。
- `docker version` 显示 Docker client 可用，但 daemon pipe `dockerDesktopLinuxEngine` 不存在。
- 已启动 Docker Desktop，启动既有容器 `agent-build-content-pg`；`pg_isready` 返回 accepting connections 后继续重试。

执行结果：

- `npm run kg` -> 通过，`75 单元 / 365 概念 / 504 关系 / 283 文章`。
- `npm run supabase:frontier-seed` -> `Wrote 217 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 161 interview questions`。
- `npm run news:collect` 第 1 次 -> 失败，`connect ECONNREFUSED 127.0.0.1:55432`。
- `npm run news:collect` 第 2 次 -> `sources=52/59 ok`、`fetched=740`、`dedupe=730`、`stored=730`、`table=1537`、Feishu notification sent。
- `npm run content:frontier-push` -> `PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=217, attempted=217, table count=217`。
- `npm run content:interview-push` -> `PostgreSQL upsert OK. table=interview_questions pushed=161, attempted=161, table count=161`。

直接 readback：

- `frontier_ecosystem_articles`：总量 `217`，`collected_date=2026-08-11` 为 `217`，本轮 8/8 URL 命中。
- `interview_questions`：总量 `161`，`collected_date=2026-08-11` 为 `161`，本轮 8/8 slug 命中。
- `news_items`：总量 `1537`，`collected_date=2026-08-11` 为 `730`。
- 去重：`frontier_slug_dups=[]`，`interview_slug_dups=[]`。

## 旧 Supabase/PostgREST 尝试

- `npm run supabase:frontier-push` -> 失败：`Missing script: "supabase:frontier-push"`；npm 建议当前可用入口为 `content:frontier-push`。
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` -> 失败：`ERR_MODULE_NOT_FOUND`，文件 `scripts/push-interview-questions-to-supabase.ts` 不存在。
- 请求目标：无。两条旧路径都在本地脚本/文件解析阶段终止，没有发起 HTTP 请求。
- 表名：旧目标应为 `frontier_ecosystem_articles`、`interview_questions`。
- 失败字段：无字段级失败；不是网络、权限、schema 或唯一约束错误，而是仓库脚本结构已迁移到 pgSql `content:*`。
- 最小动作：如果必须恢复 PostgREST/Supabase 直写，需要恢复 `supabase:frontier-push` 脚本和 `scripts/push-interview-questions-to-supabase.ts`；若接受当前项目约定，则继续使用 `npm run content:frontier-push`、`npm run content:interview-push`、`npm run news:collect`。

## 失败/未知项

- 采集器失败来源：`OpenHands`、`HumanLayer`、`Langfuse`、`Arize Phoenix`、`LlamaIndex Python`、`DSPy` 因 GitHub API `403 rate-limit remaining=0` 且 Atom fallback timeout；`Hugging Face Blog` 仍为 timeout / fetch failed。
- 来源链接验证：4 个官方来源用常规 `curl.exe -I -L` 返回 `200 OK` 或 `301 -> 200 OK`；The Decoder 与 arXiv 在 Windows Schannel 吊销检查上出现 `CRYPT_E_REVOCATION_OFFLINE`，使用 `curl.exe --ssl-no-revoke -I -L` 后 4/4 返回 `200 OK`。
- 旧 Supabase/PostgREST 未同步成功；当前已完成的是 pgSql 写入和 readback。
- 生产 PostgreSQL 未验证：本轮成功目标是 `.env` 指向的本机 Docker PostgreSQL，不是远程生产库。

## 验证

- `curl.exe -I -L` / `curl.exe --ssl-no-revoke -I -L`：8 个新增来源链接均验证可达。
- `npm run typecheck`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- pgSql 三表 readback：通过。

## 运行时间

- 写入时间：2026-08-11T08:57:20+08:00
