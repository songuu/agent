import { ARTICLES } from "./graph";

export type ConceptVisualKind =
  | "loop"
  | "pipeline"
  | "space"
  | "compare"
  | "layers"
  | "stream"
  | "shield"
  | "fusion";

export interface ConceptVisual {
  chapter: string;
  kind: ConceptVisualKind;
  title: string;
  summary: string;
  steps: readonly string[];
  takeaway: string;
}

export type ConceptHighlightTone = "core" | "warning";

export interface ConceptHighlight {
  tone: ConceptHighlightTone;
  label: string;
  body: string;
}

export interface ConceptReference {
  title: string;
  url: string;
  kind: string;
  note: string;
}

export const CONCEPT_VISUALS: ConceptVisual[] = [
  {
    chapter: "01",
    kind: "layers",
    title: "Agent = 模型能力 + 执行机制",
    summary: "把 Agent 拆成四层后，初学者能看见它不是一个神秘人格，而是 LLM 外面包了循环、工具、记忆和停止条件。",
    steps: ["LLM 生成下一步", "Loop 反复推进", "Tools 接触外部世界", "Memory 回灌历史"],
    takeaway: "看不懂 Agent 时，先问缺的是哪一层。",
  },
  {
    chapter: "02",
    kind: "stream",
    title: "一次 LLM 调用是无状态的请求-响应",
    summary: "模型不会记住上一轮；每次调用都要把 system、messages、参数重新装好，再读取文本、停止原因和 token 用量。",
    steps: ["准备 messages", "发送 chat/stream", "接收 token", "汇总 usage", "写回历史"],
    takeaway: "所谓记忆不是模型自动保存，而是你下一次请求主动回传。",
  },
  {
    chapter: "03",
    kind: "pipeline",
    title: "Prompt 是可测试的行为规格",
    summary: "角色、任务、格式、示例和温度共同决定输出形态；提示词越像规格，越容易评估和迭代。",
    steps: ["Role", "Task", "Format", "Examples", "Temperature", "Eval"],
    takeaway: "不要把 prompt 当咒语，把它当一份会进版本库的规格。",
  },
  {
    chapter: "04",
    kind: "loop",
    title: "ReAct 是一圈可观察、可停止的循环",
    summary: "Thought、Action、Observation 每轮只前进一步；maxSteps 把开放式探索收进一个可控边界。",
    steps: ["Thought: 判断缺口", "Action: 调用工具", "Observation: 写回证据", "Stop: 答案或安全阀"],
    takeaway: "循环图能帮你定位问题是在模型思考、工具执行、结果回灌还是停止条件。",
  },
  {
    chapter: "05",
    kind: "pipeline",
    title: "原生工具调用把文本协议升级成结构化请求",
    summary: "模型只负责提出 tool call；参数校验、执行副作用、错误回传都留在本地代码边界内。",
    steps: ["ToolSpec", "Model toolCalls", "Validate args", "Execute tool", "Return tool result"],
    takeaway: "工具调用不是让模型执行代码，而是让模型请求你的代码执行。",
  },
  {
    chapter: "06",
    kind: "layers",
    title: "工具系统把校验、执行、分发叠成一个安全边界",
    summary: "zod schema 是单一契约，registry 控制可用工具集合，run() 把未知参数和异常都变成可回灌的文本。",
    steps: ["Zod schema", "ToolSpec", "Registry", "Safe run", "Error feedback"],
    takeaway: "工具越多，越要先收口注册表和错误边界。",
  },
  {
    chapter: "07",
    kind: "layers",
    title: "短期记忆不是存储库，而是请求前的装配顺序",
    summary: "system、摘要、最近消息三段一起进入模型；窗口外信息要压缩，否则成本和噪声会一起膨胀。",
    steps: ["System 规则", "滚动摘要", "最近 N 轮原文", "本轮用户问题"],
    takeaway: "记忆 bug 常出在装配顺序，而不是模型真的记不住。",
  },
  {
    chapter: "08",
    kind: "space",
    title: "Embedding 把字面不同的句子放进同一片语义空间",
    summary: "向量检索看的不是词是否相同，而是方向是否接近；这就是「汽车」能命中「轿车」的原因。",
    steps: ["文本进入 embedding 模型", "生成高维向量", "余弦相似度排序", "取 top-k 语义命中"],
    takeaway: "分数是排序信号，不是绝对真理。",
  },
  {
    chapter: "09",
    kind: "pipeline",
    title: "RAG 是检索和生成之间的一条证据传送带",
    summary: "资料先被切块入库，问题再触发检索，最后把命中的片段送进生成提示，答案才有可追溯依据。",
    steps: ["Load", "Chunk", "Embed", "Retrieve", "Augment", "Generate"],
    takeaway: "RAG 质量差时，沿着管线逐段查，不要只调 prompt。",
  },
  {
    chapter: "10",
    kind: "compare",
    title: "推理范式是在成本、控制力、稳定性之间选控制流",
    summary: "ReAct 适合动态探索，Plan-and-Execute 适合可拆任务，Reflection 用额外调用换质量。",
    steps: ["ReAct: 边想边做", "Plan: 先拆再跑", "Reflection: 批评后改写"],
    takeaway: "不是哪个范式高级，而是哪种控制流匹配任务风险。",
  },
  {
    chapter: "11",
    kind: "loop",
    title: "现代多 Agent 编排先选拓扑，再派 worker",
    summary: "主线程保留目标、约束和最终判断；subagent、agent team、worktree、handoff 或 agent-as-tool 只在边界清晰时加入。",
    steps: ["目标与约束", "选择拓扑", "隔离权限", "Worker 产出", "汇总验证", "审批/合并"],
    takeaway: "拆 agent 前先切任务、上下文、权限、产物和验证边界。",
  },
  {
    chapter: "12",
    kind: "compare",
    title: "框架选型是在两类运行时之间取舍",
    summary: "AI SDK 更像一次生成调用的增强版，LangGraph 更像可恢复的状态机；手写代码负责让你看懂二者边界。",
    steps: ["手写原理", "AI SDK: 前端流式", "LangGraph: 状态图", "迁移边界"],
    takeaway: "先知道自己需要的是流式交互，还是长流程状态恢复。",
  },
  {
    chapter: "13",
    kind: "pipeline",
    title: "结构化输出把自由文本变成可执行契约",
    summary: "模型先按 schema 输出 JSON，代码再运行期校验；失败时把错误回传给模型修复。",
    steps: ["Prompt 贴契约", "Model 输出 JSON", "Zod 校验", "Retry Repair", "Typed Object"],
    takeaway: "TypeScript 类型只管编译期，模型输出必须运行期验。",
  },
  {
    chapter: "14",
    kind: "stream",
    title: "流式 UX 优化的是体感路径",
    summary: "总耗时可能不变，但首字更早出现，用户能看见系统仍在推进；取消和清理必须一起设计。",
    steps: ["请求发起", "首 token 到达", "逐块渲染", "取消信号", "finally 清理"],
    takeaway: "streaming 是交互协议，不只是 console.log 慢慢打印。",
  },
  {
    chapter: "15",
    kind: "pipeline",
    title: "Eval 把非确定性输出变成可比较的趋势",
    summary: "固定数据集、评分器、阈值和失败明细，让模型变化不再只靠感觉判断。",
    steps: ["Dataset", "Run SUT", "Rule score", "LLM judge", "Pass rate", "Regression gate"],
    takeaway: "LLM 测试很少追求单条绝对正确，更关注整体质量是否退化。",
  },
  {
    chapter: "16",
    kind: "layers",
    title: "可观测性把一次任务展开成 Trace 树",
    summary: "每个模型调用、工具调用和成本估算都是 span；聚合后才能看见最慢、最贵、最容易失败的环节。",
    steps: ["Trace id", "LLM span", "Tool span", "Tokens", "Latency", "Cost"],
    takeaway: "没有 trace，就只能猜 Agent 为什么慢、贵、错。",
  },
  {
    chapter: "17",
    kind: "shield",
    title: "安全护栏是多层信任边界",
    summary: "外部资料永远是数据，不是命令；隔离、脱敏、出口校验和人工确认要分层叠加。",
    steps: ["Untrusted data", "隔离标注", "工具最小权限", "出口校验", "Human gate"],
    takeaway: "不要指望一个 system prompt 解决所有提示注入。",
  },
  {
    chapter: "18",
    kind: "stream",
    title: "部署把脚本变成可并发、可超时、可观测的服务",
    summary: "HTTP 包装只是第一层；真正的生产边界在超时、错误兜底、SSE、密钥和优雅退出。",
    steps: ["Request", "Guards", "Agent run", "SSE stream", "Timeout", "Health check"],
    takeaway: "能本地跑一次，不等于能作为服务长期运行。",
  },
  {
    chapter: "19",
    kind: "layers",
    title: "Agent 生态是一组可替换的工程层",
    summary: "协议、SDK、运行时、工具、治理和部署各管一层；选型时从需求向下拆，不从名词向上堆。",
    steps: ["Model", "Tools", "Protocol", "SDK", "Runtime", "Governance"],
    takeaway: "生态地图的价值，是帮你判断该买哪层、手写哪层。",
  },
  {
    chapter: "capstone",
    kind: "pipeline",
    title: "毕业项目把课程能力串成研究流水线",
    summary: "规划、检索、工具、结构化汇总、成本统计和护栏连成一条可演示的端到端 Agent。",
    steps: ["Plan", "Search", "Reason", "Save note", "Summarize", "Report"],
    takeaway: "毕业项目不是新知识点，而是前面所有边界的集成验收。",
  },
  {
    chapter: "rag-chunk",
    kind: "pipeline",
    title: "分块策略决定 RAG 能不能先把证据切对",
    summary: "固定长度、递归切分和 Markdown 结构感知都在处理同一个问题：让 chunk 既完整又不过大。",
    steps: ["Raw doc", "Split rules", "Overlap", "Metadata", "Chunk list"],
    takeaway: "坏分块会让后续检索、精排、生成全都背锅。",
  },
  {
    chapter: "rag-hybrid",
    kind: "fusion",
    title: "混合检索把两种召回信号合并成一个排序",
    summary: "关键词路线擅长精确字面，向量路线擅长语义泛化；RRF 让两路排名互相补位。",
    steps: ["Query", "BM25 rank", "Vector rank", "RRF fusion", "Merged top-k"],
    takeaway: "一路搜不到不代表答案不存在，可能只是召回信号太单薄。",
  },
  {
    chapter: "rag-rerank",
    kind: "compare",
    title: "召回和精排是两种不同目标",
    summary: "第一段尽量别漏，第二段再把噪声压下去；把两者混成一个步骤，通常既漏又乱。",
    steps: ["Recall: 求全", "Candidate pool", "Rerank: 求准", "Final context"],
    takeaway: "RAG 排序问题先问当前阶段要的是覆盖率还是准确率。",
  },
  {
    chapter: "rag-query",
    kind: "pipeline",
    title: "查询改写是在检索前扩大命中面",
    summary: "multi-query 用多个措辞并行检索，HyDE 先生成假想答案再检索，让向量更贴近资料表达。",
    steps: ["User question", "Multi-query", "HyDE", "Parallel retrieve", "Merge dedupe"],
    takeaway: "改写目标不是让问题更好看，而是让召回更全。",
  },
  {
    chapter: "rag-eval",
    kind: "layers",
    title: "RAG 评估要把错误拆成三个裁判",
    summary: "上下文是否相关、答案是否忠实、答案是否回答问题，三件事分开打分才能定位坏环。",
    steps: ["Context relevance", "Faithfulness", "Answer relevance", "Failure slice"],
    takeaway: "一个总分不够用，RAG 需要知道错在检索还是生成。",
  },
  {
    chapter: "rag-prod",
    kind: "pipeline",
    title: "生产化 RAG 是持续入库和带权限检索的系统",
    summary: "从文档进入系统到答案返回用户，中间要经过解析、索引、过滤、检索、评估和观测。",
    steps: ["Ingest", "Parse", "Index", "Permission filter", "Retrieve", "Observe"],
    takeaway: "生产 RAG 的难点不是一次问答，而是长期更新和边界隔离。",
  },
  {
    chapter: "rag-contextual",
    kind: "pipeline",
    title: "Contextual Retrieval：先补语境，再入索引",
    summary: "chunk 被切出来后会丢标题、章节和文档背景；把这些上下文补回索引文本，能让 BM25 与向量召回都重新看见关键语境。",
    steps: ["原始文档", "切出 chunk", "补标题/章节", "入 BM25/向量索引", "召回恢复"],
    takeaway: "Contextual Retrieval 不是改写事实，而是在索引前把被切块丢掉的语境补回来。",
  },
  {
    chapter: "rag-agentic",
    kind: "loop",
    title: "Agentic RAG：检索后先判断，再决定下一步",
    summary: "一次 top-k 不够可靠；显式把 retrieve、grade、rewrite、answer/refuse 做成状态机，证据不足就重试，无答案就拒答。",
    steps: ["Retrieve", "Grade", "Rewrite", "Re-retrieve", "Answer/Refuse"],
    takeaway: "Agentic RAG 的价值在控制流：不要拿不够的证据硬答。",
  },
  {
    chapter: "rag-security",
    kind: "shield",
    title: "RAG 安全是套在检索面上的三道确定性防线",
    summary: "检索来的外部内容默认不可信：先检测注入指令并隔离，再脱敏 PII，最后核验引用是否真有来源，三道纯函数防线层层收口。",
    steps: ["检索片段(不可信)", "注入检测/隔离", "PII 出口脱敏", "引用可核验", "安全上下文"],
    takeaway: "RAG 的攻击面在「检索内容」；先上确定性护栏，再谈模型对齐。",
  },
  {
    chapter: "rag-index",
    kind: "pipeline",
    title: "索引的本质：把全库扫描换成只看几个桶",
    summary: "暴力检索逐条比全库（O(N)）；IVF 先把向量按邻近分桶，查询只比最近的几个桶——用一点点召回换数量级的比较次数下降。",
    steps: ["全库聚类分桶", "查询比质心", "只钻 nprobe 桶", "桶内取 top-k", "金标算 recall"],
    takeaway: "ANN 不是更聪明的精确，而是用可控召回损失换速度；nprobe 就是那个旋钮。",
  },
  {
    chapter: "rag-context",
    kind: "pipeline",
    title: "上下文工程：把检索结果装配成最省、最好读的提示",
    summary: "检索到 ≠ 用得上：先去重删整片冗余、压缩裁超长、按 token 预算挑子集，再把最该读的片段放到首尾——对抗模型「中间遗忘」(lost-in-the-middle)。",
    steps: ["多路检索片段", "近重复去重", "超长片段压缩", "预算内打包", "按注意力重排", "装配最终上下文"],
    takeaway: "上下文工程是确定性纯函数：去重/压缩/预算/重排各司其职，把召回结果装配成最省、最好读的提示。",
  },
  {
    chapter: "lg-stategraph",
    kind: "pipeline",
    title: "手写 StateGraph：State + 函数节点 + 边，把 createReactAgent 拆开",
    summary: "图 = 带 reducer 的共享 State + 返回 partial 更新的函数节点 + 边；沿 START→节点→END 跑，reducer 把各节点的 partial 更新合并成终态。",
    steps: ["定义 State 与 reducer channels", "写函数节点（返回 partial）", "addEdge 连成流程", "compile 编译图", "invoke 沿边累积成终态"],
    takeaway: "createReactAgent 只是预制版；手写 StateGraph 才看清 channel/reducer/节点/边这套机制。",
  },
  {
    chapter: "lg-routing",
    kind: "loop",
    title: "条件边：让图在运行时自己决定走向（分支 / 循环 / 扇出）",
    summary: "addConditionalEdges 用一个 router 函数读 State 返回下一个节点名：返回更早的节点=循环（ReAct 骨架）、按 State 选 handler=分支、返回一组 Send=扇出 map-reduce；recursionLimit 兜底防失控。",
    steps: ["router 读 State", "分支：选 handler", "循环：指回更早节点", "recursionLimit 兜底", "Send 扇出 map-reduce"],
    takeaway: "线性图只会一条道走到黑；条件边才让图能分支、能循环、能扇出——这是状态机图真正的威力。",
  },
  {
    chapter: "lg-checkpoint",
    kind: "stream",
    title: "Checkpointer：给图一条可回溯、可续跑、可重放的状态时间线",
    summary: "compile 时挂 MemorySaver，invoke 带 thread_id，每个 super-step 的状态都被存成一个 checkpoint：同 thread 跨 invoke 自动续上、不同 thread 隔离；getState/getStateHistory 看快照与时间线，updateState 改写、invoke(null, 历史config) 从过去某点重放。",
    steps: ["compile 挂 checkpointer", "invoke 带 thread_id", "每个 super-step 存快照", "getState/History 回看时间线", "updateState 人工改写", "从历史 checkpoint 重放"],
    takeaway: "跑完即忘的图加一个 checkpointer，就有了会话记忆、断点续跑和时间旅行——这是 human-in-the-loop 的底座。",
  },
  {
    chapter: "lg-hitl",
    kind: "shield",
    title: "Human-in-the-Loop：interrupt 暂停 → 人拍板 → Command 续跑",
    summary: "节点里 interrupt(payload) 把待批项交给人、就地暂停整张图（要靠 checkpointer 持久化暂停点）；payload 从 getState().tasks[].interrupts[].value 取；人用 invoke(new Command({resume}), cfg) 续跑，interrupt() 返回该值，条件边按它放行(apply)或拦截(cancel)。",
    steps: ["propose 准备待批项", "interrupt 暂停交给人", "getState 读 payload", "Command(resume) 续跑", "条件边：放行 / 拦截"],
    takeaway: "interrupt + Command 让图能停下来等人拍板；续跑只能用 Command，普通 invoke 会重跑——这是审批门/人工纠偏的底座。",
  },
  {
    chapter: "lg-multiagent",
    kind: "fusion",
    title: "多 Agent 编排：supervisor 中心化调度 vs 并行异构 team",
    summary: "把多个专职 agent 当节点编排进一张图。两种基本拓扑：supervisor 用条件边按任务类型把每条任务派给对应 worker、干完回到 supervisor 循环到队空（串行、顺序可控）；parallel team 从 fork 一次连出多条边让多个角色并行、产出经 append reducer 汇集、join 排序聚合（并行、顺序无关）。",
    steps: ["多专职 agent = 多节点", "supervisor 条件边派活", "worker 干完回 supervisor", "fork 并行多角色", "join 排序聚合"],
    takeaway: "多 Agent 不是堆人数，而是选对拓扑——中心化调度还是并行协作，全建立在前四章的 channel/reducer/条件边/Send 之上。",
  },
];

