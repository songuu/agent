---
title: "AI 资讯定时收集系统（仿 ai.codefather.cn/news）"
type: sprint
status: completed
created: "2026-06-17"
updated: "2026-06-17"
tasks_total: 9
tasks_completed: 9
tags: [sprint, feature, news, collector, cron, supabase]
aliases: ["news collector", "定时收集系统", "daily-news"]
invariants:
  - "单源故障必须隔离：任一 feed 502/超时/返回HTML 只 skip+log，绝不让整批收集崩溃"
  - "活密钥只进 .env / 环境变量，绝不写入任何 tracked 文件；service_role 不进前端 bundle"
  - "规则分类纯函数、确定性：同输入恒定同层/标签，无 Date/随机依赖"
  - "无所选 LLM provider key 时整条管道仍可完整离线跑（enrich 优雅降级为规则结果）"
  - "news_items 与第20章 frontier_ecosystem_articles 物理隔离：机器写入不污染 graph.ts 唯一事实源"
  - "收集身份 = canonical URL 的 sha256；on_conflict=external_id 幂等 upsert"
invariant_tests:
  - "node node_modules/tsx/dist/cli.mjs news-collector/__tests__/classify.test.mts"
  - "node node_modules/tsx/dist/cli.mjs news-collector/__tests__/normalize.test.mts"
  - "node node_modules/tsx/dist/cli.mjs news-collector/__tests__/dedupe.test.mts"
  - "node node_modules/tsx/dist/cli.mjs news-collector/__tests__/rss.test.mts"
  - "node node_modules/tsx/dist/cli.mjs news-collector/__tests__/sources.test.mts"
  - "node node_modules/tsx/dist/cli.mjs news-collector/smoke.ts"
  - "pnpm typecheck"
deferred: []
deadcode_until: []
---

# AI 资讯定时收集系统（仿 ai.codefather.cn/news）

## Phase 1: Think

### 目标站研究结论

`ai.codefather.cn/news` = 程序员鱼皮「鱼皮AI导航」的 **每日 AI 资讯聚合页**：
- 按日期分组（`6月16日 · 周二`），每条 = 标题 + 2-3 句摘要 + 内部详情链接（雪花 ID `/news/2066...`）。
- 每日更新，分页深达 367 页（历史归档）。
- 覆盖 OpenAI / 阿里 / 腾讯 / DeepSeek / Qwen 等主流 AI 公司，**来源不在前台显式标注**——即一个多源抓取 + 归一 + 摘要 + 入库 + 展示的聚合系统。

「同样的系统」= 缺的那半：**自动收集管道**。本仓库第 20 章已有展示侧（手工策展 77 篇写在 `graph.ts` → 派生 → Supabase seed → anon 读），但**没有任何自动收集**。

### Scope

- 新建独立 `news-collector/` 子系统：多源 RSS 聚合 → 归一 → 规则分类(8层生态)+可选Claude富化 → 去重 → 幂等写入 Supabase 新表 `news_items`。
- 独立 Node 常驻服务（node-cron + pm2/systemd），可部署到现有阿里云主机。
- 新建 `news_items` 表，与第 20 章 `frontier_ecosystem_articles` **物理隔离**。
- 离线可跑：fixtures + smoke + 单测，无 key/无网络也能验证整条管道。
- 部署资产：pm2 配置 + systemd unit + README（运行/测试/部署/源表）。
- 展示侧：仿 codefather /news 的每日资讯页，anon 读 `news_items`。

### Non-scope

- 不爬取 ai.codefather.cn 本身（合规/版权 + HTML 脆弱）。
- 不改第 20 章手工策展数据与 `graph.ts` SoT。
- 不引入 Vue/React；展示沿用 VitePress vanilla DOM theme。
- 不做全文转载；只存标题 + 摘要 + 原文链接（可追溯，不复制原文）。

### Success

- `pnpm news:smoke` 离线全绿：解析 fixtures → 分类 → 去重 → dryRun 报告。
- `pnpm news:collect` 真实抓取多源 → 写入 `news_items`（配 .env 时）。
- `pnpm news:cron` 启动常驻服务，按 cron 周期收集。
- 5 个单测 + typecheck 全绿。
- 单源 502 不影响其它源（故障隔离，由真实 502 源验证）。
- 展示页能从 `news_items` 渲染资讯列表。

