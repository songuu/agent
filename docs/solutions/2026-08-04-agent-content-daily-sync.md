# 2026-08-04 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`frontier_ecosystem_articles`、`interview_questions`、`news_items` 都完成写入或读回验证。
- Supabase 未同步成功：仓库当前策略在本地脚本层禁用 Supabase/PostgREST data uploads，三个 Supabase 写入口均在发起 HTTP 前被拒绝。
- 本轮结构化新增：前沿内容 4 条，面试题 4 条。
- 周末补采：上一轮 `2026-08-03` 报告已补周末前后来源；本轮为周二增量，未重复 8 月 3 日已落地的 Cloudflare / Make / Disney 三条。

## 本轮新增前沿内容

| slug / URL | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| `https://www.npmjs.com/package/@openai/agents-openai` | npm / OpenAI Agents JS Docs | 2026-08-04 | model-platform / SDK provider versioning | high |
| `https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models` | Claude Blog | 2026-07-24 | data-memory / context engineering | high |
| `https://claude.com/blog/how-datadog-built-a-universal-machine-tool-for-claude-code` | Claude Blog / Datadog | 2026-07-21 | runtime / remote machine tool sandbox | high |
| `https://www.salesforce.com/news/stories/summer-2026-product-release-announcement/` | Salesforce Newsroom / Release Notes | 2026-06-11 | product-ui / enterprise Agentforce rollout | high |

## 本轮新增面试题

- `openai-agents-js-provider-version-supply-chain`
- `claude-context-engineering-signal-budget`
- `datadog-claude-code-remote-machine-tool`
- `agentforce-multi-agent-mcp-enterprise-controls`

## 本地落地位置

- `knowledge-graph/data/graph.ts`：前沿内容事实源追加 4 条，并修复上一轮新增块和 CRAG 条目同处一行的格式问题。
- `knowledge-graph/data/interview-questions.ts`：面试题事实源追加 4 条，`COLLECTED_DATE=2026-08-04`。
- `docs/career-guide.md`：高频工程题追加 Q118-Q121。
- `knowledge-graph/data/frontier-articles.ts`：前沿展示采集日期更新为 `2026-08-04 / 8月4日 · 星期二`。
- `docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md`：由 `npm run kg` 重新生成。
- `supabase/seed/frontier_ecosystem_articles.sql`：重新生成 200 条 frontier seed。
- `supabase/seed/interview_questions.sql`：重新生成 144 条 interview seed。

## pgSql 同步证据

pgSql 目标：`.env` 当前配置的 `CONTENT_POSTGRES_URL` / `CONTENT_REPOSITORY_DRIVER=postgres`。本报告不输出连接串或密钥。

执行结果：

- `npm run kg` -> 通过，`66 单元 / 335 概念 / 472 关系 / 264 文章`。
- direct import -> `articles=264`、`articleHits=4/4`、`interviews=144`、`interviewHits=4/4`、`interviewUnique=144`。
- `npm run supabase:frontier-seed` -> `Wrote 200 frontier articles`。
- `npm run supabase:interview-seed` -> `Wrote 144 interview questions`。
- `npm run content:frontier-push` -> `PostgreSQL upsert OK. table=frontier_ecosystem_articles pushed=200, attempted=200, table count=200`。
- `npm run content:interview-push` -> `PostgreSQL upsert OK. table=interview_questions pushed=144, attempted=144, table count=144`。
- `npm run news:collect` -> 工具侧 300s timeout，但 CLI 已打印完整写入摘要：`sources=57/59 ok`、`fetched=770`、`dedupe=759`、`stored=759`、`table=935`。

直接 readback：

- `frontier_ecosystem_articles`：总量 `200`，`collected_date=2026-08-04` 为 `200`，本轮 4/4 URL 命中。
- `interview_questions`：总量 `144`，`collected_date=2026-08-04` 为 `144`，本轮 4/4 slug 命中。
- `news_items`：总量 `935`，`collected_date=2026-08-04` 为 `759`。

## Supabase 写入失败证据

- `npm run supabase:frontier-push` -> 失败，`supabase:frontier-push refused: Supabase/PostgREST data uploads are disabled for this project; use server PostgreSQL content commands instead.`
- `node scripts/push-frontier-seed-to-supabase.mjs` -> 失败，`Supabase/PostgREST data uploads are disabled for this project; use npm run content:frontier-push.`
- `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` -> 失败，`Supabase/PostgREST data uploads are disabled for this project; use npm run content:interview-push.`
- 请求目标：无。三次失败都在脚本本地策略断言处终止，未发起 PostgREST HTTP 请求。
- 表名：`frontier_ecosystem_articles`、`interview_questions`。
- 失败字段：无字段级失败；不是网络、权限、schema 或唯一约束错误，而是仓库写入策略禁用 Supabase/PostgREST。

## 验证

- `npm run typecheck`：通过。
- `git diff --check`：通过。
- pgSql 三表 readback：通过。

## 失败/未知项

- Supabase 未同步成功：当前仓库缺少 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`，且 Supabase 写脚本本身禁用数据上传。最小修复动作是明确恢复/授权 Supabase 写入策略，或把 automation 硬性成功条件改为当前 `content:*` pgSql 管道。
- `news:collect` 工具调用 exit code 为 timeout 124；但命令输出已显示写入完成，并由独立 pgSql readback 验证 `news_items` 今日 759 条。残余风险是 CLI 进程在工具超时边界被终止，后续通知/收尾逻辑若有可能未执行。
- `Together AI Blog` 源失败：`getaddrinfo ENOTFOUND www.together.ai`，3/3 retry exhausted。
- `Hugging Face Blog` 源失败：主 feed 和 transformers releases Atom 均 15s timeout，5/5 retry exhausted。

## 运行时间

- 写入时间：2026-08-04T08:59:40+08:00