const CONCEPT_HIGHLIGHTS: Partial<Record<string, readonly ConceptHighlight[]>> = {
  "01": [
    { tone: "core", label: "核心判断", body: "Agent 不是更会聊天的 LLM，而是 LLM 外挂循环、工具、记忆和停止条件后的执行系统。" },
    { tone: "warning", label: "易错边界", body: "一次问答能解决的问题不要套 Agent；需要多步、外部信息或真实动作时再引入。" },
  ],
  "02": [
    { tone: "core", label: "核心判断", body: "LLM 调用本质是无状态函数：每次请求都必须重新带上 messages、参数和上下文。" },
    { tone: "warning", label: "易错边界", body: "模型不会自动记住上一轮；所谓记忆来自应用层把历史重新装进下一次请求。" },
  ],
  "03": [
    { tone: "core", label: "核心判断", body: "Prompt 是行为规格：角色、任务、格式、示例和评估标准越清楚，输出越可控。" },
    { tone: "warning", label: "易错边界", body: "不要把提示词当玄学咒语；把它放进版本库，用数据集持续验证。" },
  ],
  "04": [
    { tone: "core", label: "核心判断", body: "ReAct 的价值在于每轮只前进一步，并把观察结果回灌给下一轮决策。" },
    { tone: "warning", label: "易错边界", body: "没有 maxSteps、scratchpad 和工具错误回传，循环很容易失控或重复烧钱。" },
  ],
  "05": [
    { tone: "core", label: "核心判断", body: "工具调用只是模型发起结构化请求，真正执行、副作用和校验必须留在本地代码。" },
    { tone: "warning", label: "易错边界", body: "不要信任模型生成的参数；先 schema 校验，再执行工具，再把结果回传。" },
  ],
  "06": [
    { tone: "core", label: "核心判断", body: "工具系统的安全边界来自 schema、registry、safe run 和统一错误反馈。" },
    { tone: "warning", label: "易错边界", body: "工具越多越不能散落调用；注册表必须控制可见工具和分发路径。" },
  ],
  "07": [
    { tone: "core", label: "核心判断", body: "短期记忆是请求装配策略，不是模型内部自动保存的私人记忆。" },
    { tone: "warning", label: "易错边界", body: "历史越多不一定越好；窗口、摘要和最近消息顺序会直接影响回答质量。" },
  ],
  "08": [
    { tone: "core", label: "核心判断", body: "Embedding 负责把文本放进语义空间，检索相似材料，不负责生成答案。" },
    { tone: "warning", label: "易错边界", body: "相似度分数只是排序信号；top-k 太小会漏，太大会把噪声带进后续生成。" },
  ],
  "09": [
    { tone: "core", label: "核心判断", body: "RAG 质量来自整条证据链：加载、分块、向量化、检索、注入和引用都要对。" },
    { tone: "warning", label: "易错边界", body: "答案错时不要只改 prompt；先沿管线查 chunk、召回、上下文和引用编号。" },
  ],
  "10": [
    { tone: "core", label: "核心判断", body: "推理范式是控制流选择：ReAct、Plan-and-Execute、Reflection 分别优化不同风险。" },
    { tone: "warning", label: "易错边界", body: "不要因为范式看起来高级就套用；按成本、可控性和任务不确定性选择。" },
  ],
  "11": [
    { tone: "core", label: "核心判断", body: "多 Agent 的关键不是人数，而是拓扑、权限、上下文和验证边界是否切清楚。" },
    { tone: "warning", label: "易错边界", body: "读任务可并行，写任务先隔离；职责不清时拆更多 agent 只会放大噪声和合并成本。" },
  ],
  "12": [
    { tone: "core", label: "核心判断", body: "框架选型先看运行时需求：轻量流式交互选 AI SDK，长流程状态恢复选 LangGraph。" },
    { tone: "warning", label: "易错边界", body: "上框架前先手写核心；不知道边界就迁移，会把简单问题变成框架问题。" },
  ],
  "13": [
    { tone: "core", label: "核心判断", body: "结构化输出必须运行期校验，TypeScript 类型不会自动约束模型返回。" },
    { tone: "warning", label: "易错边界", body: "只要求输出 JSON 不够；schema、解析容错和 repair retry 要连成闭环。" },
  ],
  "14": [
    { tone: "core", label: "核心判断", body: "Streaming 优化的是首字延迟和体感路径，让用户看见系统正在推进。" },
    { tone: "warning", label: "易错边界", body: "只会逐字打印不算完整流式 UX；取消、清理和错误状态必须一起设计。" },
  ],
  "15": [
    { tone: "core", label: "核心判断", body: "Eval 把非确定性输出变成可比较趋势，用通过率和失败样本判断退化。" },
    { tone: "warning", label: "易错边界", body: "单条答案对错不能代表系统质量；固定数据集和阈值才适合回归门禁。" },
  ],
  "16": [
    { tone: "core", label: "核心判断", body: "可观测性要把一次任务拆成 trace/span，记录模型、工具、token、耗时和成本。" },
    { tone: "warning", label: "易错边界", body: "没有 trace 就只能猜慢在哪里、贵在哪里、错在哪里。" },
  ],
  "17": [
    { tone: "core", label: "核心判断", body: "安全护栏是多层信任边界：外部内容只能当数据，不能当命令。" },
    { tone: "warning", label: "易错边界", body: "不要指望一个 system prompt 防住提示注入；输入隔离、权限和出口校验都要有。" },
  ],
  "18": [
    { tone: "core", label: "核心判断", body: "部署不是把脚本包成 HTTP，而是补齐无状态、超时、流式、健康检查和密钥边界。" },
    { tone: "warning", label: "易错边界", body: "能本地跑一次不等于能服务化；长期运行需要可并发、可观测、可优雅退出。" },
  ],
  "19": [
    { tone: "core", label: "核心判断", body: "Agent 生态要按层拆：模型、工具、协议、SDK、运行时、治理和部署各管一段。" },
    { tone: "warning", label: "易错边界", body: "不要从名词堆栈出发选型；先从产品需求反推必须购买或自建的层。" },
  ],
  capstone: [
    { tone: "core", label: "核心判断", body: "毕业项目是端到端验收：规划、检索、工具、结构化报告、引用和成本要串起来。" },
    { tone: "warning", label: "易错边界", body: "不要只追求能跑；要看报告是否有来源、步骤是否可观测、失败是否能定位。" },
  ],
  "rag-chunk": [
    { tone: "core", label: "核心判断", body: "分块决定证据能否被召回；chunk 必须在完整性和大小之间取平衡。" },
    { tone: "warning", label: "易错边界", body: "坏分块会让检索、精排和生成全背锅；先看 chunk，再调模型。" },
  ],
  "rag-hybrid": [
    { tone: "core", label: "核心判断", body: "混合检索把关键词精确命中和向量语义泛化合并，用 RRF 融合排名。" },
    { tone: "warning", label: "易错边界", body: "只用一路召回会盲；问题可能不是资料不存在，而是召回信号不够。" },
  ],
  "rag-rerank": [
    { tone: "core", label: "核心判断", body: "召回求全，精排求准；两段式让上下文更少噪声、更贴问题。" },
    { tone: "warning", label: "易错边界", body: "不要把 top-k 调大当万能修复；候选池和最终注入上下文是两件事。" },
  ],
  "rag-query": [
    { tone: "core", label: "核心判断", body: "查询改写在检索前扩大命中面，让问题更接近资料里的表达方式。" },
    { tone: "warning", label: "易错边界", body: "改写不是美化提问；目标是提高召回覆盖，之后还要合并去重。" },
  ],
  "rag-eval": [
    { tone: "core", label: "核心判断", body: "RAG 评估要分开看上下文相关性、忠实性和答案相关性。" },
    { tone: "warning", label: "易错边界", body: "一个总分定位不了问题；必须知道错在检索、生成还是问题未回答。" },
  ],
  "rag-prod": [
    { tone: "core", label: "核心判断", body: "生产化 RAG 是持续入库、权限过滤、检索精排、评估观测的长期系统。" },
    { tone: "warning", label: "易错边界", body: "一次 demo 问答不代表生产可用；更新、权限、失败恢复和监控才是主战场。" },
  ],
  "rag-contextual": [
    { tone: "core", label: "核心判断", body: "Contextual Retrieval 在入索引前给 chunk 补文档标题、章节路径等语境，让孤立片段重新可被召回。" },
    { tone: "warning", label: "易错边界", body: "补上下文不是把答案写进 chunk；原始正文必须保留可审计，生成式上下文也要和原文分层保存。" },
  ],
  "rag-agentic": [
    { tone: "core", label: "核心判断", body: "Agentic RAG 把检索后的证据判断显式化：够证据才回答，不够就改写重试，无答案就拒答。" },
    { tone: "warning", label: "易错边界", body: "不要把“多检索几次”当智能；没有 grade 和停止条件，只会放大成本与噪声。" },
  ],
  "rag-security": [
    { tone: "core", label: "核心判断", body: "RAG 把外部文档塞进提示，等于把不可信数据递到模型嘴边；检测注入、脱敏 PII、核验引用都该是确定性纯函数。" },
    { tone: "warning", label: "易错边界", body: "别指望模型自觉拒绝投毒内容或不泄露 PII；护栏要在进出检索的边界上代码强制，且可审计。" },
  ],
  "rag-index": [
    { tone: "core", label: "核心判断", body: "索引的本质是缩小比较集合：与其和全库每条算相似度，不如先用分桶/图把候选缩到一小撮，再精确排序。" },
    { tone: "warning", label: "易错边界", body: "ANN 是近似——nprobe/efSearch 太小会漏掉真正的最近邻；上线前必须拿暴力结果当金标量召回，别只看延迟。" },
  ],
  "rag-context": [
    { tone: "core", label: "核心判断", body: "检索到 ≠ 用得上：上下文要在 token 预算内去重、压缩、挑子集，再按位置注意力把最该读的放到首尾——这些都是确定性纯函数，不是玄学。" },
    { tone: "warning", label: "易错边界", body: "别无脑塞满窗口：塞满 ≠ 读懂。高分重复会挤掉唯一信息、长文吃光预算、关键证据埋中部被「中间遗忘」忽略；每多塞一段都付 token 成本。" },
  ],
  "lg-stategraph": [
    { tone: "core", label: "核心判断", body: "StateGraph 三件套：带 reducer 的 channel（决定写入怎么合并）+ 返回 partial 更新的函数节点 + 连接它们的边；createReactAgent 只是其上的预制封装。" },
    { tone: "warning", label: "易错边界", body: "节点返回的是 partial 更新、不是整个 state；channel 不配 reducer 就走默认 replace（后写覆盖先写），想累积（如 messages）必须显式用 append reducer。" },
  ],
  "lg-routing": [
    { tone: "core", label: "核心判断", body: "条件边让图在运行时自己决定走向：一个 router 函数读 State 返回下一个节点名——分支=选一条、循环=指回更早节点、Send=动态扇出并行。" },
    { tone: "warning", label: "易错边界", body: "循环边必须有终止条件，否则只能靠 recursionLimit 兜底抛 GraphRecursionError；router 别依赖未初始化的 channel，否则首轮就走错分支。" },
  ],
  "lg-checkpoint": [
    { tone: "core", label: "核心判断", body: "Checkpointer 按 thread_id 持久化每个 super-step 的状态：同 thread 跨 invoke 自动续上（靠 reducer 累积，不用手动回传历史）、不同 thread 隔离；这是会话记忆、断点续跑与时间旅行的共同底座。" },
    { tone: "warning", label: "易错边界", body: "持久化是否「累积」取决于 channel 的 reducer，不是 checkpointer 本身：replace channel 仍会被新输入覆盖；MemorySaver 只活在内存，进程退出即丢，生产要换 SqliteSaver/PostgresSaver；updateState 也经 reducer 合并，不是无脑覆盖。" },
  ],
  "lg-hitl": [
    { tone: "core", label: "核心判断", body: "interrupt(payload) 在节点中途暂停整张图、把 payload 交给人；人用 invoke(new Command({resume}), cfg) 续跑，interrupt() 就地返回该值——这是审批门、人工纠偏、危险操作前确认的统一底座，建立在 checkpointer 之上。" },
    { tone: "warning", label: "易错边界", body: "interrupt 必须配 checkpointer 才能暂停/恢复；payload 不在 invoke 返回值顶层（result.__interrupt__ 为 undefined），要从 getState().tasks[].interrupts[].value 取；续跑只能用 Command({resume})——暂停时用普通 invoke(input) 不会 resume，而是带新输入从头重跑并再次暂停。" },
  ],
  "lg-multiagent": [
    { tone: "core", label: "核心判断", body: "多 Agent 就是把多个专职节点编排进一张图：supervisor 用条件边中心化调度（串行、顺序可控），parallel team 用 fork/join 并行协作（并行、靠 append reducer 合并）；选哪种拓扑取决于任务能否并行、是否需要顺序与集中控制。" },
    { tone: "warning", label: "易错边界", body: "并行 agent 的产出顺序不保证（与完成顺序有关），跨 agent 聚合必须靠 reducer + 排序消除顺序依赖，别假设边的书写顺序就是执行/收集顺序；supervisor 的循环边必须有终止条件（队列空 → END），否则要靠 recursionLimit 兜底。" },
  ],
};

