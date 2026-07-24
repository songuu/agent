# Agent Build PostgreSQL

该目录是五张内容表的自建 PostgreSQL 运行资产。Supabase Storage 暂时保持原地址，
关系数据通过同源 Content API 暴露给浏览器。

## 运行边界

- PostgreSQL 只绑定 `127.0.0.1:5432`，不暴露公网。
- `agent_build_reader` 只读且受 RLS 约束。
- `agent_build_writer` 仅供服务器定时任务使用，不进入浏览器或静态产物。
- 密码文件只保存在部署机 `secrets/`，权限必须是 `0600`，禁止提交。
- 数据目录为部署机 `data/`，不随站点 release 切换。

## 部署目录

生产机使用 `/opt/agent-build/shared/postgres`：

```text
postgres/
├── compose.yml
├── data/
├── init/
│   └── 00-create-roles.sh
└── secrets/
    ├── postgres-admin-password
    ├── agent-build-reader-password
    └── agent-build-writer-password
```

应用现阶段继续使用现有 Supabase `notion-assets` Storage API，不复制对象。
