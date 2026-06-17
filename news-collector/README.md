# news-collector · AI 资讯定时收集系统

仿 [ai.codefather.cn/news](https://ai.codefather.cn/news) 的**多源 AI 资讯定时聚合**子系统：
按计划从多个公开 RSS/Atom 源抓取 → 归一 → 规则分类（8 层生态）→ 可选 LLM 富化（Anthropic / OpenAI）→ 去重 → 幂等写入 Supabase。

第 20 章「前沿文章库」直接展示本系统写入的 `news_items` 表；旧的手工策展资料仍保留在知识图谱中，但不再作为文章日历的数据源。

## 管道架构

```
sources(RSS/Atom)
   │  fetchFeed  —— 单源故障隔离：502/超时/坏feed 只 skip+log，绝不崩整批
   ▼
RawFeedItem
   │  classify   —— 纯函数：8层生态 + 实体标签 + 语言（确定性、可离线测）
   │  normalize  —— canonical URL、去跟踪参、清 HTML、截断摘要、sha256 身份
   ▼
NewsItem
   │  dedupe     —— 批内按 externalId + url 双重去重
   │  enrich?    —— 可选 LLM 摘要+分层；无所选 provider key 时优雅降级为规则结果
   ▼
store(upsert)   —— PostgREST service_role，on_conflict=external_id 幂等
```

## 目录

```
news-collector/
  src/
    types.ts        类型 + zod 校验（8 层生态、NewsItem）
    sources.ts      源注册表（实测可用性见注释）
    rss.ts          抓取/解析（rss-parser），单源故障隔离
    normalize.ts    归一化（canonical URL / sha256 身份 / 清洗）
    classify.ts     规则分类（纯函数、确定性）
    enrich.ts       可选 LLM 富化（降级）
    dedupe.ts       批内去重
    store.ts        Supabase PostgREST upsert（service_role）
    config.ts       env 配置（zod 校验）
    collect.ts      编排：collectOnce / collectFromConfig
    report.ts       运行报告格式化
    cli-collect.ts  一次性入口（pnpm news:collect）
    cron.ts         常驻守护入口（pnpm news:cron）
    fixtures.ts     离线 fixtures 装置（smoke/测试/seed 共用）
  fixtures/         RSS/Atom/malformed 样本
  __tests__/        5 个离线单测
  smoke.ts          离线端到端 smoke
  ecosystem.config.cjs   pm2 配置
  deploy/news-collector.service  systemd 单元模板
  .env.example      环境变量模板
```

## 来源（2026-06-17 实测）

| key | 源 | 类型 | 状态 |
|-----|----|----|------|
| qbitai | 量子位 | 中文媒体 | ✅ |
| the-decoder | The Decoder | 英文媒体 | ✅ |
| arxiv-cs-ai | arXiv cs.AI | 论文 | ✅ |
| hn-ai | Hacker News · AI | 社区 | ✅ |
| google-ai | Google AI Blog | 厂商 | ✅ |
| huggingface | Hugging Face Blog | 厂商 | ⚠️ 间歇 502（故障隔离兜底）|
| openai | OpenAI News | 厂商 | ⚠️ 间歇 502 |
| anthropic | Anthropic News | 厂商 | ⚠️ best-effort |

加源：编辑 `src/sources.ts` 的 `SOURCES` 数组（key / name / url / kind / lang / 可选 layerHint）。

## 快速开始

```bash
# 1) 离线 smoke（无网络/无 key，跑通完整管道）
pnpm news:smoke

# 2) 单测（5 文件，离线确定性）
pnpm news:test

# 3) 生成 demo seed（离线派生，确定性 SQL）
pnpm supabase:news-seed   # → supabase/seed/news_items.sql

# 4) 真实抓取一次（需仓库根 .env）
pnpm news:collect

# 5) 启动常驻收集服务
pnpm news:cron
```

## Supabase 建表 + 数据

```bash
# DDL（自托管 AIDAP 需在 SQL Editor 执行）：
supabase/migrations/20260617120000_create_news_items.sql

# demo 数据（可选，先让页面有内容）：
pnpm supabase:news-seed
# 然后在 SQL Editor 执行 supabase/seed/news_items.sql
```

页面侧用公开 anon 配置只读 `news_items`；service_role 仅在 Node 收集端使用，绝不进前端 bundle。文章日历按 `published_date` 过滤，`collected_date` 只用于审计采集批次。

## 环境变量

见 [.env.example](./.env.example)。要点：

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`：写库必填；**缺失则自动退回 dryRun**（只抓取不写库）。
- `LLM_PROVIDER`：与仓库根 `.env.example` 保持同一套值，支持 `anthropic` / `openai` / `ollama`。
- `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`：`LLM_PROVIDER=anthropic` 时使用。
- `OPENAI_API_KEY` + `OPENAI_MODEL` + 可选 `OPENAI_BASE_URL`：`LLM_PROVIDER=openai` 时使用；SiliconFlow 等 OpenAI-compatible 平台也走这组配置。
- `NEWS_ENRICH_MAX>0` 且所选 provider 可用时才启用 LLM 富化；否则用规则分类，整条管道仍可离线跑。
- `NEWS_ENRICH_MODEL`：兼容旧 collector 配置的专用模型覆盖；通常优先用 `ANTHROPIC_MODEL` / `OPENAI_MODEL`。
- `NEWS_CRON`（默认 `0 8 * * *`）+ `NEWS_TZ`（默认 `Asia/Shanghai`）：调度时刻。
- `NEWS_RUN_AT_BOOT`（默认 true）：启动时先跑一次。

**密钥纪律**：活密钥只进仓库根 `.env`（已 gitignore），绝不写入任何 tracked 文件。

## 部署（阿里云常驻主机）

### pm2

```bash
pm2 start news-collector/ecosystem.config.cjs
pm2 logs news-collector
pm2 save && pm2 startup   # 开机自启
```

### systemd

```bash
sudo cp news-collector/deploy/news-collector.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now news-collector
journalctl -u news-collector -f
```

## 设计不变量

1. **单源故障隔离**：任一 feed 失败只 skip+log，绝不崩整批（`fetchFeed` 永不抛错）。
2. **密钥不进 tracked 文件**：service_role / API key 只走 `.env`。
3. **规则分类纯函数确定性**：同输入恒定同层/标签，可离线测、seed 可复现。
4. **无 key 可完整离线跑**：enrich 优雅降级，smoke/test 全程不触网。
5. **文章流独立**：`news_items` 独立表承载第 20 章文章流，不碰 `graph.ts` 手工策展 SoT。
6. **幂等 upsert**：身份 = canonical URL 的 sha256，`on_conflict=external_id` 重复运行不重复入库。

## 故障排查

- **某些源 0 items / ✗**：多为间歇 502 或 feed 改版；故障隔离保证其它源照常。改 `src/sources.ts` 增删源。
- **写库失败 HTTP 401**：service_role key 错或表未建；先跑迁移、核对 `.env`。
- **dryRun 一直生效**：未配 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`，或 `NEWS_DRY_RUN=true`。
- **Windows `tsx → spawn EPERM`**：用 `node --experimental-transform-types news-collector/src/cli-collect.ts` 作为 workaround（见仓库 supabase/README.md）。