export function getConceptHighlights(chapter: string): readonly ConceptHighlight[] {
  return CONCEPT_HIGHLIGHTS[chapter] ?? [];
}

export function getConceptReferences(chapter: string): readonly ConceptReference[] {
  return ARTICLES
    .filter((article) => article.chapters.includes(chapter) && article.kind !== "internal")
    .slice(0, 3)
    .map((article) => ({
      title: article.title,
      url: article.url,
      kind: article.kind,
      note: article.note ?? "外部延伸阅读",
    }));
}

export function renderConceptVisualHtml(visual: ConceptVisual): string {
  const safeChapter = escapeHtmlAttribute(visual.chapter);
  const titleId = `concept-visual-${safeChapter}`;
  return [
    `<section class="concept-visual concept-visual--${visual.kind}" aria-labelledby="${titleId}">`,
    "  <div class=\"concept-visual-copy\">",
    "    <p class=\"concept-visual-eyebrow\">抽象概念可视化</p>",
    `    <h3 id="${titleId}">${escapeHtml(visual.title)}</h3>`,
    `    <p>${escapeHtml(visual.summary)}</p>`,
    "  </div>",
    "  <div class=\"concept-visual-art\" aria-hidden=\"true\">",
    renderConceptVisualArt(visual),
    "  </div>",
    "  <ol class=\"concept-visual-flow\">",
    ...visual.steps.map((step, index) => `    <li style="--step-index: ${index}">${escapeHtml(step)}</li>`),
    "  </ol>",
    `  <p class="concept-visual-takeaway">${escapeHtml(visual.takeaway)}</p>`,
    renderConceptSupportHtml(visual.chapter),
    "</section>",
  ].join("\n");
}

