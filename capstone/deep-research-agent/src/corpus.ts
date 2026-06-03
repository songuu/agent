/**
 * 毕业项目 · 内置语料（知识来源）
 *
 * WHY: Deep Research Agent 的核心是「检索 → 推理 → 引用」。要让它在没有真实联网的情况下
 * 也能完整跑通，我们内置一段「多主题的虚构资料」当作可被检索的知识库。
 *
 * 这些资料故意写成现实中不存在的细节（虚构的版本号、基准数字、命名），原因有二：
 *  1) 教学可复现：任何人 clone 下来不配真实搜索 API 也能跑出「带引用」的研究报告。
 *  2) 凸显 RAG 价值：模型训练语料里没有这些「私有事实」，不检索就只能瞎编（幻觉），
 *     检索后才能给出可溯源的答案——这正是 RAG 要解决的问题。
 *
 * 想换成「真实联网搜索」时，无需改这里：只要在 tools.ts 里把 search 工具的实现
 * 换成调用 Tavily / Bing / SerpAPI，把返回结果整理成同样的 {source, content} 形状即可，
 * 上层 agent 一行不用动（接口不变，实现可换——这是工具系统的核心收益）。
 */

/** 一篇语料文档：title 作为「引用来源」展示，text 作为可检索正文。 */
export interface CorpusDoc {
  /** 来源标题（会出现在最终报告的「引用来源」里，便于溯源）。 */
  title: string;
  /** 正文。一段聚焦一个主题，方便向量检索按语义命中。 */
  text: string;
  /** 可选的来源链接（虚构，演示「引用可点击」的形态）。 */
  url?: string;
}

/**
 * 内置语料：围绕「TypeScript / Agent / 向量数据库」三大主题，外加成本与工程化。
 * 每条都带一个虚构来源标题，最终报告会据此生成「参考来源」清单。
 */
