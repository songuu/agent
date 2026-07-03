# Agent 应用入口

这里收束独立部署的 Agent 子应用。课程站点只负责导航；每个子应用在自己的仓库或 monorepo app 中独立运行、独立部署、独立验证。

## 当前可访问应用

| 应用 | 类型 | 访问 | 说明 |
| --- | --- | --- | --- |
| SPIFFE mTLS Agent | 安全架构演示 | [打开应用](https://songuu.top/agent-demo/spiffe/) | 一页查看 Agent 双向认证、SVID、PeerPolicy、审计链路。 |

## 扩展约定

后续新增子应用时按同一模型接入：

| 字段 | 责任 |
| --- | --- |
| `id` | 稳定应用标识，例如 `spiffe-mtls-agent` |
| `title` | 导航显示名 |
| `href` | 公网入口，优先用完整 URL |
| `summary` | 一句话说明访问目的 |
| `ownerRepo` | 应用所属仓库 |
| `health` | 可验证健康检查地址 |

agent-build 不承载子应用运行时，只保留统一入口。子应用运行时由各自仓库的部署配置、PM2 进程和 Nginx 路由负责。