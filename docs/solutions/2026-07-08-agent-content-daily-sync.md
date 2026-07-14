# 2026-07-08 Agent 内容每日采集同步

## 结论

- 已完成本轮多源资讯采集：news-collector 50/50 源成功，写入 public.news_items，本轮 stored=699，远端总量 3170。
- 已新增 curated frontier 4 条，事实源落到 knowledge-graph/data/graph.ts，并派生到知识图谱、课程 README 与 supabase/seed/frontier_ecosystem_articles.sql。
- 已新增高频面试题 4 道，事实源落到 knowledge-graph/data/interview-questions.ts，并同步到 docs/career-guide.md 与 supabase/seed/interview_questions.sql。
- 已完成 Supabase 同步：public.news_items、public.frontier_ecosystem_articles、public.interview_questions 均真实写入，并回读命中新增项。
- 本轮是周三（2026-07-08），不触发“周一补周末”额外窗口。

## 已验证事实

### 1. 多源资讯流

命令：node --env-file=.env --experimental-transform-types news-collector\src\cli-collect.ts

结果：

- 运行区间：2026-07-08T00:23:34.121Z -> 2026-07-08T00:23:57.513Z。
- 50/50 源成功，覆盖 GitHub Changelog、OpenAI、Google AI/DeepMind、Microsoft Source AI、AWS ML、NVIDIA、InfoQ、arXiv、LangGraph、CrewAI、OpenAI Agents、Google ADK、MCP SDK、Pydantic AI、browser-use、OpenHands、Aider、Langfuse、Phoenix、DSPy 等。
- fetched=700，dedupe=699，content=80/699 fetched，empty=82，failed=0，stored=699。
- Supabase public.news_items 回读：content-range=0-0/3170。

### 2. 本轮新增 curated frontier

| 标题 | 来源 | 发布时间 | 模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [OpenAI Agents SDK Python v0.18.0 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.18.0) | OpenAI | 2026-07-07 | 12 / 14 / 16 / 18 / 20 | high |
| [Google ADK Python v2.4.0 release notes](https://github.com/google/adk-python/releases/tag/v2.4.0) | Google ADK | 2026-07-07 | 11 / 12 / 16 / 17 / 18 / 20 | high |
| [LangGraph 1.2.8 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.8) | LangGraph | 2026-07-06 | 07 / 11 / 15 / 16 / 18 / 20 | high |
| [Adoption and Impact of Command-Line AI Coding Agents](https://arxiv.org/abs/2607.01418) | arXiv | 2026-07-01 | 11 / 15 / 16 / 18 / 20 | medium |

模块选择依据：

- OpenAI Agents SDK -> realtime agent 默认模型、session storage、streaming/UX、trace/cost 与部署回滚，归 12/14/16/18/20。
- Google ADK -> ManagedAgent、Workflow as Tool、session TTL、MCP traces、sandbox/security 修复，归 11/12/16/17/18/20。
- LangGraph -> checkpoint/delta state、fresh thread updateState、恢复/回放/排障，归 07/11/15/16/18/20。
- arXiv CLI coding agents rollout -> enterprise adoption、retention、output proxy、token spend 与评估，归 11/15/16/18/20。

### 3. 本轮新增面试题

| slug | 高频考点 | 关联模块 |
| --- | --- | --- |
| realtime-agent-default-model-and-cross-sdk-parity | SDK 默认模型升级 / session 存储 / trace 与回滚 | 12 / 14 / 16 / 18 / 19 |
| managed-agent-workflow-as-tool-vs-local-orchestration | ManagedAgent / Workflow as Tool / session TTL / runtime 安全默认值 | 11 / 12 / 16 / 17 / 18 / 19 |
| fresh-thread-update-state-snapshot-vs-stub-checkpoint | fresh thread updateState / snapshot / checkpoint / 回放排障 | 07 / 11 / 15 / 16 / 18 / 19 |
| enterprise-cli-coding-agent-adoption-retention-output-proxy | 企业 CLI coding agent rollout / adoption / retention / output proxy / token spend | 11 / 15 / 16 / 18 / 19 |

### 4. 生成与 Supabase 上传

标准 tsx 入口失败（本机已知 runtime blocker）：

- npm run supabase:frontier-push -> Error: spawn EPERM
- npx tsx --env-file=.env scripts\push-interview-questions-to-supabase.ts -> Error: spawn EPERM

Fallback 成功：

- node node_modules\tsx\dist\cli.mjs knowledge-graph\generate.ts -> 65 单元 / 329 概念 / 457 关系 / 187 文章
- node --experimental-transform-types scripts\generate-frontier-ecosystem-supabase-seed.ts -> Wrote 126 frontier articles
- node --experimental-transform-types scripts\generate-interview-questions-supabase-seed.ts -> Wrote 72 interview questions
- node scripts\push-frontier-seed-to-supabase.mjs -> Upsert OK (HTTP 201), pushed=126, table count=0-0/126
- node --env-file=.env --experimental-transform-types scripts\push-interview-questions-to-supabase.ts -> Upsert OK (HTTP 201), pushed=72, table count=0-0/574

新增 frontier 回读命中：

- openai-agents-sdk-python-v0-18-0-release-notes
- google-adk-python-v2-4-0-release-notes
- langgraph-1-2-8-release-notes
- adoption-and-impact-of-command-line-ai-coding-agents-a-study-of-microsoft-s-early-2026-rol

新增 interview 回读命中：

- realtime-agent-default-model-and-cross-sdk-parity
- managed-agent-workflow-as-tool-vs-local-orchestration
- fresh-thread-update-state-snapshot-vs-stub-checkpoint
- enterprise-cli-coding-agent-adoption-retention-output-proxy

## 本地落地位置

- knowledge-graph/data/graph.ts
- knowledge-graph/data/frontier-articles.ts
- knowledge-graph/data/interview-questions.ts
- docs/career-guide.md
- docs/knowledge-graph.md
- knowledge-graph/output/index.html
- lessons/19-agent-ecosystem-and-frontier/README.md
- supabase/seed/frontier_ecosystem_articles.sql
- supabase/seed/interview_questions.sql
- docs/solutions/2026-07-08-agent-content-daily-sync.md

## 已上传 Supabase

- public.news_items：成功。
- public.frontier_ecosystem_articles：成功。
- public.interview_questions：成功。

## 失败 / 未知项

### 失败项

- tsx/esbuild spawn EPERM 仍存在；已按既定 fallback 完成生成与上传，不影响 Supabase 最终同步。

### 未知项

- arXiv 2607.01418 是预印本；样本来自 Microsoft 内部 rollout，merged PR 只是 output proxy，不应直接等同业务价值。
- Google ADK v2.4.0 release 内容很大，本轮只保留与 agent runtime、tool/workflow、安全与可观测性强相关的主线，不展开全部 bugfix。

## 测试 / 校验

- news collector -> 50/50 源成功，stored=699。
- knowledge graph generation -> 通过。
- frontier seed -> 126 行。
- interview seed -> 72 行。
- Supabase service_role upsert -> 通过。
- Supabase anon readback -> frontier 4/4，interview 4/4。
- npm run typecheck -> 通过。
