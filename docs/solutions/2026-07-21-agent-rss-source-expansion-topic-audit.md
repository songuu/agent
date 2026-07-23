---
title: "AI Agent RSS 来源扩展：可解析性与主题相关性双门禁"
date: 2026-07-21
tags: [solution, news-collector, rss, ai-agent, supabase]
related_instincts: []
aliases: ["RSS 来源扩展", "Agent RSS 主题审计"]
---

# AI Agent RSS 来源扩展：可解析性与主题相关性双门禁

## Problem

仅检查 RSS/Atom 返回 200 且能解析，会把宽泛官方 feed 接入 Agent 资讯流。非 Agent 内容随后被 `layerHint` 兜底分类，造成主题污染。

## Root Cause

来源验收只有传输和解析门，没有抽样检查最新标题的主题相关性。NVIDIA Developer、Microsoft Research、Replicate、OpenTelemetry 均可稳定解析，但最新内容包含游戏图形、密码学、媒体生成或通用遥测，不适合作为 Agent 专题源。

## Solution

1. 通过官方页面或官方 GitHub 仓库发现候选源。
2. 先用 `fetch + parseFeedString` 验证 HTTP、XML 和有效条目，再用仓库 `fetchFeed` 验证真实生产路径。
3. 回读每个候选源最近 5 条标题，淘汰主题过宽来源。
4. 最终新增 10 个来源：
   - LangChain Changelog
   - Cloudflare AI
   - OpenAI Codex Releases
   - Claude Code Releases
   - Together AI Blog
   - Gemini CLI Releases
   - Weaviate Blog
   - Red Hat AI
   - Microsoft Agent Framework Releases
   - OWASP GenAI Security Project
5. 在 `news-collector/src/sources.ts` 注册；在 `sources.test.mts` 固化 key、URL、enabled 契约；同步 README。
6. 增量采集写入 Supabase 后按 `source_key` 回读：10/10 来源存在，127 条，`latestCollectedDate=2026-07-21`。

验证结果：

- 注册来源：63；启用：60。
- 最终 10 个新增源均通过真实 `fetchFeed`。
- 全量测试：68/68；smoke：8 items / 8 layers；TypeScript：通过。
- 全批次：59/60；新增源全部成功；既有 Hugging Face 主源和 fallback 网络超时。
- Supabase：最终新增集合回读 10/10；增量 4 个 replacement source 写入 40 条；表总数 5811。

## Known Limitations

主题抽样前的验证批次曾写入 4 个被淘汰来源，共 90 条：`nvidia-developer=30`、`microsoft-research=10`、`replicate-blog=30`、`opentelemetry-blog=20`。这些来源已不在注册表新增集合中；未自动删除远端行，因为删除属于 destructive cleanup，需要单独确认。

## Prevention

- 启用来源必须同时通过：官方性、实时可解析、有效条目、最新标题主题抽样。
- 宽泛 feed 没有 AI/Agent 专用 endpoint 时，默认不接入；不能依赖 `layerHint` 代替主题过滤。
- 每次来源变更同时验证 registry contract、完整 collector 路径、Supabase 写入和按 `source_key` 回读。
- 单源 TLS/超时与 Supabase 结果分开报告。

## Related

- [[2026-06-30-google-rss-tls-investigation]]
- [[2026-07-21-rss-source-expansion-audit]]
- [[session-2026-07-21]]
