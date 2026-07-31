---
type: sprint
status: complete
created: 2026-07-31
completed: 2026-07-31
---

# 2026-07-31 RSS 同步失败项修复

## 请求

解决服务端 RSS 同步中今日暴露的失败项，聚焦：

- `owasp-genai` feed 返回 HTTP 403。
- Hacker News 正文抓取出现 HTTP 429 / reader HTTP 403。
- 单条英文文章翻译返回非严格 JSON，导致 `translation_status=failed`。

## 实施

- `news-collector/src/sources.ts`：保留 `owasp-genai` 注册但设为 disabled，避免每日采集持续产生 403 单源失败噪音。
- `news-collector/src/article-content.ts`：Hacker News discussion 页直接降级为 `empty`，保留 feed 标题/摘要，不再把正文抽取 429/403 记为 failed。
- `news-collector/src/translate.ts`：翻译重试携带上一轮校验错误和响应片段，提升非 JSON 响应后的自修复概率。
- 已部署到远端 PM2 runtime：`/opt/agent-build/worker-runtimes/news-translation-tool-output-20260730171446`，并重启 `news-collector`。

## 验证

- 本地先跑失败测试：新增三项测试在实现前失败，覆盖 OWASP disabled、HN skip、翻译 repair prompt。
- 本地 `node --experimental-transform-types --test news-collector\__tests__\sources.test.mts news-collector\__tests__\article-content.test.mts news-collector\__tests__\translate.test.mts`：21/21 pass。
- 本地 `npm run news:test`：86/86 pass。
- 本地 `npm run typecheck`：pass。
- 本地 `git diff --check`：exit 0，仅有 CRLF warning。
- 远端 `pm2 restart news-collector --update-env`：成功，`pm2 describe news-collector` 显示 online，restarts=1，unstable restarts=0。
- 远端 registry 探针：`{"owaspEnabled":false,"enabledCount":59}`。
- 远端 HN 探针：`{"calls":0,"status":"empty"}`。

## 未执行

- 未手动重跑生产采集写库，避免重复写 PostgreSQL 与触发翻译模型成本；下一次定时采集会加载已部署代码。