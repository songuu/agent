---
title: "企业知识库 Agent Capstone 接线"
date: 2026-06-18
tags: [solution, agent-build, curriculum, rag, capstone]
related_instincts: []
aliases: ["企业知识库 Agent 纵向项目", "RAG capstone 接线"]
---

# 企业知识库 Agent Capstone 接线

## Problem

外部“转型 Agent 全栈工程师”目录暴露出一个缺口：本课程横向模块完整，但企业知识库这种纵向作品集路线还不够显性。

## Root Cause

原体系已经有手写 Agent、RAG、LangGraph、流式 UX、评估、部署，但学习入口主要按章节和专题组织；学习者不容易看到“从上传资料到 Agentic RAG、权限、事件流、trace/eval、定时任务”的端到端交付路径。

## Solution

新增 `capstone/enterprise-knowledge-base-agent/README.md`，把蓝图拆成可执行项目：

- 产品边界：用户角色、MVP 主流程、非目标。
- 数据模型：tenant、collection、document version、chunk、memory、trace、job、eval case。
- 架构与接口：ingestion、retrieval、memory、event sink、API surface。
- Agent runtime：证据评分、改写重试、澄清、拒答、工具、审批、引用核验。
- 事件流：`status/evidence/citation/tool/token/error/done`。
- 测试验收：L1-L4 风险分层、golden set、4 周实现路线。

同时接入 `README.md`、`docs/navigation.md`、`docs/curriculum.md`、`docs/rag-architecture.md`、`docs/rag-system-project.md`、VitePress nav/sidebar、首页、知识图谱章节源，并运行 `pnpm kg` 同步生成图谱。

## Prevention

以后新增纵向项目时，不只新增单页文档；同时更新这些入口：

- `README.md`
- `index.md`
- `docs/navigation.md`
- `docs/curriculum.md`
- `.vitepress/config.mts`
- `knowledge-graph/data/graph.ts`
- 相关前置/后续项目文档

## Related

- [[2026-06-18-wechat-agent-album-reference-analysis]]
- [[2026-06-18]]