function renderConceptSupportHtml(chapter: string): string {
  const highlights = getConceptHighlights(chapter);
  const references = getConceptReferences(chapter);
  if (highlights.length === 0 && references.length === 0) return "";

  return [
    "  <div class=\"concept-support\">",
    ...renderHighlightHtml(highlights),
    ...renderReferenceHtml(references),
    "  </div>",
  ].join("\n");
}

function renderHighlightHtml(highlights: readonly ConceptHighlight[]): string[] {
  if (highlights.length === 0) return [];
  return [
    "    <div class=\"concept-highlight-grid\" aria-label=\"本章重点标注\">",
    ...highlights.map((highlight) => [
      `      <p class="concept-highlight concept-highlight--${highlight.tone}">`,
      `        <span>${escapeHtml(highlight.label)}</span>`,
      `        <strong>${escapeHtml(highlight.body)}</strong>`,
      "      </p>",
    ].join("\n")),
    "    </div>",
  ];
}

function renderReferenceHtml(references: readonly ConceptReference[]): string[] {
  if (references.length === 0) return [];
  return [
    "    <div class=\"concept-references\" aria-label=\"外部理解引用\">",
    "      <p class=\"concept-references-title\">外部理解</p>",
    "      <ul>",
    ...references.map((reference) => [
      "        <li>",
      `          <a href="${escapeHtmlAttribute(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(reference.title)}</a>`,
      `          <span>${escapeHtml(reference.kind)}</span>`,
      `          <small>${escapeHtml(reference.note)}</small>`,
      "        </li>",
    ].join("\n")),
    "      </ul>",
    "    </div>",
  ];
}

