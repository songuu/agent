---
title: "项目"
description: "按 ChatGPT Projects 的信息架构，把课程、源码解析、作品集和生产蓝图收束成项目工作区。"
---

# 项目

> 这个入口把“我要做什么”放到第一层，而不是让你先在章节、专题、文章和 capstone 之间来回找。

## 项目工作区

| 工作区 | 适合目标 | 入口 | 完成证据 |
|--------|----------|------|----------|
| Agent 基础项目 | 从 0 跑通模型调用、工具、记忆、RAG 最小闭环 | [全局课程导航](./navigation.md) | 每章示例能运行，能说清输入、工具、状态、输出边界 |
| 作品集项目 | 做一个能演示、能写简历、能被追问的业务 Agent | [毕业项目总览](../capstone/README.md) | README 验收清单 + smoke/eval + 简历话术 |
| 企业知识库项目 | 把 RAG、权限、事件流、定时任务和部署串成纵向系统 | [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) | 数据模型、API、事件协议、trace/eval、部署清单 |
| RAG 系统项目 | 从课程内 checkpoint 迁移到独立生产级知识库系统 | [RAG 系统实战项目](./rag-system-project.md) | ingestion、retrieval、rerank、citation、eval 全链路可验证 |
| 源码解析项目 | 以真实开源库为对象，练“基于源码回答”和 CodeMap 阅读 | [源码解析](../source-analysis/README.md) | Relevant Source Files、源码问答、CodeMap、阅读路径 |
| 前沿内容项目 | 按日期和体系层跟踪 Agent 生态变化 | [AI 资讯](../news/index.md) · [前沿文章库](../lessons/20-agent-frontier-news/README.md) | 文章来源、发布时间、采集时间、站内详情分层可追溯 |

## 推荐选择

| 你的当前状态 | 直接进入 | 不建议先做 |
|--------------|----------|------------|
| 还没写过 tool calling | [B6 Tool Calling](../agent-basics/06-tool-calling-mental-model.md) → [第 06 章](../lessons/06-building-a-tool-system/README.md) | 直接上多 agent 框架 |
| 想做作品集 | [毕业项目总览](../capstone/README.md) | 只堆 Prompt demo |
| 想做知识库产品 | [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md) → [RAG 系统实战项目](./rag-system-project.md) | 只做一个向量搜索页面 |
| 想读框架源码 | [源码解析](../source-analysis/README.md) | 从零散 API 文档开始背 |
| 想跟进生态 | [AI 资讯](../news/index.md) → [Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 只看社媒摘要 |

## 架构约定

项目入口只做“工作区索引”和“验收路由”，不复制各项目正文。

| 层 | 当前实现 | 原因 |
|----|----------|------|
| 导航层 | `.vitepress/config.mts` 挂顶栏、侧栏和下拉菜单 | 保持与全站现有导航架构一致 |
| 内容层 | Markdown 页面链接到现有专题、capstone、源码解析和资讯页 | 避免重复维护同一项目说明 |
| 验证层 | 每个项目保留自己的 smoke/eval/build 入口 | 项目完成证据必须来自原模块，不由索引页代理 |
| 发布层 | VitePress 构建统一生成静态页面 | 不引入新的运行时依赖 |

## 快速入口

- [毕业项目总览](../capstone/README.md)
- [企业知识库 Agent 蓝图](./enterprise-knowledge-base-agent.md)
- [RAG 系统实战项目](./rag-system-project.md)
- [源码解析](../source-analysis/README.md)
- [全局课程导航](./navigation.md)