### Risks

- 部分 feed 间歇 502（HF/OpenAI 已观测）→ 必须故障隔离（已立为 #1 不变量）。
- 自托管 Supabase(火山 AIDAP) 表需先 SQL Editor 建（PostgREST 不能 DDL）。
- service_role 泄漏风险 → 只走 .env + --env-file，零提交。

## Phase 2: Plan

### 入场扫描 - Invariants 继承

| 子系统 | 既有 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| Supabase client | 前端只读 anon，service_role 不进 bundle | 收集器用 service_role 仅在 Node 端 .env；展示页用 anon |
| 密钥纪律 | 活密钥只进 .env（见 [[secret-never-in-tracked-file]]） | 所有 key 走 env，迁移/seed/脚本零硬编码 |
| 教学 demo 确定性 | 规则/对照结论由构造保证 | 规则分类纯函数；seed 由 fixtures 离线派生 |
| frontier SoT | graph.ts 是文章唯一编辑点 | news_items 独立表，机器写入，不碰 graph.ts |

### 入场扫描 - 集成路径

| 改动点 | 触发动作 | 中间层 | 持久化 | 刷新后可见 |
|--------|----------|--------|--------|------------|
| 定时收集 | node-cron 周期触发 | collectOnce 管道 | `news_items`(service_role upsert) | ✅ |
| 手动收集 | `pnpm news:collect` | 同上 | 同上 | ✅ |
| 离线 smoke | `pnpm news:smoke` | 同上(dryRun) | ❌ 不写库(故意) | n/a |
| 展示页 | 用户访问 /news | anon PostgREST 读 | 只读 | ✅ |
| 离线 seed | `pnpm supabase:news-seed` | fixtures→pipeline→SQL | seed 文件 | 入库后 ✅ |

### 入场扫描 - 债务清单

| 来源 | 议题 | 本 sprint 决策 | deadline |
|------|------|----------------|----------|
| — | 首个 sprint，无继承债务 | — | — |

### 来源验证结果（2026-06-17 实测）

| 源 | URL | 状态 |
|----|-----|------|
| 量子位 | https://www.qbitai.com/feed | ✅ RSS2.0 |
| The Decoder | https://the-decoder.com/feed/ | ✅ RSS2.0 |
| arXiv cs.AI | http://export.arxiv.org/rss/cs.AI | ✅ RSS2.0 |
| Hacker News(AI) | https://hnrss.org/newest?q=AI+OR+LLM+OR+agent | ✅ RSS2.0 |
| Google AI Blog | https://blog.google/technology/ai/rss/ | ✅ RSS2.0 |
| Hugging Face | https://huggingface.co/blog/feed.xml | ⚠️ 间歇502(best-effort) |
| OpenAI | https://openai.com/news/rss.xml | ⚠️ 间歇502(best-effort) |
| Anthropic | https://www.anthropic.com/rss.xml | ⚠️ best-effort |

### Tasks

| Task | 内容 | 风险 |
|------|------|------|
| T1 | 数据模型：`news_items` 迁移 + `types.ts`(8层/zod) | L2 |
| T2 | 源注册表 + RSS 抓取/解析(rss-parser, 故障隔离) + 归一化 | L2 |
| T3 | 规则分类(8层+标签+语言, 纯函数) + 可选 LLM 富化(Anthropic/OpenAI，降级) | L3 |
| T4 | 去重 + Supabase upsert(service_role) + collectOnce 编排 | L3 |
| T5 | node-cron 常驻服务 + config(zod) + 部署资产(pm2/systemd) + README | L2 |
| T6 | fixtures + 5 单测 + 离线 smoke | L2 |
| T7 | seed 生成器(离线派生) + package.json 脚本接线 | L2 |
| T8 | 展示页(daily-news-feed theme + /news 页) | L2 |
| T9 | 来源扩容：新增高信噪 RSS 源 + registry 测试 + 生产收集补库 | L2 |

## Phase 3: Work

### Change Log