function renderConceptVisualArt(visual: ConceptVisual): string {
  switch (visual.kind) {
    case "space":
      return renderSpaceArt();
    case "compare":
      return renderCompareArt(visual.steps);
    case "layers":
    case "shield":
      return renderLayerArt(visual.steps);
    case "stream":
      return renderStreamArt(visual.steps);
    case "loop":
      return renderLoopArt(visual.steps);
    case "fusion":
      return renderFusionArt(visual.steps);
    case "pipeline":
      return renderPipelineArt(visual.steps);
    default:
      // 闭合 union 下不可达；保留兜底，未来新增 kind 也有可见图形。
      return renderPipelineArt(visual.steps);
  }
}

/** 复用的矩形节点（圆角 + 居中文字），loop/pipeline/fusion 共用。 */
function renderSvgRectNode(
  cx: number,
  cy: number,
  width: number,
  height: number,
  label: string,
  index: number,
  maxLineLength = 12,
): string {
  return [
    `      <g class="concept-svg-node" style="--node-index: ${index}">`,
    `        <rect x="${roundSvgNumber(cx - width / 2)}" y="${roundSvgNumber(cy - height / 2)}" width="${roundSvgNumber(width)}" height="${roundSvgNumber(height)}" rx="12" />`,
    renderSvgText(cx, cy, label, maxLineLength),
    "      </g>",
  ].join("\n");
}

