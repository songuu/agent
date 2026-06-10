# 环境搭建（第 00 章）

> 目标：5–15 分钟内把环境配好，让任意一章 `npx tsx ...` 能跑起来。
> 全局导航：[课程导航](./navigation.md) · [完整大纲](./curriculum.md) · [知识图谱](./knowledge-graph.md)

## 1. 安装运行时

- **Node.js ≥ 20**（推荐 20 或 22 LTS）。检查：

  ```bash
  node --version
  ```

  没有就去 https://nodejs.org 安装，或用 `nvm` / `fnm` 管理多版本。

- **pnpm**（包管理器，比 npm 快、省磁盘）。安装：

  ```bash
  npm install -g pnpm
  pnpm --version
  ```

  > 也可以用 npm / yarn，把下文 `pnpm` 换成对应命令即可。

## 2. 获取代码并安装依赖

```bash
git clone https://github.com/songuu/agent.git
cd agent
pnpm install
```

## 3. 配置 API Key

复制环境变量模板，然后填入你自己的 key：

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

打开 `.env`，**至少配置一个厂商**：

| 变量 | 用途 | 申请地址 |
|------|------|----------|
| `ANTHROPIC_API_KEY` | Claude（课程默认主线） | https://console.anthropic.com/ |
| `OPENAI_API_KEY` | OpenAI（对照实现 + **embedding 必需**） | https://platform.openai.com/api-keys |
| `OPENAI_BASE_URL` | 可选，OpenAI-compatible 平台 API 地址（如 SiliconFlow） | https://docs.siliconflow.cn/ |

> ⚠️ **第 08 章起的向量检索 / RAG 需要 embedding**，默认走 OpenAI-compatible embeddings endpoint。官方 OpenAI 默认模型是 `text-embedding-3-small`；SiliconFlow 可设为 `BAAI/bge-m3`。其余章节有任一厂商 key 即可。

切换默认厂商只改一行：

```bash
LLM_PROVIDER=anthropic   # 或 openai
```

SiliconFlow 示例：

```bash
LLM_PROVIDER=openai
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
OPENAI_API_KEY=sk-...
OPENAI_MODEL=deepseek-ai/DeepSeek-V4-Pro
OPENAI_EMBEDDING_MODEL=BAAI/bge-m3
```

`.env` 已被 `.gitignore` 忽略，**绝不会**被提交。

## 4. 验证

```bash
# 类型检查（不需要 key，应输出无错误）
pnpm typecheck

# 跑第一个例子（需要 key）
npx tsx lessons/02-first-llm-call/index.ts
```

看到模型的回答 + token 用量，即环境就绪 🎉。

## 5. 怎么跑每一章

每一章都是 `lessons/NN-名字/index.ts`，统一用：

```bash
npx tsx lessons/<章节目录>/index.ts
```

例如：

```bash
npx tsx lessons/04-the-agent-loop/index.ts
npx tsx lessons/09-rag-from-scratch/index.ts
```

毕业项目：

```bash
npm run capstone
# 等价于 npx tsx capstone/deep-research-agent/src/cli.ts
```

## 常见问题

- **`缺少环境变量 XXX`**：`.env` 没配或拼错变量名，对照 `.env.example`。
- **`pnpm: command not found`**：回到第 1 步装 pnpm，或改用 `npm install` / `npx`。
- **请求报 401 / 余额不足**：key 无效或账户没额度，去对应控制台检查。
- **中文乱码（Windows）**：终端用 UTF-8，PowerShell 可执行 `chcp 65001`。
- **想省钱**：把 `.env` 的模型换成更便宜的（如 `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` 或 `OPENAI_MODEL=gpt-4o-mini`）。

> 下一步 → [第 01 章 · 什么是 Agent](../lessons/01-what-is-an-agent/README.md)