export const CORPUS: ReadonlyArray<CorpusDoc> = [
  {
    title: "TypeScript 严格模式实践手册（虚构）",
    url: "https://docs.example.com/ts/strict",
    text: `TypeScript 的严格模式（strict）是一组类型检查开关的集合，开启后能在编译期拦截大量隐藏 bug。其中 noUncheckedIndexedAccess 尤为关键：开启它之后，通过下标访问数组或对象的结果类型会变成 T | undefined，强制开发者显式处理「可能取不到」的情况。虚构基准显示，在一个 12 万行的中台项目里开启严格模式后，运行时空指针类异常下降了约 63%。代价是改造期需要补大量判空守卫，建议新项目从第一天就开启，老项目则按目录逐步收敛。`,
  },
  {
    title: "TypeScript 与 AI 应用工程化（虚构）",
    url: "https://docs.example.com/ts/ai",
    text: `在 AI 应用里，TypeScript 的最大价值是用类型把「不确定的模型输出」收敛成「确定的程序契约」。常见做法是用 zod 定义一个 schema 作为单一事实来源：既用它约束模型按结构产出 JSON，又用它在运行期校验、还能用 z.infer 反推静态类型，三者永远同步。虚构团队 Orbit AI 报告称，引入 zod 校验加失败重试（retry-repair）后，结构化输出的一次通过率从 71% 提升到 96%。`,
  },
  {
    title: "什么是 AI Agent（虚构白皮书）",
    url: "https://docs.example.com/agent/intro",
    text: `AI Agent 是一种能「自主决定下一步做什么」的程序：它不是把用户的话直接翻译成一次模型调用，而是在一个循环里反复「思考 → 调用工具 → 观察结果 → 再思考」，直到任务完成或触达步数上限。与普通聊天机器人的根本区别在于「能动手」——通过工具（搜索、计算、读写文件、调用 API）与外部世界交互。Agent 的能力上限，往往由它能用的工具集决定，而不是模型本身。`,
  },
  {
    title: "Agent 循环与多步推理（虚构）",
    url: "https://docs.example.com/agent/loop",
    text: `一个稳健的 Agent 循环有几个不变量：每一次模型发起的工具调用（tool_use）都必须有对应的工具结果回传，否则下一轮请求会报错；循环必须有 maxSteps 上限防止死循环；每一步都应可观测（记录用了哪个工具、tokens、耗时）。虚构压测表明，给 Agent 加上「先规划再执行」的两段式结构后，平均完成步数从 9.4 步降到 5.1 步，且答案的可引用率明显提升——因为规划阶段已经把「需要查什么」想清楚了。`,
  },
  {
    title: "规划-执行模式（Plan-and-Execute，虚构）",
    url: "https://docs.example.com/agent/plan",
    text: `Plan-and-Execute 是一种常见的 Agent 架构：先让模型产出一份结构化的「研究计划」（把大问题拆成若干可检索的子问题），再逐条执行检索与推理，最后汇总。它的好处是把「想清楚要查什么」和「动手去查」解耦，既减少无效的工具调用，也让中间过程可审计。代价是多了一次规划的模型调用，对极简单的问题反而更慢——所以工程上常按问题复杂度决定是否启用规划。`,
  },
  {
    title: "向量数据库基础（虚构指南）",
    url: "https://docs.example.com/vector/basics",
    text: `向量数据库存储的是文本经 embedding 模型转换后的高维向量，检索时用余弦相似度等度量找「语义最近」的若干条，而不是关键词精确匹配。这让它擅长「意思相近但用词不同」的检索，是 RAG 的检索底座。常见产品有 pgvector、Pinecone、Qdrant、Milvus。一条经验法则：先用内存向量库（如本项目的 MemoryVectorStore）把流程跑通，数据量超过十万级、需要持久化与并发时再迁移到专用向量库，迁移成本主要在「接口对齐」而非算法。`,
  },
  {
    title: "RAG 检索增强生成实战（虚构）",
    url: "https://docs.example.com/vector/rag",
    text: `RAG（Retrieval-Augmented Generation）的流程是：把知识切成片段并向量化入库；用户提问时把问题向量化、检索 top-k 相近片段；再把这些片段连同问题一起交给大模型生成答案。它解决的是「模型没见过你的私有/最新数据」的问题，并天然支持「标注来源、可溯源」。虚构评测显示，在企业内部问答场景，RAG 把答案的事实准确率从纯模型的 58% 提升到 89%，但检索质量（切块大小、top-k、重排）才是上限的决定因素。`,
  },
  {
    title: "Embedding 模型选型（虚构对比）",
    url: "https://docs.example.com/vector/embeddings",
    text: `Embedding 是把文本映射成定长向量的模型。选型主要看三点：维度（影响存储与检索速度）、语义质量（影响召回准确率）、价格。虚构对比中，text-embedding-3-small 以极低单价提供了「够用」的中文语义质量，适合教学与中小项目；对召回要求极高的场景才考虑更贵的大维度模型。注意 Anthropic 官方不提供 embedding 模型，做 RAG 时通常搭配 OpenAI 或 Voyage AI 的 embedding。`,
  },
  {
    title: "LLM 成本控制（虚构最佳实践）",
    url: "https://docs.example.com/cost/control",
    text: `LLM 调用费用的公式很简单：输入 tokens × 输入单价 + 输出 tokens × 输出单价，单价通常按「每百万 tokens」计。控制成本的常见手段：用更小的模型跑简单子任务、给 Agent 设步数上限、对重复检索做缓存、把长上下文做摘要压缩。虚构案例显示，把一个研究型 Agent 的规划步骤换成更便宜的小模型，整体成本下降约 40%，而最终报告质量几乎无差异——因为规划阶段产出的是短文本，对模型能力要求没那么高。`,
  },
  {
    title: "工具系统设计（虚构）",
    url: "https://docs.example.com/agent/tools",
    text: `给 Agent 设计工具的几条原则：工具描述要写清「什么时候用、参数含义」，因为模型只能靠描述决定调不调；参数用 schema（如 zod）约束并在执行前校验，非法输入应返回可读错误让模型自我纠正，而不是抛异常中断整个循环；工具应「窄而专」，一个工具只做一件事，方便模型组合。虚构实验表明，把一个「万能搜索工具」拆成 search 与 calculator 两个专用工具后，模型选错工具的概率从 18% 降到 4%。`,
  },
];
