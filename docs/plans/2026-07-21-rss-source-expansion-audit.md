---
title: "AI RSS 来源深度审计与可靠扩展"
type: sprint
status: draft
created: "2026-07-21"
updated: "2026-07-21"
checkpoints: 0
tasks_total: 6
tasks_completed: 0
tags: [sprint, news-collector, rss, supabase, reliability]
invariants:
  - "只有当前 fetchFeed 可实时解析并返回条目的来源才能进入 enabledSources"
  - "所有启用来源必须在完整批次中成功，不能用关闭 TLS 或绕过验证码伪造成功"
  - "news_items 是真实 Supabase sink，本地 dry-run 不能替代远端写入与读回"
  - "来源抓取保持有界并发，避免 GitHub 等同域请求雪崩"
  - "service_role 只走 .env，不进入 tracked 文件或日志"
invariant_tests:
  - "node node_modules/tsx/dist/cli.mjs --test news-collector/__tests__/config.test.mts news-collector/__tests__/collect.test.mts news-collector/__tests__/rss.test.mts news-collector/__tests__/sources.test.mts"
  - "pnpm typecheck"
deferred: []
deadcode_until: []
---

# Phase 1: Think

## Scope

- 审计当前启用来源的主题覆盖、重复度、稳定性与长期价值。
- 从官方厂商、研究机构、Agent/开发工具、数据与可观测性、安全治理、中文 AI 媒体中发现候选 RSS/Atom。
- 用当前 `fetchFeed` 和真实网络验证 HTTP/TLS、解析、条目数、最新发布日期；只接入高价值且稳定的来源。
- 更新来源注册、测试、README 与候选决策记录。
- 运行完整采集、Supabase 写入/读回、生产 PM2/日志验证。

## Non-scope

- 不接入 RSSHub、搜索结果页或未受控第三方代理作为生产关键源。
- 不绕过 TLS、Cloudflare、验证码或站点访问控制。
- 不为无稳定 feed 的站点新增 HTML adapter。
- 不修改 Supabase schema、页面 UI、分类层级或历史数据。

## Success

- 候选表包含 URL、官方性、实时状态、解析结果、条目数、最新日期、重复度、接入/观察/淘汰决策。
- 新增来源补足明确覆盖缺口，避免只增加同质媒体噪音。
- 所有启用来源在一次完整真实批次中全部成功，无 `✗`。
- 回归测试、类型检查、Supabase 写入与 count 读回通过。
- 生产运行包同步，PM2 `online`、0 异常重启，近期错误日志无采集错误。

## EARS-lite 验收

- WHEN 候选不是官方 feed 或依赖验证码/TLS 绕过，THE SYSTEM SHALL 将其标记为观察/淘汰且不启用。
- WHEN 候选 feed 能返回 XML 但无法由当前解析器产生条目，THE SYSTEM SHALL 不把 HTTP 200 误判为可用。
- WHEN 新来源进入 `enabledSources()`，THE SYSTEM SHALL 在受控并发的完整批次中成功并写入 `news_items`。
- WHEN 任一启用来源在最终生产验证失败，THE SYSTEM SHALL 保留失败证据并阻止 sprint 宣称完成。
- WHEN 生产采集结束，THE SYSTEM SHALL 分别报告来源、写库、读回、PM2/日志四层证据。

## Risks

- 上游 feed 会变更或间歇超时；本 sprint 只能证明当前可用，并通过 fallback/重试/禁用门降低后续风险。
- GitHub release Atom 占比高，新增同域来源可能造成连接突发；保持 `NEWS_FEED_CONCURRENCY=4`。
- 内容相似来源过多会降低信噪比；优先一方官方与稀缺主题，不以数量作为目标。
- 工作树已有其它 workstream 改动；只修改 `news-collector` 与本 sprint/solution 文档，避免覆盖用户变更。

# Phase 2: Plan

待调研结果汇总后填写。

# Phase 3: Work

待执行。

# Phase 4: Review

待审查。

# Phase 5: Compound

待沉淀。
