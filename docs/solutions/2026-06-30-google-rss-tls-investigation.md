# Google AI / DeepMind RSS TLS 排查与解决方案

日期：2026-06-30

## 结论

`google-ai` 与 `deepmind` 的反复失败不是 RSS 内容格式问题，也不是 Supabase 写入问题。当前机器对 Google 域名的 DNS 被改写到 `198.18.0.0/15` fake-IP，并且 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` 指向 `http://127.0.0.1:9` 这个无效端口。失败发生在本机网络出口 / 代理 / TUN 层，表现为 TLS handshake/reset：

- `Client network socket disconnected before secure TLS connection was established`
- `curl: schannel: failed to receive handshake, SSL/TLS connection failed`
- `curl: Send failure: Connection was aborted`

因此，完整解决要分两层：

- 仓库代码层：增强 collector 对 `rss-parser.parseURL()` TLS 失败的恢复能力，避免单个请求路径脆弱导致直接丢源。
- 运行环境层：修正 Google 域名的代理/DNS 出口；否则所有 `*.google` / `*.googleblog.com` 官方 feed 都可能继续握手失败。

## 已验证证据

### 1. DNS 被 fake-IP/TUN 接管

命令：

```powershell
Resolve-DnsName blog.google
Resolve-DnsName deepmind.google
Resolve-DnsName blog.google -Server 8.8.8.8
Resolve-DnsName deepmind.google -Server 8.8.8.8
```

结果都落到：

```text
blog.google      A 198.18.0.140
deepmind.google  A 198.18.0.141
```

`198.18.0.0/15` 是保留测试网段，通常来自本地代理/TUN fake-IP，不是 Google 真实公网解析。

### 2. 代理环境变量无效

命令：

```powershell
Get-ChildItem Env:*proxy*
```

结果：

```text
HTTP_PROXY=http://127.0.0.1:9
HTTPS_PROXY=http://127.0.0.1:9
ALL_PROXY=http://127.0.0.1:9
GIT_HTTP_PROXY=http://127.0.0.1:9
GIT_HTTPS_PROXY=http://127.0.0.1:9
```

`127.0.0.1:9` 不是可用代理端口。Node 内置 `fetch` 默认不自动使用这些代理变量，但这个配置仍说明当前 shell 网络环境不是正常直连态。

### 3. RSS 地址状态

- `https://deepmind.google/blog/rss.xml`：间歇成功。修复后真实 `fetchFeed()` 曾在第 3 次尝试成功，返回 `100` 条，首条为 `Introducing computer use in Gemini 3.5 Flash`。
- `https://blog.google/technology/ai/rss/`：旧地址会 `301` 到 `https://blog.google/innovation-and-ai/technology/ai/rss/`。
- `https://blog.google/innovation-and-ai/technology/ai/rss/`：当前环境仍会 TLS reset。
- `https://blog.google/rss/`、`https://research.google/blog/rss/`、`https://ai.googleblog.com/feeds/posts/default`、`https://developers.googleblog.com/feeds/posts/default/-/AI`：同样走 Google 域，当前环境下也会 TLS reset。

## 已落地的代码修复

### 1. Google AI Blog 改成 canonical RSS

文件：`news-collector/src/sources.ts`

- 主 URL：`https://blog.google/innovation-and-ai/technology/ai/rss/`
- fallback URL：`https://blog.google/technology/ai/rss/`

原因：旧 URL 已经 301，主路径改成 canonical 可减少一次重定向和一个失败点。

### 2. `rss-parser.parseURL()` 失败后增加 `fetch + parseString` fallback

文件：`news-collector/src/rss.ts`

逻辑：

1. 对 source 主 URL 先走 `rss-parser.parseURL()`。
2. 如果遇到 TLS/socket/网络错误，再用 Node `fetch()` 拉 XML。
3. 用现有 `parseFeedString()` 解析 XML。
4. 如果主 URL 失败，再尝试 `fallbackUrls`。
5. 所有失败详情进入 `error` / `diagnostics`，包含 URL、抓取方法和最后错误。