- T1 完成：`news_items` 迁移（8层 enum/RLS公开读/updated_at触发器/gin索引/tsvector，unique external_id）+ `types.ts`（8层/zod schema/NewsItem）。
- T2 完成：`sources.ts`（8 源，实测可用性标注；Anthropic 硬404 已 disabled）+ `rss.ts`（rss-parser，fetchFeed 永不抛错=故障隔离，parseFeedString 离线测）+ `normalize.ts`（canonical URL 去跟踪参、sha256 身份、HTML清洗、日期解析、now 注入确定性）。
- T3 完成：`classify.ts`（8层评分+平分优先级，纯函数确定性，实体标签，detectLang）+ `enrich.ts`（可选 Claude，无 key/maxItems≤0 优雅降级，单条失败保留规则结果，并发池）。
- T4 完成：`dedupe.ts`（externalId+url 双重去重）+ `store.ts`（PostgREST service_role upsert，出库前 zod 校验丢脏数据，on_conflict=external_id，可注入 fetch）+ `collect.ts`（collectOnce 全注入式编排：sources/fetchImpl/now/dryRun/maxPerSource；collectFromConfig）+ `report.ts`。
- T5 完成：`cron.ts`（node-cron，noOverlap 防重叠，SIGTERM/SIGINT 优雅停）+ `cli-collect.ts`（显式 process.exit 收尾）+ `config.ts`（zod env，缺 Supabase 自动 dryRun，maxPerSource 默认30）+ `ecosystem.config.cjs`（pm2）+ `deploy/news-collector.service`（systemd）+ `.env.example` + `README.md`。
- T6 完成：fixtures（RSS2.0×2/Atom/malformed）+ `fixtures.ts`（离线 fetchFeedImpl）+ 5 单测（classify/normalize/dedupe/rss/collect 共 34 例）+ `smoke.ts`（离线端到端）。
- T7 完成：`scripts/generate-news-items-seed.ts`（离线 fixtures 派生确定性 SQL）+ package.json 脚本（news:smoke/collect/cron/test、supabase:news-seed）。
- T8 完成：`.vitepress/theme/daily-news-feed.ts`（仿 codefather /news，复用 frontier-* CSS + date-filter + 8层数据，anon 只读 news_items）+ `news/index.md` + nav「AI 资讯」+ srcExclude 挡 news-collector/README。
- 配置对齐补充：`news-collector` 富化配置改为复用仓库统一 `LLM_PROVIDER` / `ANTHROPIC_*` / `OPENAI_*` / `OPENAI_BASE_URL`；`enrich.ts` 从 Anthropic 直连改为统一 `LLMClient`；保留 `NEWS_ENRICH_MODEL` 作为兼容覆盖。
- T9 完成：新增 8 个实测可用 RSS 源（Google DeepMind、Microsoft Source AI、AWS ML、NVIDIA Deep Learning、InfoQ AI/ML/Data Engineering、VentureBeat AI、MIT Technology Review、Ahead of AI）；`rss.ts` 增加 `Accept` feed header 修复 InfoQ 406；新增 `sources.test.mts` 防 source key 重复和扩容源误关；生产库补齐到 347 篇，`/news/` 与第20章同源读取。

