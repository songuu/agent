# RAG System Checkpoint（仓库内验收点）

> 位置：**RAG 系统实战项目前置 checkpoint**
> 全局导航：[课程导航](../../docs/navigation.md) · [RAG 连接指南](../../docs/rag-system-project.md) · [RAG 架构蓝图](../../docs/rag-architecture.md) · [企业知识库 Agent Capstone](../enterprise-knowledge-base-agent/README.md)

这个目录不是完整产品，而是跳到独立 `songuu/rag-system` 前的仓库内验收点。目标：先在本仓库确认你已经能把 RAG 系统的关键边界跑通，再进入更大的生产项目。

## 验收范围

- [ ] 写入路径知道要包含 ingestion、chunk、metadata、版本号。
- [ ] 查询路径知道要包含权限过滤、混合检索、rerank、context builder。
- [ ] 引用核验能抓出越界引用。
- [ ] golden set 能计算 recall@k、precision@k、MRR、nDCG。
- [ ] 无答案问题会拒答，而不是编造。
- [ ] CI gate 低于阈值会 exit 1。

## 运行

```bash
pnpm rag:capstone
```

它会跑一个纯离线 checkpoint：

1. 用固定 RAG 系统文档建立 BM25 检索索引；
2. 对 4 个 golden questions 生成检索结果；
3. 计算 recall / precision / MRR / nDCG；
4. 检查拒答正确性；
5. 检查引用编号是否越界；
6. 任一阈值失败则进程非零退出。

## 和外部项目的关系

本 checkpoint 只覆盖最小可验证闭环。继续做独立作品集项目时，再把这里的概念扩成完整产品：

| 本仓库 checkpoint | 独立 RAG 系统继续扩展 |
|---|---|
| 固定内置文档 | 多文件上传、解析、失败重试 |
| BM25 检索 | 向量库 + BM25 + rerank |
| 规则答案与引用 | LLM 生成 + 引用回放 |
| golden-set gate | Eval 数据集、趋势看板、线上回归 |
| 纯函数护栏 | 租户权限、PII、注入隔离、审计 |

完成本目录后，再读 [RAG 系统实战项目连接指南](../../docs/rag-system-project.md)。
如果你想先把 RAG 扩成企业知识库产品形态，读 [毕业项目 · 企业知识库 Agent](../enterprise-knowledge-base-agent/README.md)。

> 💡 **面试会问**：这个 RAG checkpoint 为什么用 golden-set gate（固定问答集 + 阈值）来判收，而不是人工抽查？纯函数护栏（拒答、引用越界检查）相比直接让 LLM 生成答案，好在哪、限制在哪？要把它扩成生产级 RAG 系统，你会先补哪一层（向量库 / 租户权限 / eval 看板）、为什么？