/** loop：把步骤摆成一个椭圆环，配上方向性流动的虚线，强调"可观察、可停止的循环"。 */
function renderLoopArt(steps: readonly string[]): string {
  const cx = 360;
  const cy = 120;
  const rx = 168;
  const ry = 80;
  const count = Math.max(steps.length, 1);
  const nodes = steps.map((step, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2; // 从正上方开始，顺时针
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return renderSvgRectNode(x, y, 132, 46, step, index);
  });

  return renderSvgShell("loop", "循环流程绘制示意", [
    `      <ellipse class="concept-svg-ring" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" />`,
    `      <text class="concept-svg-loop-center" x="${cx}" y="${cy + 9}" text-anchor="middle">↻</text>`,
    ...nodes,
  ]);
}

/** pipeline：步骤排成一条传送带，箭头串联，一个"包裹"沿带滑动，强调单向流水。 */
function renderPipelineArt(steps: readonly string[]): string {
  const count = Math.max(steps.length, 1);
  const margin = 54;
  const slot = (720 - margin * 2) / count;
  const boxW = Math.min(slot - 16, 138);
  const boxH = 56;
  const beltY = 116;
  const center = (index: number) => margin + slot * index + slot / 2;

  const boxes = steps.map((step, index) =>
    renderSvgRectNode(center(index), beltY, boxW, boxH, step, index),
  );
  const arrows = steps.slice(0, -1).map((_step, index) => {
    const fromX = center(index) + boxW / 2;
    const toX = center(index + 1) - boxW / 2;
    return `      <path class="concept-svg-flowarrow" d="M${roundSvgNumber(fromX)} ${beltY} H${roundSvgNumber(toX)}" marker-end="url(#conceptArrow)" />`;
  });

  return renderSvgShell("pipeline", "管线流程绘制示意", [
    `      <rect class="concept-svg-belt" x="${margin - 12}" y="${beltY + 46}" width="${720 - (margin - 12) * 2}" height="10" rx="5" />`,
    ...arrows,
    ...boxes,
    `      <circle class="concept-svg-pulse" cx="${margin}" cy="${beltY}" r="8" />`,
  ]);
}

