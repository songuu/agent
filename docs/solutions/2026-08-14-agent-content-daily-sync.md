# 2026-08-14 Agent 内容每日采集同步

## 结论

- pgSql 已同步成功：`news_items`、`frontier_ecosystem_articles`、`interview_questions` 均已写入并完成直接 SQL 读回。
- 今天是 2026-08-14 星期五，不触发周一周末补采窗口；采集窗口按当日最新内容执行。
- 当前仓库生产 writer 仍为 PostgreSQL content writer；本轮按现有 `content:*` 脚本完成 pgSql 写入。
- 已按最新要求取消 Supabase/PostgREST 写入检查；本轮成功边界只看 PostgreSQL 写入和直接 SQL 读回。

## 收集与筛选

- 首次自动采集：`node node_modules\tsx\dist\cli.mjs --env-file=.env news-collector\src\cli-collect.ts`
  - 失败：`connect ECONNREFUSED 127.0.0.1:55432`。
  - 判断：本地 pgSql writer 容器 `agent-build-content-pg` 未运行，不是采集源、认证或 schema 失败。
- 处理：`docker start agent-build-content-pg` 后，`pg_isready` 返回 `accepting connections`。
- 第 1 次重试采集成功：
  - `sources=59/59 ok`
  - `fetched=840`
  - `dedupe=830`
  - `content=80/830`
  - `stored=830`
  - `news_items` 表总数 `2212`
- 精选来源：优先采用官方 OpenAI / Google / Anthropic / AWS / GitHub 页面和 arXiv 一手条目；AWS 两篇 2026-08-13 实践条目由仓库采集器入库摘要和官方 URL 共同确认。

## 新增精选内容

1. [The builder's guide to GPT-5.6](https://openai.com/index/builders-guide-to-gpt-5-6) - 模型选择、reasoning effort、programmatic tool calling、多 agent steerability、prompt caching 的生产成本/质量组合。
2. [Google ADK Python v2.7.0 release notes](https://github.com/google/adk-python/releases/tag/v2.7.0) - model-declared capabilities、media tool response、thought signatures、parallel function call history。
3. [Claude Code v2.1.232 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.232) - subagent forking、cross-session messaging、inbound policy、GitLab token redaction、Windows/PowerShell permission fixes。
4. [Monitor on-premises and multi-cloud AI agents with AgentCore Observability](https://aws.amazon.com/blogs/machine-learning/monitor-on-premises-and-multi-cloud-ai-agents-with-agentcore-observability/) - ADOT/OpenTelemetry 接入本地和多云 agent 观测。
5. [Automate legacy web applications with Amazon Bedrock AgentCore Browser Tool](https://aws.amazon.com/blogs/machine-learning/automate-legacy-web-applications-with-amazon-bedrock-agentcore-browser-tool/) - 远程浏览器、legacy web automation、live view、session replay、人类接管。
6. [Agent Plugins 1.0 in VS Code, Copilot CLI, and the Copilot app](https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app) - 跨客户端 agent plugin 能力包与供应链/权限治理。
7. [InfraBench](https://arxiv.org/abs/2608.11234) - infrastructure agents 跨系统层、生命周期和风险细项评估。
8. [EvoGraph-Mem](https://arxiv.org/abs/2608.11248) - failure-aware editable graph memory，避免 long-term agent memory append-only 污染。

## 本地落地

- frontier 事实源：`knowledge-graph/data/graph.ts` 追加 8 条 Article，并映射到 `lessons/20-agent-frontier-news` 及相关 lesson/capstone。
- 第 20 章投影日期：`knowledge-graph/data/frontier-articles.ts` 更新为 `2026-08-14` / `8月14日 · 星期五`。
- 面试题事实源：`knowledge-graph/data/interview-questions.ts` 追加 8 个工程题与 answer override，采集日期更新为 `2026-08-14`。
- 人类可读题库：`docs/career-guide.md` 追加 Q147-Q154。
- 生成产物：`docs/knowledge-graph.md`、`knowledge-graph/output/index.html`、`lessons/19-agent-ecosystem-and-frontier/README.md` 已由 `knowledge-graph/generate.ts` 更新。
- seed 产物：`supabase/seed/frontier_ecosystem_articles.sql` 写出 233 条；`supabase/seed/interview_questions.sql` 写出 177 条。

## pgSql 上传与读回

目标为 `.env` 中的 PostgreSQL writer，读回时仅输出脱敏目标信息：

- target: `127.0.0.1:55432/agent_build`, `ssl=false`
- `news_items`: total `2212`, collected_date=`2026-08-14` count `830`, max_collected_at `2026-08-14 00:29:29.098+00`
- `frontier_ecosystem_articles`: push `pushed=233/attempted=233`, table count `233`; SQL readback total `233`, today `233`
- `interview_questions`: push `pushed=177/attempted=177`, table count `177`; SQL readback total `177`, today `177`
- 新增 frontier URL 读回：8/8 命中
- 新增 interview slug 读回：8/8 命中
- 重复键检查：`news_items.external_id=0`、`news_items.url=0`、`frontier.slug=0`、`frontier.source_url=0`、`interview.slug=0`

## 验证命令

- `node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts`：成功，输出 `75 单元 / 365 概念 / 504 关系 / 299 文章`
- `npm run content:frontier-seed`：成功，233 条
- `npm run content:interview-seed`：成功，177 条
- `npm run content:frontier-push`：成功
- `npm run content:interview-push`：成功
- `npm run supabase:frontier-push` / `npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts`：不再属于本同步脚本路径；后续不再执行。
- 直接 SQL readback：成功；三表计数、新增 URL/slug 命中、重复键检查均通过
- `npm run typecheck`：成功
- `git diff --check`：成功；仅提示 Windows `LF will be replaced by CRLF`，未发现 whitespace error

## 失败、阻塞与未知项

- 已恢复的环境阻塞：首次 `news:collect` 因 `agent-build-content-pg` 未运行失败，错误为 `connect ECONNREFUSED 127.0.0.1:55432`；启动容器后第 1 次重试成功。
- Supabase/PostgREST：不再作为每日 Agent 内容同步目标，不再尝试、不再重试、不再作为失败项报告。
- 未知项：生产侧是否由 PM2/systemd/CI 自动触发，仍需看远端进程日志；本轮已验证的是当前 `.env` 指向的 pgSql writer。