这能覆盖 `rss-parser` HTTP 栈偶发失败但 Node fetch 能成功的场景。它不能绕过整个 Google 域都被本机代理层阻断的场景。

### 3. 单测覆盖

文件：`news-collector/__tests__/rss.test.mts`

新增用例：

- 模拟 `parseURL` 抛 `Client network socket disconnected before secure TLS connection was established`。
- 模拟 `globalThis.fetch` 返回 RSS XML。
- 验证 `fetchFeed()` 第 1 次尝试恢复成功。

旧重试用例也已更新：`parseURL` 与 fallback `fetch` 同时失败时，仍按 source retry policy 重试 5 次并返回 `ok:false`。

## 验证结果

相关测试通过：

```powershell
node node_modules\tsx\dist\cli.mjs --test news-collector\__tests__\rss.test.mts news-collector\__tests__\sources.test.mts news-collector\__tests__\collect.test.mts
```

结果：

```text
tests 14
pass 14
fail 0
```

真实探针结果：

```text
deepmind ok=true attempts=3 count=100
google-ai ok=false attempts=5
```

`deepmind` 已受益于重试 + fallback；`google-ai` 当前仍受本机 Google 域 TLS 出口故障影响。

## 环境侧最小修复动作

### 方案 A：修正本机代理端口

如果本机有 Clash / Mihomo / sing-box / v2rayN 等代理，先确认真实 HTTP 代理端口，常见端口为：

```text
127.0.0.1:7890
127.0.0.1:7897
127.0.0.1:10809
```

然后在运行 collector 的 shell 中设置为真实端口，例如：

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
$env:ALL_PROXY = "http://127.0.0.1:7890"
```

如果没有可用本地代理，不要保留 `127.0.0.1:9` 这类假代理值：

```powershell
Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:ALL_PROXY -ErrorAction SilentlyContinue
```

### 方案 B：修正 TUN / DNS 规则

当前 `blog.google` 和 `deepmind.google` 都解析到 fake-IP。需要在代理客户端里确认：

- TUN 模式正在运行。
- fake-IP 映射能被代理进程正确接管。
- `.google`、`.googleblog.com`、`blog.google`、`deepmind.google` 走代理规则，而不是被错误直连或丢弃。
- 如果使用 fake-IP，确保 collector 进程与代理 TUN 在同一网络命名空间和同一 Windows 用户会话下运行。

### 方案 C：生产服务器单独修复

如果生产机也失败，不要只在本地改。到生产机跑同样探针：

```bash
node -e "for (const u of ['https://blog.google/innovation-and-ai/technology/ai/rss/','https://deepmind.google/blog/rss.xml']) { try { const r=await fetch(u,{signal:AbortSignal.timeout(12000)}); console.log(u,r.status,r.headers.get('content-type')); } catch(e) { console.log(u,e.message,e.cause?.code,e.cause?.message); } }"
```

生产 PM2 / systemd 环境需要显式注入代理变量或修 DNS/TUN；不要依赖交互式 shell 的代理设置。

## 后续监控建议

1. 保留 `google-ai` / `deepmind` 为 enabled，因为两个源不是 feed 失效，而是当前出口不稳定。
2. 每次日报里继续记录 `diagnostics`，现在会包含主 URL、fallback URL、`parseURL` 与 `fetch+parseString` 的具体失败路径。
3. 如果连续 7 天 `google-ai` 仍失败，增加“Google AI Blog 官方内容替代源”审查任务，但不要直接用 `blog.google/rss/` 全站 feed 替代 AI 分类 feed，避免非 AI 内容污染。
4. 生产侧优先修代理/DNS；代码 fallback 只能处理单请求栈失败，不能绕过整个 Google 域出口不可达。
