# 2026-08-13 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均已写入并完成直接 SQL 读回。
- 本次不是周一，未触发周末补采窗口；采集窗口按 2026-08-13 当日执行。
- 当前仓库生产 writer 策略已从旧 Supabase/PostgREST push 切到服务器 PostgreSQL push；本次按现有 `content:*` 脚本完成 pgSql 写入。
- 用户确认 Docker 已启动后已续跑一次；最终读回以续跑后的 `news_items=2006`、今日 `867` 为准。

## 收集与筛选

- 自动采集：`node node_modules\tsx\dist\cli.mjs --env-file=.env news-collector\src\cli-collect.ts`
  - 首次失败：`connect ECONNREFUSED 127.0.0.1:55432`，原因是 Docker/PostgreSQL 容器未运行。
  - 处理：启动 Docker Desktop 和 `agent-build-content-pg` 后重跑。
  - 成功结果：`sources=59/59 ok`，`fetched=830`，`dedupe=820`，`stored=820`，远端表总数 `news_items=1980`。
- 续跑采集：用户确认 Docker 已启动后再次执行同一 collector。
  - 成功结果：`sources=58/59 ok`，`fetched=800`，`dedupe=790`，`stored=790`，远端表总数 `news_items=2006`。
  - 普通源失败：`hn-frontpage` TLS 连接在重试 3 次后失败；该源不是 critical，未阻断本次 pgSql 同步。
- 精选来源：优先采用官方 GitHub release 与 arXiv 一手页面，补充作者/机构、发布时间、摘要、适用模块和可信度判断。

## 新增精选内容

1. [OpenAI Agents Python v0.20.0 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.20.0) - 默认模型、MCP v1/v2、RunState、sandbox credential 边界。
2. [OpenAI Agents JS v0.15.0 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.15.0) - OpenAI client 兼容、MCP v2 negotiation、durable RunState/replay。
3. [LangGraph 1.2.11 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.11) - 节点级 `trace_policy` 与 checkpoint 更新。
4. [Claude Code v2.1.229 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.229) - remote-control resume、自托管 runner hooks、SSE keepalive、Windows path 修复。
5. [Pydantic AI v2.27.1 security release notes](https://github.com/pydantic/pydantic-ai/releases/tag/v2.27.1) - retry prompt content redaction / instrumentation 安全修复。
6. [DSAgentBench](https://arxiv.org/abs/2608.10366) - 真实计算机环境中的端到端数据科学 agent benchmark。
7. [MESA](https://arxiv.org/abs/2608.10108) - long-horizon agent memory 的多结构 evidence selection。
8. [UserToolBench](https://arxiv.org/abs/2608.10042) - 隐藏用户画像下的个性化 tool-use 决策 benchmark。

## 本地落地

- frontier 事实源：`knowledge-graph/data/graph.ts` 追加 8 条 Article，并映射到 `lessons/20-agent-frontier-news` 及相关 lesson/capstone。
- chapter 20 投影日期：`knowledge-graph/data/frontier-articles.ts` 更新为 `2026-08-13` / `8月13日 · 星期四`。
- 面试题事实源：`knowledge-graph/data/interview-questions.ts` 追加 8 个工程题与 answer override。
- 人类可读题库：`docs/career-guide.md` 追加 Q139-Q146。
- 生成产物：`docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md` 已由 `knowledge-graph/generate.ts` 更新。
- seed 产物：`supabase/seed/frontier_ecosystem_articles.sql` 写出 225 条；`supabase/seed/interview_questions.sql` 写出 169 条。

## pgSql 上传与读回

目标为 `.env` 中的 PostgreSQL writer，读回时仅输出脱敏目标：

- target: `127.0.0.1:55432/agent_build`, `ssl=false`
- `news_items`: total `2006`, collected_date=`2026-08-13` count `867`, max_collected_at `2026-08-13 00:57:02.009+00`
- `frontier_ecosystem_articles`: push `pushed=225/attempted=225`, table count `225`; SQL readback total `225`, today `225`
- `interview_questions`: push `pushed=169/attempted=169`, table count `169`; SQL readback total `169`, today `169`
- 新增 frontier URL 读回：8/8 命中
- 新增 interview slug 读回：8/8 命中
- 重复键检查：`news_items.external_id=0`、`news_items.url=0`、`frontier.slug=0`、`frontier.source_url=0`、`interview.slug=0`

## 验证命令

- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts`：成功，输出 `75 单元 / 365 概念 / 504 关系 / 291 文章`
- `node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts`：成功，225 条
- `node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts`：成功，169 条
- `npm run content:frontier-push`：成功
- `npm run content:interview-push`：成功
- 直接 SQL readback：成功；续跑后最终 `news_items=2006`、`frontier=225`、`interview=169`
- `npm run typecheck`：成功
- `git diff --check`：成功；仅提示 Windows `LF will be replaced by CRLF`，未发现 whitespace error

## 失败、阻塞与未知项

- 已恢复的环境阻塞：PostgreSQL 本地容器未运行导致首次采集 `ECONNREFUSED 127.0.0.1:55432`，已通过启动 Docker Desktop 与 `agent-build-content-pg` 修复。
- 续跑中的非阻断源失败：`hn-frontpage` 出现 TLS 连接断开，3 次重试后失败；其余 58 个来源成功。
- 当前仓库已无 `scripts/push-frontier-seed-to-supabase.mjs` 与 `scripts/push-interview-questions-to-supabase.ts`；`scripts/push-*-to-postgres.ts` 文件头明确写着当前生产 writer policy 禁止 Supabase/PostgREST 写入。
- 未知项：如果还要求写入另一个外部 Supabase/PostgREST 项目，需要先恢复对应脚本/凭据和目标表策略；本次可验证成功边界是当前 pgSql writer。
