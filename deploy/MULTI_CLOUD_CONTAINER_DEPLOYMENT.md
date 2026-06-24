# 多云容器化部署规划

## 目标

当前阿里云主机是 Nginx + PM2 + 少量 Docker 的混合形态。要支持阿里云、火山云、腾讯云之间随意迁移，目标不是让每个云厂商脚本各写一套，而是统一成：

```text
本地/CI 构建镜像
  -> 推镜像仓库，或 docker save 走 SSH
  -> 目标云 Docker Compose up
  -> 宿主机 Nginx 做 TLS、鉴权、路径转发
  -> 路由级健康检查
```

## 当前四项目盘点

只读盘点来源：线上 Nginx 路由、PM2 进程、监听端口、`/opt` 目录。

| 项目 | 公开入口 | 当前运行方式 | 端口/路径 | 容器化状态 |
|------|----------|--------------|-----------|------------|
| `songuu-home` | `/` | Nginx 静态 root | `/opt/songuu-home` | 待做，最后迁移 |
| `agent-build` | `/agent-build/` | Nginx alias + PM2 runner + PM2 news job | static `/opt/agent-build/current/.vitepress/dist`，runner `5174` | 本轮已新增 |
| `aicrew` | `/aicrew/` | PM2 `aicrew-studio` | Next.js `3101`，`/opt/aicrew/current-server` | 待对应仓库 Dockerfile |
| `deploy-management` | `/pipeline/`、`/api/`、`/oapi/`、`/login`、`/auth/` | PM2 `dm-web` + `dm-api`，`dm-tekton-bridge` 当前停止 | web `3000`，api `4000` | 待对应仓库 Compose |

`agent-build-runner`、`news-collector`、`notion:cron` 不是独立公开项目，归入 `agent-build` 的服务组。

## 本轮新增文件

| 文件 | 作用 |
|------|------|
| `Dockerfile` | 多阶段构建：`site` 静态站镜像，`app-runtime` Node 运行镜像 |
| `.dockerignore` | 排除 `.env`、私有部署脚本、构建产物、Git 元数据 |
| `deploy/compose/agent-build.compose.yml` | 运行 `agent-build-site`、`agent-build-runner`、可选 jobs |
| `deploy/compose/agent-build.env.example` | Compose 变量模板 |
| `deploy/nginx/agent-build.conf.template` | 容器内 Nginx 模板 |
| `deploy/nginx/songuu-host.container.conf.example` | 宿主机 Nginx 切换示例 |
| `deploy/cloud-projects.json` | 当前四项目迁移清单 |
| `scripts/deploy-container.ps1` | 一键容器部署脚本 |

## agent-build 一键容器部署

只做 dry-run：

```powershell
pwsh scripts/deploy-container.ps1 -DryRun -Provider aliyun -SkipTests -SkipBuild
```

无镜像仓库，直接通过 SSH 传镜像：

```powershell
pwsh scripts/deploy-container.ps1 `
  -Provider aliyun `
  -RuntimeEnvFile .env `
  -EnableJobs
```

使用镜像仓库：

```powershell
pwsh scripts/deploy-container.ps1 `
  -Provider tencent `
  -DeployHost root@<tencent-ip> `
  -ImageRepository registry.example.com/songuu/agent-build `
  -UseRegistry `
  -RuntimeEnvFile .env `
  -EnableJobs
```

火山云：

```powershell
$env:AGENT_BUILD_VOLCENGINE_HOST = "root@<volcengine-ip>"
pwsh scripts/deploy-container.ps1 `
  -Provider volcengine `
  -ImageRepository registry.example.com/songuu/agent-build `
  -UseRegistry
```

## 脚本行为

`scripts/deploy-container.ps1` 默认执行：

1. 解析 provider profile。
2. 运行门禁：
   - `pnpm typecheck`
   - `npx tsx knowledge-graph/data/visuals.test.mts`
   - `npx tsx knowledge-graph/generate.test.mts`
   - `npx tsx .vitepress/theme/diagram-zoom.test.mts`
   - `npx tsx .vitepress/theme/reduced-motion.test.mts`
   - `pnpm news:test`
   - `pnpm notion:test`
3. 构建两个镜像：
   - `agent-build-site:<tag>`
   - `agent-build-runtime:<tag>`
4. 有 `-UseRegistry` 时 push；否则 `docker save` 后 `scp` 到目标云。
5. 上传 Compose、Compose `.env`、运行时 env。
6. 目标云 `docker compose up -d`。
7. 目标云本机 `curl http://127.0.0.1:<SitePort>/healthz`。

## 宿主机 Nginx 切换

容器启动后先不要直接替换原 Nginx。推荐顺序：

1. 目标云启动容器，默认 `127.0.0.1:8088`。
2. 本机验证：

```bash
curl -fsS http://127.0.0.1:8088/healthz
curl -fsS -H 'Host: songuu.top' http://127.0.0.1:8088/agent-build/
```

3. 把宿主机 Nginx 的 `/agent-build/` 从 `alias` 切到 `proxy_pass http://127.0.0.1:8088`。
4. `nginx -t && systemctl reload nginx`。
5. 远端 loopback + 公网 HTTPS 验证。

示例见 `deploy/nginx/songuu-host.container.conf.example`。

## 四项目迁移顺序

1. `agent-build`：风险最低，已有本轮容器路径；保留原 `scripts/deploy.ps1` 回滚。
2. `aicrew`：Next.js 项目，补对应仓库 Dockerfile，切 `/aicrew/`。
3. `deploy-management`：Web/API/bridge 多服务，先迁移 web/api，bridge 单独评估。
4. `songuu-home`：根路由，最后迁移，避免影响登录入口和默认首页。

## 回滚策略

`agent-build` 切换后保留两条回滚线：

- 旧路径回滚：把 Nginx `/agent-build/` 改回 `alias /opt/agent-build/current/.vitepress/dist/`。
- 容器回滚：回到旧镜像 tag。

```bash
cd /opt/agent-build-container
docker compose --env-file .env -f compose.yml down
```

或：

```bash
docker compose --env-file .env -f compose.yml up -d
```

把 `.env` 中镜像 tag 改回上一版即可。

## 云厂商边界

脚本不使用阿里云、火山云、腾讯云 SDK。云厂商差异只保留在：

- SSH 目标。
- 镜像仓库前缀。
- 安全组放行 22、80、443。
- DNS/TLS。
- 数据盘和备份策略。

## 非目标

- 不自动创建 ECS/CVM。
- 不自动申请证书。
- 不自动修改线上 Nginx。
- 不把 `.env` 或 service role key 写入仓库。
- 不一次性迁移四项目；按路由逐个切。
