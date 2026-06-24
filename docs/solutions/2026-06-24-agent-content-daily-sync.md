# 2026-06-24 Agent 内容每日采集同步

## 结论

- 已完成本地事实源更新：
  - `knowledge-graph/data/graph.ts` 新增 4 条 AI Agent 前沿资料。
  - `knowledge-graph/data/interview-questions.ts` 新增 3 道工程类高频面试题。
  - `knowledge-graph/data/frontier-articles.ts` / `knowledge-graph/data/interview-questions.ts` 的采集批次日期已滚到 `2026-06-24`。
  - `docs/career-guide.md` 高频面试题清单同步追加 3 条新题。
- 已完成 Supabase 同步：
  - `public.news_items`：本轮 `stored=370`，远端总量 `867`。
  - `public.frontier_ecosystem_articles`：`93` 行，写入成功。
  - `public.interview_questions`：`41` 行，写入成功。
- 本轮最终状态：不是“仅本地落地”，而是“本地事实源 + Supabase 三表同步全部成功”。

## 已验证事实

### 1. Supabase 配置、目标表与写入权限

- `.env` 中本轮所需变量可用：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_SCHEMA`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 远端表回读成功：
  - `news_items`：`HTTP 206`，`content-range=0-0/867`
  - `frontier_ecosystem_articles`：`HTTP 206`，`content-range=0-0/93`
  - `interview_questions`：`HTTP 206`，`content-range=0-0/41`
- 写入命令结果：
  - `npm run supabase:frontier-push` → `Upsert OK (HTTP 201). pushed=93, table count (content-range)=0-0/93`
  - `npx tsx --env-file=.env scripts/push-interview-questions-to-supabase.ts` → `Upsert OK (HTTP 201). pushed=41, table count (content-range)=0-0/41`
- 本轮没有触发 Supabase 认证失败、RLS 拒绝、字段约束冲突或表不存在错误。

### 2. 多源采集结果（文章 / 技术实践 / 开源动态）

执行命令：

```powershell
node node_modules/tsx/dist/cli.mjs --env-file=.env news-collector/src/cli-collect.ts
```

已验证事实：

- 运行区间：`2026-06-24T00:26:49.620Z -> 2026-06-24T00:27:07.844Z`
- `26/26` 源成功，无失败源。
- `fetched=370`，`dedupe=370`，`stored=370`。
- 资讯流已写入 `news_items`，当前远端总量 `867`。
- 本轮高信号来源覆盖：
  - 官方技术博客：AWS Machine Learning Blog
  - 官方 release：OpenAI Agents Python / JS、LangGraph、CrewAI、Google ADK 等
  - 行业媒体：InfoQ、The Decoder、量子位、MIT Technology Review
  - 社区补充：Hacker News · AI

### 3. 本轮新写入 curated frontier 的 4 条内容

| 标题 | 来源 | 发布时间 | 归属模块 | 可信度 |
| --- | --- | --- | --- | --- |
| [CrewAI 1.14.8a3 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a3) | CrewAI | 2026-06-23 | `lessons/11-multi-agent-orchestration`、`lessons/18-deployment`、`lessons/20-agent-frontier-news` | high |
| [Shared infrastructure, isolated tenants: Pool model multi-tenancy with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/) | AWS | 2026-06-23 | `lessons/16-observability-and-cost`、`lessons/17-safety-and-guardrails`、`lessons/18-deployment`、`lessons/20-agent-frontier-news` | high |
| [Build a protein research copilot with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/) | AWS | 2026-06-23 | `lessons/08-embeddings-and-vector-search`、`lessons/09-rag-from-scratch`、`capstone/deep-research-agent`、`lessons/20-agent-frontier-news` | high |
| [Linux Foundation Agent Name Service identity infrastructure announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents) | Linux Foundation | 2026-06-23 | `lessons/17-safety-and-guardrails`、`lessons/18-deployment`、`lessons/20-agent-frontier-news` | high |

摘要（已核对官方页面标题/描述，不复制全文）：

- CrewAI 1.14.8a3：统一 declarative flow loading、收敛启动入口，并补 nested crews 进度可见性，说明多 agent workflow 的定义和运维体验继续向声明式与可观测靠拢。
- Bedrock AgentCore 多租户实践：强调共享基础设施下仍要隔离 tenant state、identity、telemetry 和审批边界，适合直接映射到生产 runtime / guardrail 设计。
- Bedrock AgentCore 蛋白研究 copilot：把 structured query parsing、embedding retrieval、AI summary 三段明确拆开，适合补研究型 copilot / 深度检索 agent 的工程边界。
- Linux Foundation ANS 公告：把 agent identity 从“每家各自映射账号”推向独立身份基础设施，信号价值高于短期实现细节。

### 4. 本轮新增 3 道面试题

| slug | 高频考点 | 关联模块 | 来源 |
| --- | --- | --- | --- |
| `multi-tenant-agent-runtime-isolation-vs-dedicated-stack` | 多租户隔离 / runtime 边界 / 共享基建何时失效 | `16` `17` `18` `19` | [AWS AgentCore 多租户实践](https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/) |
| `scientific-copilot-query-parse-retrieval-summary-boundary` | query parsing / retrieval / summarization 三段式边界 | `08` `09` `16` `19` | [AWS protein research copilot](https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/) |
| `agent-identity-infrastructure-vs-provider-account-mapping` | agent 身份基础设施 / 撤销 / 跨平台互认 | `17` `18` `19` | [Linux Foundation ANS 公告](https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents) |

远端回读验证：

- `multi-tenant-agent-runtime-isolation-vs-dedicated-stack`
- `scientific-copilot-query-parse-retrieval-summary-boundary`
- `agent-identity-infrastructure-vs-provider-account-mapping`

三条都已在 `public.interview_questions` 回读成功。

### 5. 模块归属依据

- 最新资讯流：继续落到 `news-collector -> news_items -> lessons/20-agent-frontier-news`，因为这是仓库已有的“多源日采集”主通道。
- curated frontier：继续落到 `knowledge-graph/data/graph.ts`，因为这是仓库已有的 chapter 19/20 高信号资料事实源。
- 面试题：继续落到 `knowledge-graph/data/interview-questions.ts` 与 `docs/career-guide.md`，因为这是仓库已有的结构化题库 + 人读清单双轨。
- 若没有明确模块，优先挂到最直接会消费该资料的已存在课程模块：
  - runtime / multi-agent / deployment -> `11` `18`
  - retrieval / copilot -> `08` `09` `capstone/deep-research-agent`
  - identity / trust / guardrail -> `17` `18`

## 本地落地位置

- `knowledge-graph/data/graph.ts`
- `knowledge-graph/data/frontier-articles.ts`
- `knowledge-graph/data/interview-questions.ts`
- `docs/career-guide.md`
- `supabase/seed/frontier_ecosystem_articles.sql`
- `supabase/seed/interview_questions.sql`

## 已上传 Supabase

- `public.news_items`
- `public.frontier_ecosystem_articles`
- `public.interview_questions`

## 失败 / 未知项

### 失败项

- 无。
- 本轮没有出现“Supabase 未同步成功”。

### 未知项

- `2026-06-24` 当天的新采集里，绝大多数是社区/HN 级条目，信号密度低于 6 月 23 日的官方博客 / 官方 release / 官方公告，因此没有全部提升进 curated frontier；它们仍已保存在 `news_items` 供后续筛选。
- `arXiv cs.AI` 本轮返回 `0 items`，这是采集结果而不是失败；是否代表当天无新增高价值 agent 论文，需要下一轮继续观察。

## 推断

- 最近 24 小时的高信号主题继续集中在三条：
  - 多 agent workflow 的声明式定义与运维体验：CrewAI release 延续这个方向。
  - 企业级 agent runtime 隔离：AWS 明确把 state、identity、telemetry、approval 当成多租户设计的硬边界。
  - agent identity / trust：Linux Foundation 开始推动独立 identity infrastructure，说明跨组织 agent 互认会成为新一轮基础设施问题。