/** fusion：两路召回（如 BM25 / 向量）从一个输入分流，再汇入融合节点，最后合并输出。 */
function renderFusionArt(steps: readonly string[]): string {
  const input = steps[0] ?? "输入";
  const laneA = steps[1] ?? "通道 A";
  const laneB = steps[2] ?? "通道 B";
  const merge = steps[3] ?? "融合";
  const output = steps[4] ?? steps[steps.length - 1] ?? "输出";

  const nodeW = 120;
  const nodeH = 46;
  const inputC = { x: 80, y: 120 };
  const laneAC = { x: 300, y: 64 };
  const laneBC = { x: 300, y: 176 };
  const mergeC = { x: 506, y: 120 };
  const outputC = { x: 646, y: 120 };
  const right = (c: { x: number }) => c.x + nodeW / 2;
  const left = (c: { x: number }) => c.x - nodeW / 2;

  const paths = [
    `      <path class="concept-svg-link" d="M${right(inputC)} ${inputC.y - 6} C 176 100, 206 70, ${left(laneAC)} ${laneAC.y + 4}" />`,
    `      <path class="concept-svg-link" d="M${right(inputC)} ${inputC.y + 6} C 176 140, 206 170, ${left(laneBC)} ${laneBC.y - 4}" />`,
    `      <path class="concept-svg-link" d="M${right(laneAC)} ${laneAC.y + 4} C 412 82, 432 104, ${left(mergeC)} ${mergeC.y - 6}" />`,
    `      <path class="concept-svg-link" d="M${right(laneBC)} ${laneBC.y - 4} C 412 158, 432 136, ${left(mergeC)} ${mergeC.y + 6}" />`,
    `      <path class="concept-svg-flowarrow" d="M${right(mergeC)} ${mergeC.y} H${left(outputC)}" marker-end="url(#conceptArrow)" />`,
  ];

  return renderSvgShell("fusion", "混合检索融合绘制示意", [
    ...paths,
    renderSvgRectNode(inputC.x, inputC.y, nodeW, nodeH, input, 0),
    renderSvgRectNode(laneAC.x, laneAC.y, nodeW, nodeH, laneA, 1),
    renderSvgRectNode(laneBC.x, laneBC.y, nodeW, nodeH, laneB, 2),
    renderSvgRectNode(mergeC.x, mergeC.y, nodeW, nodeH, merge, 3),
    renderSvgRectNode(outputC.x, outputC.y, nodeW, nodeH, output, 4),
  ]);
}