### Validation

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm news:test`（5 文件 34 例） | pass | classify/normalize/dedupe/rss/collect 全绿 |
| `pnpm news:smoke` | pass | 离线 8 条覆盖全部 8 层 |
| `pnpm typecheck` | pass | 全库 exit 0（含新 theme） |
| 实网 dry-run collect（8 真源） | pass | 5/8 OK（量子位/Decoder/arXiv/HN/Google），3 源失败被隔离（HF/OpenAI超时、Anthropic404），整批存活、EXIT=0 |
| `pnpm supabase:news-seed` | pass | 生成 8 条确定性 seed SQL |
| `pnpm site:build` | pass | 17.27s；`/news/index.html` 含 data-daily-news，bundle 含 news_items，无野生 news-collector 页 |
| `.env` in .gitignore | pass | 密钥不变量；`.env.example` 模板可提交 |
| `pnpm news:test` | pass | 沙箱内 `spawn EPERM`，沙箱外 40/40 pass；新增 provider/config/enrich 覆盖 |
| `pnpm news:smoke` | pass | 沙箱内 `spawn EPERM`，沙箱外 dryRun 8 items / 8 layers / enriched=0 |
| `pnpm typecheck` | pass | 共享 LLM 工厂 model override 类型通过 |
| 密钥扫描 | pass | `.env` 未 tracked；tracked 文件无真实 key 形状命中 |
| `pnpm news:test` | pass | 沙箱内 `spawn EPERM`，沙箱外 42/42 pass；新增 sources registry 测试 |
| `pnpm news:smoke` | pass | 沙箱内 `spawn EPERM`，沙箱外离线 8 items / 8 layers |
| 实网 dry-run collect（15 真源） | pass | 本地 13/15 OK，`fetched=230 dedupe=229`；远端 15/15 OK，`fetched=290 dedupe=289` |
| 生产真实 collect | pass | 远端执行，新源幂等写入；`stored=289 table=0-0/347` |
| PM2 常驻 reload | pass | `news-collector` online，远端源码含 `deepmind`，systemd inactive（当前实际常驻方式为 PM2） |
| 线上浏览器验证 | pass | `/news/` 与 `/lessons/20-agent-frontier-news/` 均显示 `347文章84日期8体系层16来源`，分页请求 offset=0/100/200/300 |

### 实网验证暴露并修复的真问题

- arXiv 单源 664 条淹没 feed → 加 `maxPerSource`（默认30）。
- 一次性 CLI 因 rss-parser 残留 socket/timer 不自动退出（EXIT=124）→ `cli-collect.ts` 显式 `process.exit`。
- **#1 故障隔离不变量在真实 502/超时/404 条件下被证明成立。**

## Phase 4: Review

（多视角 5+1 对抗复核 workflow 进行中，结果写入此处）

### 2026-06-17 配置对齐补充复核

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | pass | `news-collector` 复用共享 `LLMClient` / `getLLM`，不再绑定 Anthropic SDK |
| 安全 | pass | key 仍只走 env；`.env` 未 tracked；tracked 密钥形状扫描无命中 |
| 质量 | pass | 空字符串 env 归一为 undefined，避免 `.env.example` 空 key 触发 zod 失败 |
| 测试 | pass | `pnpm news:test` 沙箱外 40/40，新增 config/enrich 覆盖 |
| 集成连续性 | pass | `LLM_PROVIDER=openai` + `OPENAI_BASE_URL` 与根配置口径一致；OpenAI-compatible provider 可复用 |

P0/P1：无。

### 2026-06-17 来源扩容复核

| 视角 | 结论 | 证据 |
|------|------|------|
| 架构 | pass | 仍只扩 `SOURCES` 注册表与抓取 header；不改 schema、不污染 `frontier_ecosystem_articles` |
| 安全 | pass | 真实写库仍走服务器/本机 `.env`，未把 service_role 或模型 key 写入 tracked 文件 |
| 质量 | pass | 新增 `sources.test.mts` 锁定 key 唯一、URL 格式、layerHint 合法和 8 个扩容源 enabled |
| 测试 | pass | `pnpm news:test` 42/42、`pnpm news:smoke`、`pnpm typecheck`、实网 dry-run、远端真实 collect |
| 集成连续性 | pass | PM2 常驻服务已 reload；线上页面读取 `news_items` 后自动显示 347 篇，无需 UI 额外接线 |

P0/P1：无。

## Phase 5: Compound

（复利记录）

### 2026-06-17 配置对齐补充

- 经验：子系统配置不要另造 `NEWS_*` provider 口径；优先复用根 `.env.example` 的 provider contract。
- 经验：测试 provider 降级逻辑时必须隔离真实 `.env`，否则本机 key 会让离线测试误打真实模型。
- Skill 信号：`spawn EPERM` 仍按 sandbox 外同命令复跑判定源码真伪。

### 2026-06-17 来源扩容补充

- 经验：RSS 源进入 registry 前必须先用实际 collector 栈 dry-run 验证；单纯 `fetch` 能拿到 XML 不等于 `rss-parser` 可稳定解析。
- 经验：部分 feed 会因缺 `Accept` header 返回 406；收集器应声明 RSS/Atom/XML 接受类型。
- 经验：静态页读取 `news_items` 时，扩库优先通过幂等 upsert 和分页验证闭环；不需要为数据增加重新部署 UI。
- Skill 信号：生产常驻方式以 `pm2 describe news-collector` 为准；当前 systemd inactive，实际 owner 是 PM2。