function renderLayerArt(steps: readonly string[]): string {
  const startY = 28;
  const layerHeight = 24;
  const gap = 8;
  const layers = steps.map((step, index) => {
    const inset = index * 16;
    const y = startY + index * (layerHeight + gap);
    return [
      `      <g class="concept-svg-layer" style="--node-index: ${index}">`,
      `        <rect x="${70 + inset}" y="${y}" width="${580 - inset * 2}" height="${layerHeight}" rx="10" />`,
      renderSvgText(360, y + 17, step, 20),
      "      </g>",
    ].join("\n");
  });

  return [
    renderSvgShell("layers", "分层结构绘制示意", [
      "      <rect class=\"concept-svg-frame\" x=\"44\" y=\"22\" width=\"632\" height=\"196\" rx=\"22\" />",
      ...layers,
      "      <path class=\"concept-svg-accent\" d=\"M102 205 H618\" />",
    ]),
  ].join("\n");
}

function renderCompareArt(steps: readonly string[]): string {
  const count = steps.length;
  const cardWidth = count > 0 ? 600 / count - 12 : 180;
  const cards = steps.map((step, index) => {
    const x = 70 + index * (cardWidth + 18);
    const hueClass = index % 3 === 0 ? "a" : index % 3 === 1 ? "b" : "c";
    return [
      `      <g class="concept-svg-card concept-svg-card--${hueClass}" style="--node-index: ${index}">`,
      `        <rect x="${x}" y="46" width="${cardWidth}" height="128" rx="16" />`,
      renderSvgText(x + cardWidth / 2, 112, step, 14),
      "      </g>",
    ].join("\n");
  });

  return [
    renderSvgShell("compare", "对比图绘制示意", [
      "      <path class=\"concept-svg-ribbon\" d=\"M70 194 H650\" />",
      ...cards,
      "      <text class=\"concept-svg-caption\" x=\"360\" y=\"210\">比较控制流、成本和稳定性</text>",
    ]),
  ].join("\n");
}

function renderStreamArt(steps: readonly string[]): string {
  const tokens = steps.map((step, index) => {
    const x = 70 + index * 112;
    const y = index % 2 === 0 ? 82 : 132;
    return [
      `      <g class="concept-svg-token" style="--node-index: ${index}">`,
      `        <rect x="${x}" y="${y}" width="92" height="34" rx="17" />`,
      renderSvgText(x + 46, y + 22, step, 10),
      "      </g>",
    ].join("\n");
  });

  return [
    renderSvgShell("stream", "流式动画绘制示意", [
      "      <path class=\"concept-svg-link concept-svg-stream-path\" d=\"M48 118 H676\" />",
      ...tokens,
      "      <circle class=\"concept-svg-dot\" cx=\"54\" cy=\"118\" r=\"7\" />",
    ]),
  ].join("\n");
}

function renderSpaceArt(): string {
  return [
    renderSvgShell("space", "语义向量空间绘制示意", [
      "      <path class=\"concept-svg-axis\" d=\"M66 184H660M82 202V34\" />",
      "      <g class=\"concept-svg-cluster concept-svg-cluster--a\">",
      "        <circle cx=\"226\" cy=\"84\" r=\"11\" />",
      "        <circle cx=\"278\" cy=\"62\" r=\"11\" />",
      "        <circle cx=\"318\" cy=\"112\" r=\"11\" />",
      renderSvgText(262, 154, "语义相近", 10),
      "      </g>",
      "      <g class=\"concept-svg-cluster concept-svg-cluster--b\">",
      "        <circle cx=\"520\" cy=\"136\" r=\"11\" />",
      "        <circle cx=\"574\" cy=\"98\" r=\"11\" />",
      renderSvgText(548, 174, "语义较远", 10),
      "      </g>",
      "      <path class=\"concept-svg-vector\" d=\"M86 182L300 94\" />",
      "      <path class=\"concept-svg-vector muted\" d=\"M86 182L552 116\" />",
      renderSvgText(360, 214, "Embedding 用距离表达语义接近程度", 24, "concept-svg-caption"),
    ]),
  ].join("\n");
}

function renderSvgShell(kind: string, label: string, body: readonly string[]): string {
  return [
    `    <svg class="concept-visual-canvas concept-visual-canvas--${kind}" data-codex-drawn-image="true" viewBox="0 0 720 240" role="img" aria-label="${escapeHtmlAttribute(label)}">`,
    "      <defs>",
    "        <linearGradient id=\"conceptGradient\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"1\">",
    "          <stop offset=\"0%\" stop-color=\"var(--concept-accent)\" stop-opacity=\"0.18\" />",
    "          <stop offset=\"100%\" stop-color=\"var(--concept-accent-2)\" stop-opacity=\"0.14\" />",
    "        </linearGradient>",
    "        <marker id=\"conceptArrow\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"7\" markerHeight=\"7\" orient=\"auto-start-reverse\">",
    "          <path d=\"M0 0L10 5L0 10Z\" />",
    "        </marker>",
    "      </defs>",
    "      <rect class=\"concept-svg-bg\" x=\"12\" y=\"12\" width=\"696\" height=\"216\" rx=\"28\" />",
    ...body,
    "    </svg>",
  ].join("\n");
}

function shorten(value: string): string {
  return value.replace(/^[^:：]+[:：]\s*/, "");
}

function renderSvgText(x: number, y: number, value: string, maxLineLength: number, className?: string): string {
  const lines = formatSvgLabelLines(value, maxLineLength);
  const lineHeight = 15;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  const classAttribute = className ? ` class="${className}"` : "";
  const tspans = lines
    .map((line, index) => `<tspan x="${roundSvgNumber(x)}" y="${roundSvgNumber(startY + index * lineHeight)}">${escapeHtml(line)}</tspan>`)
    .join("");
  return `        <text${classAttribute}>${tspans}</text>`;
}

function formatSvgLabelLines(value: string, maxLineLength: number): string[] {
  const label = shorten(value);
  if (label.length <= maxLineLength) return [label];

  const words = label.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxLineLength || current.length === 0) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const midpoint = Math.ceil(label.length / 2);
  return [label.slice(0, midpoint), label.slice(midpoint)];
}

function roundSvgNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}
