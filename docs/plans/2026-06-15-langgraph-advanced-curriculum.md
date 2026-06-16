---
title: "进阶 LangGraph / LangChain 课程轨道"
type: sprint
status: completed
created: "2026-06-15"
updated: "2026-06-16"
checkpoints: 5
tasks_total: 5
tasks_completed: 5
tags: [sprint, curriculum, langgraph, langchain]
aliases: ["langgraph-advanced", "进阶 LangGraph 专题"]
mode: "--auto + caveman"
invariants:
  - "新章六件套原子齐全：visuals.test 断言 CONCEPT_VISUALS.length===CHAPTERS.length"
  - "demo-runner registry 要求每章 ${dir}/index.ts 存在"
  - "自定义主题代码 No-Vue 硬不变量"
  - "CHAPTERS 单一事实源，sidebar/concept-visual/demo 白名单自动派生"
  - "新章 kind 避开 space(ch08)/compare(ch10) 硬编码文案画布，优先 steps 驱动的 pipeline/layers"
invariant_tests:
  - knowledge-graph/data/visuals.test.mts
  - knowledge-graph/generate.test.mts
  - scripts/demo-runner/registry.test.mts
---

# 进阶 LangGraph / LangChain 课程轨道

## Phase 1: 需求分析（Think）

### 范围

**做什么**：新建「进阶 LangGraph 专题」轨道 `langgraph-advanced/`，仿 `rag-advanced/` 的六件套数据驱动模式，**离线优先**深化 LangGraph / LangChain——把 lesson 12 只讲到的预制 `createReactAgent` 往下挖到真正的 StateGraph 机制。

**为什么离线可行**：LangGraph 的核心价值（StateGraph、channels+reducers、条件边/循环、checkpointer 持久化、interrupt 恢复、流式事件、Send 扇出）**节点就是普通函数，根本不需要 LLM**。用纯函数节点即可把这些机制讲透，`needsKey:"none"`，无 key 也能跑、结果确定可回归——契合本仓库「离线确定教学」伦理（同 rag-advanced 的 09-security 规则、10-index 合成向量、11-context 纯逻辑）。已用 spike 实证：条件循环边 / MemorySaver checkpointer / interrupt+Command(resume) 在 `@langchain/langgraph@0.2.74` 纯函数节点下 exit 0 跑通。

**不做什么**：
- 不改 lesson 12（保留为「上框架」温和入门；本轨道是其进阶延伸）。
- 不真接 LLM 做 agent（那需 key；个别确实需要模型的章可留 `needsKey:"llm"` 并最小化，或用确定性 FakeChatModel）。
- 不动 package.json 里可疑的裸 `langgraph` stray 依赖（无害、不可解析；用 `@langchain/langgraph`）。
- 不部署、不 git 提交（强制人工 gate）。

### 成功标准

学完本轨道，学习者能：手写 StateGraph（State/节点/边/编译/调用）；用条件边做路由/循环/分支；用 checkpointer 做持久化与断点恢复；用 interrupt 做 human-in-the-loop 审批门；并能说清「`createReactAgent` 到底替你包了什么」。

### 风险

1. **LangGraph 0.2 API 细节**（interrupt 值的暴露字段、reducer 累积语义、conditional pathMap 形态）——每章建时**实跑核对**，不照搬记忆（spike 已揭示 reducer 累积取决于设计 + 不重置输入；interrupt 值字段待建章确认）。
2. **六件套原子契约**——`visuals.test` 断言 `CONCEPT_VISUALS.length===CHAPTERS.length`，新章必须 graph/visuals/README/index/smoke 全齐才过测（全有或全无）。
3. **上下文压力**——本轮 compact 失败、上下文重；每章原子完成即 checkpoint，一窗口一大章。

## Phase 2: 技术方案（Plan）

### 入场扫描 - Invariants 继承（跨 sprint 防漂移）

| 子系统 | 既有 invariant | 本轨道如何保持 |
|--------|----------------|----------------|
| 知识图谱六件套 | `CONCEPT_VISUALS.length===CHAPTERS.length`；引用经 getConceptReferences 派生需 https+note≥1 | 每新章一次性补齐 graph(CHAPTERS+CONCEPTS+RELATIONS+ARTICLES) + visuals(CONCEPT_VISUALS+HIGHLIGHTS) |
| demo-runner | 每章 `${dir}/index.ts` 必须存在（registry 抛错守门） | 每新章必有可运行 index.ts |
| CONCEPT_VISUALS kind | space=ch08 Embedding、compare=ch10 控制流 画布文案硬编码 | 新章用 steps 驱动、主题中性的 pipeline/layers |
| 自定义主题 | No-Vue 硬不变量 | 本轨道只加 markdown + ts demo，不碰主题代码 |
| 教学 demo 确定性 | 结论由构造保证或现场计算+else诊断，不写死；练习参数须代码为真且在现象可见窗口 | 每章 demo invariant 硬核对 + 软结论诊断；练习实跑核对 |

### 入场扫描 - 集成路径

| 改动点 | 触发 | 中间层 | 持久化/可见 |
|--------|------|--------|-------------|
| 新章 CHAPTERS 条目 | `npm run kg` | 生成器派生 sidebar/concept-visual/demo 白名单 | ✅ 自动入站（site:build 验证无死链） |
| 新章 demo | `npx tsx .../index.ts` | 纯函数节点 StateGraph | ✅ 离线 exit 0（无 key） |

无 ❌ 断链：每新章自包含、KG 自动派生，无跨层半完成态。

### 入场扫描 - 债务清单

无继承债务（本轨道是全新 dir）。并行的 RAG 轨道 sprint（`2026-06-12-rag-completeness.md`，checkpoint-4，4/11）独立停泊，不受本轨道影响。

### 任务拆解

**MUST 块（→ 完成后 checkpoint / Review / Compound）**

- [x] LG1 (M) 新 `langgraph-advanced/01-stategraph-basics`（六件套）：手写 StateGraph——State/Annotation channels+reducers/节点/边/START/END/compile/invoke；揭开 createReactAgent 盖子。纯函数节点，needsKey:"none"。✅ lg smoke 16/0 + tsc/visuals/generate/registry/site:build 全绿 + demo exit 0 + 练习①实测 PASS + 修复 VitePress langgraph-advanced rewrite 缺口。
- [x] LG2 (M) 新 `langgraph-advanced/02-conditional-routing`（六件套）：条件边与路由——addConditionalEdges 分支/循环 + recursionLimit 安全阀 + Send 扇出 map-reduce。离线。✅ lg smoke 16→26/0 + tsc/visuals(33===33)/generate/registry/site:build 全绿 + demo exit 0(①~⑥ 旋钮无关) + 练习①(64→even) smoke 验证为真。
- [ ] LG3 (M) 新 `langgraph-advanced/03-checkpointing`（六件套）：Checkpointer 持久化与恢复——MemorySaver + thread_id + 状态快照 + time-travel（getState/updateState）。离线。

**SHOULD 块（→ 完成后 checkpoint #2 / Review / Compound）**

- [ ] LG4 (M) 新 `langgraph-advanced/04-human-in-the-loop`（六件套）：interrupt + Command(resume) 审批门——跑到一半等人工批准再继续。离线。
- [ ] LG5 (M) 新 `langgraph-advanced/05-multi-agent-graph`（六件套）：多 agent 编排图——supervisor/network，状态在子图/角色节点间流转（纯函数节点扮演 agent）。离线。

**COULD 块（推迟，按需）**

- 06-streaming-events（streamMode values/updates/messages 图执行事件流）。
- 07-lcel-runnables（LangChain LCEL：RunnableSequence/pipe/RunnableParallel/RunnableLambda，与 LangGraph 的关系）。

> 任务数 5 ≤ 8，均离线纯逻辑教学（L1-L2），无 L3/L4。一窗口一大章原子完成 + checkpoint。

### 验证策略

每章收尾全绿门：`npm run kg` → `visuals.test` + `generate.test` + `registry.test` + `tsc --noEmit` + 该章 demo 实跑 exit 0（含练习参数）+ `site:build`（新章入站无死链）。纯函数逻辑加 smoke 断言（若建公共 lg 工具模块）。每章提交前 Workflow 对抗复核（教学正确性 / 代码 / 集成一致性 3 视角 → 逐条对抗验证）。

## Phase 3: 变更日志

### 2026-06-15 LG1 · 01-stategraph-basics 新章（离线真 payoff，六件套原子完成）

- **LG1 新 01-stategraph-basics** ✅（lg smoke 16/0；tsc 0；visuals/generate/registry ok；site:build ok 新章入站无死链；demo exit 0；练习①实测 topWord the→cat PASS）
  - 新增 `src/shared/langgraph/textPipeline.ts`：纯函数节点（normalizeNode/tokenizeNode/countNode，countNode 并列按字典序最小确定）+ `buildTextPipeline({accumulateSteps})` 编译线性 StateGraph（START→normalize→tokenize→count→END）；append/replace reducer 对照开关。
  - 新增 barrel `src/shared/langgraph/index.ts`（4 值 + 3 类型导出）。
  - 新增 `langgraph-advanced/01-stategraph-basics/index.ts`：stream("updates") 看逐节点 partial → invoke 终态；结论 ①~④ 由构造保证用 `invariant()` 硬核对（append vs replace 的 steps / partial 持久化 / 两次 invoke 全等 / topWord 现场重算）。
  - 新增 `langgraph-advanced/01-stategraph-basics/README.md`（手写 mermaid flowchart + `npm run kg` 注入 KG 段 + createReactAgent 对照表）。
  - 新增 `langgraph-advanced/smoke.ts`（16 断言：节点纯函数+partial / append-replace reducer / partial 持久化 / 确定性 / 空输入兜底）；package.json 加 `lg:smoke` 脚本。
  - 数据源：`graph.ts` 加 CHAPTERS(lg-stategraph, needsKey:"none", part="进阶 LangGraph 专题") + CONCEPTS(lgsg-* 5) + RELATIONS(章内5+跨章6 接回 c12/c06/c07) + ARTICLES(LangGraph.js low-level concepts + workflows 教程)；`visuals.ts` 加 CONCEPT_VISUALS(kind:pipeline) + 高亮(core+warning)。
  - **VitePress 配置修复**（`vitepress-readme-rewrite-gotcha`）：`.vitepress/config.mts` 的 rewrites 只有 lessons/rag-advanced/capstone，缺 langgraph-advanced → 新章建成 `/README.html` 而非 `/index.html`（clean URL 404，被 `ignoreDeadLinks:true` 掩盖）。补 `langgraph-advanced/:topic/README.md→index.md` rewrite + chapterText 加 `进阶 LangGraph 专题→L{i+1}` 标签；重建后章节正确入 index.html、sidebar 显示「L1 手写 StateGraph」、无死链。
  - 离线策略：LangGraph 核心机制（StateGraph/channels+reducers/节点/边）纯函数节点即可演示，无需 LLM；已 spike 实证条件循环边/checkpointer/interrupt 在 0.2.74 离线跑通（后续 LG2-5 复用）。

### ⚠️ 并行写入发现（2026-06-15）

本轮验证时发现**另一个 session/进程在同一仓库并行推进 RAG sprint**（`2026-06-12-rag-completeness.md`）：git status 显示新增 `src/shared/rag/{agenticRag,contextualRetrieval,evalGate}.ts`、改动 `evaluate.ts`/`queryTransform.ts`，rag smoke 86→113、`npm run kg` 29→32 单元（含 2 个并行 RAG 新章 07/08）。本轨道与之**正交、共存全绿**，未触碰非我所建文件。但二者都改 `graph.ts`/`visuals.ts`/`config.mts`/`package.json`，**有共享文件写入冲突风险**——已就此暂停自动推进、向用户报告（见会话）。

### 2026-06-15 LG2 · 02-conditional-routing 新章（离线真 payoff，六件套原子完成）

- **LG2 新 02-conditional-routing** ✅（lg smoke 16→26/0，+10 断言；tsc 0；visuals(33===33)/generate/registry ok；site:build ok 新章建 index.html 入站无死链 sidebar L2；demo exit 0）
  - 新增 `src/shared/langgraph/routingGraphs.ts`：三张纯函数节点图——
    - `buildHalvingGraph({threshold})`：减半循环（条件边指回 halve）+ 终值奇偶分支（条件边选 reportEven/reportOdd）；终止由构造保证（value 严格减半单调递减）。
    - `buildRunawayGraph()`：恒循环图，演示 recursionLimit 抛 GraphRecursionError（图版 maxSteps 安全阀）。
    - `buildFanoutGraph()`：Send 扇出 map-reduce——START 条件边返回 `items.map(i=>new Send("worker",{item:i}))`，worker 翻倍写 results(append reducer)，reduce fan-in 求和；结果与完成顺序无关。
  - 接入 barrel（3 值 + 3 类型导出）。
  - 新增 `langgraph-advanced/02-conditional-routing/index.ts`：结论 ①~⑥ 由构造保证用 `invariant()` 硬核对，且**全部旋钮无关**（断言构造性质而非具体数：循环终止/单调递减+与纯函数模拟逐项一致/分支按实际奇偶/recursionLimit 抛错/扇出 N 得 N/reduce 顺序无关求和）。
  - 新增 `langgraph-advanced/02-conditional-routing/README.md`（手写 mermaid flowchart + KG 注入 + ReAct 骨架对照）。
  - `langgraph-advanced/smoke.ts` +10 断言（减半循环终止/单调/双向分支/确定性 + recursionLimit + Send 扇出/空输入兜底）。
  - 数据源：`graph.ts` 加 CHAPTERS(lg-routing) + CONCEPTS(lgrt-* 5：conditional-edge/branch/loop/recursion-limit/send-fanout) + RELATIONS(章内5+跨章6 接回 lgsg-edges-compile/lgsg-vs-prebuilt/lgsg-reducer/c04-react/c01-max-steps/c12-react-agent) + ARTICLES(LangGraph.js map-reduce + recursion-limit how-to)；`visuals.ts` 加 CONCEPT_VISUALS(kind:**loop**，环形契合循环主题) + 高亮。
  - 关键决策：invariant 全部**旋钮无关**（呼应 T9/T10 教训——练习改常量不得让 demo 误报崩；本章断言「终值≤阈值/单调/按实际奇偶」而非「5 步/odd」，对任意 START_VALUE/THRESHOLD 成立）。
  - 离线策略复用 LG1：纯函数节点，spike 已证条件边/Send/recursionLimit 在 0.2.74 离线 exit 0。config.mts 的 langgraph-advanced rewrite LG1 已加，本章无需改 config。
  - 共存验证：与并行 RAG sprint 工作共存全绿（kg 33 单元、rag smoke 不受影响）；改 graph.ts/visuals.ts 前即时重读锚点（无碰撞）。

### 2026-06-15 LG3 · 03-checkpointing 新章（离线真 payoff，六件套原子完成）

- **LG3 新 03-checkpointing** ✅（lg smoke 26→37/0，+11 断言；tsc 0；visuals(34===34)/generate/registry ok；site:build ok 新章建 index.html 入站无死链 sidebar L3 渲染 HTML 无 README href；demo exit 0 ①~⑥；kg 33→34 单元）
  - **先 spike 实跑核对 0.2.74 checkpointer/time-travel API**（勿照搬记忆）：确认 `compile({checkpointer:new MemorySaver()})` + `invoke(input,{configurable:{thread_id}})` 跨 invoke 持久化；同 thread 不重置、新输入经 reducer 并入（append/sum 累积、replace 覆盖）；`getState`→{values,next:[]已到END,checkpoint_id}；`getStateHistory`→倒序(newest-first) 每 super-step 一快照；`updateState(cfg,vals)`→写新 checkpoint(也经 reducer) 返回新 config；time-travel=`invoke(null,历史entry.config)` 从该 checkpoint 重放复现下游；不同 thread_id 完全隔离。
  - 新增 `src/shared/langgraph/checkpointGraphs.ts`：`buildCheckpointedLedger({step})` 编译挂 MemorySaver 的线性图（START→debit→credit→END），total 用 **sum reducer**（节点只声明增量，跨 invoke 自动累加）、trail append、label replace（仅供 updateState 精确覆盖演示）；+ `threadConfig(id)` 工具。接 barrel（2 值 + 3 类型）。
  - 新增 `langgraph-advanced/03-checkpointing/index.ts`：结论 ①~⑥ 由构造保证用 `invariant()` 硬核对、**全部旋钮无关**（持久化累积=2×STEP×INVOKES / 线程隔离 / getState.next 空 / 倒序时间线单调不增+最早=0 / updateState 只覆盖 label 不动 total / 时间旅行重放复现 full）。
  - 新增 `langgraph-advanced/03-checkpointing/README.md`（手写 mermaid flowchart + KG 注入 + human-in-the-loop 底座对照）；明确「累积是 reducer 的功劳、非 checkpointer 本身」「MemorySaver 仅内存、生产换 Sqlite/Postgres」「updateState 也经 reducer」三个易错点。
  - `langgraph-advanced/smoke.ts` +11 断言（持久化累积/trail累积/next空 + 线程隔离 + history head===getState/单调不增/最早0 + updateState 覆盖 label 不动 total + 历史 checkpoint 存在 + 重放复现）。
  - 数据源：`graph.ts` 加 CHAPTERS(lg-checkpoint) + CONCEPTS(lgcp-* 5：checkpointer/persist-accumulate/getstate/history/time-travel) + RELATIONS(章内5+跨章6 接回 lgsg-edges-compile/lgsg-reducer/lgrt-loop/c06-run-agent-loop/c07-conversation-as-array/c12-langgraph) + ARTICLES(LangGraph.js persistence concept + time-travel how-to)；`visuals.ts` 加 CONCEPT_VISUALS(kind:**stream**，时间线契合快照序列；区别 LG1 pipeline/LG2 loop) + 高亮(core+warning，warning 点明 reducer/内存/updateState 三坑)。
  - 关键决策：(1) invariant 旋钮无关延续（断言 2×STEP×INVOKES/单调/隔离 而非具体数）；(2) 用 sum reducer 让「跨 invoke 累积」自然成立，invoke({}) 续跑无需手动回传——spike 实证 invoke({}) 合法；(3) updateState 用独立 replace channel(label) 演示「精确覆盖」，避开 sum channel 的「+N 非覆盖」困惑，但在 warning/练习4 honest 点明该坑。
  - 共存验证：与并行 RAG sprint 共存全绿；改共享文件(graph.ts/visuals.ts)前即时重读锚点，graph.ts LG 章仍在 106-108 无碰撞；config.mts 的 langgraph-advanced rewrite LG1 已加，本章无需改 config。

### 2026-06-15 LG4 · 04-human-in-the-loop 新章（离线真 payoff，六件套原子完成）

- **LG4 新 04-human-in-the-loop** ✅（lg smoke 37→46/0，+9 断言；tsc 0；visuals(35===35)/generate/registry ok；site:build ok 新章建 index.html 入站无死链 sidebar L4 渲染 HTML 无 README href；demo exit 0 ①~⑥；kg 34→35 单元）
  - **先重 spike 实跑核对 0.2.74 interrupt/Command API**（LG2 探测未定，必实跑）：interrupt(payload) 暂停节点、first invoke 返回暂停【前】state、`result.__interrupt__`=undefined（顶层不暴露）；**payload 读法=`getState(cfg).tasks[].interrupts[].value`**；resume=`invoke(new Command({resume:val}),cfg)`→interrupt() 就地返回 val 续跑到 END；**关键坑**=暂停时普通 invoke(input) 不 resume，会带新输入从头重跑(propose×2)再次暂停（=第03章持久化语义：合并输入再跑一遍）。
  - 新增 `src/shared/langgraph/hitlGraphs.ts`：`buildApprovalGraph({approveWord})` 审批门图（START→propose→humanReview(interrupt 暂停)→条件边按 decision→apply 放行/cancel 拦截→END，挂 MemorySaver）；`readPendingInterrupt(graph,cfg)` 封装从 getState().tasks[].interrupts[].value 取 payload 的深路径。接 barrel（2 值 + 3 类型）。
  - 新增 `langgraph-advanced/04-human-in-the-loop/index.ts`：结论 ①~⑥ `invariant()` 硬核对、**全部旋钮无关**（暂停在 humanReview/next / payload.amount===输入 / 批准走 apply applied:amount / 拒绝走 cancel rejected 不含 apply / 同提交 approve≠reject 终态 / 普通 invoke 不 resume 仍 pending+propose×2）。
  - 新增 `langgraph-advanced/04-human-in-the-loop/README.md`（手写 mermaid 含 👤 人 + Command 回边 + KG 注入 + 危险工具确认对照）；点明三事实：interrupt 必须配 checkpointer、payload 不在返回值顶层、resume 必须用 Command。
  - `langgraph-advanced/smoke.ts` +9 断言（暂停/payload/批准/拒绝/人决定走向/普通 invoke 坑）；引入 `Command`。
  - 数据源：`graph.ts` 加 CHAPTERS(lg-hitl) + CONCEPTS(lghitl-* 5：interrupt/read-payload/command-resume/approval-gate/plain-invoke-pitfall) + RELATIONS(章内5+跨章6 接回 lgcp-checkpointer/lgcp-getstate/lgcp-time-travel/lgcp-persist-accumulate/lgrt-conditional-edge/c04-agent-loop) + ARTICLES(HITL concept + wait-user-input how-to)；`visuals.ts` 加 CONCEPT_VISUALS(kind:**shield**，审批门/护盾 steps 驱动；区别 LG1 pipeline/LG2 loop/LG3 stream) + 高亮(core+warning，warning 点明 checkpointer/payload位置/Command 三事实)。
  - 关键决策：(1) 把「人」抽象成确定 resume 值 → approve/reject 两路径离线确定；(2) interrupt payload 读取封装 readPendingInterrupt（避调用方记深路径，spike 实证 `tasks[].interrupts[].value`）；(3) ⑥ 把「普通 invoke 不 resume」做成旋钮无关 invariant（status 仍 pending + propose×2），这是 HITL 最常见坑；(4) shield kind 走 renderLayerArt(steps) 确认 steps 驱动、非 space/compare 硬编码。
  - 共存验证：改共享文件前即时重读锚点——graph.ts LG 章 106-108、lgcp 概念 341-345、visuals lg-checkpoint 303 一致无碰撞；config.mts 无需改。

### 2026-06-15 LG5 · 05-multi-agent-graph 新章（离线真 payoff，六件套原子完成，本轨道收官）

- **LG5 新 05-multi-agent-graph** ✅（lg smoke 46→55/0，+9 断言；tsc 0；visuals(36===36)/generate/registry ok；site:build ok 新章建 index.html 入站无死链 sidebar L5 渲染 HTML 无 README href；demo exit 0 ①~⑥；kg 35→36 单元）
  - **先 spike 实跑两拓扑离线 exit 0**：supervisor 调度循环（results 顺序保持/pending 清空/log 交替）；并行异构 team（**contributions 原始顺序不保证**——与边序无关，须 reducer + 排序，同 LG2 Send 教训）。
  - 新增 `src/shared/langgraph/multiAgentGraphs.ts`：`buildSupervisorGraph()`（START→supervisor→条件边按队首任务类型→math/echo/upperAgent→回 supervisor 循环→队空 END；pending replace、results/log append）+ `buildTeamGraph()`（START→fork→research/critique/summary 并行→join 排序聚合→END）+ `computeTaskResult(task)`（纯函数核，worker 与期望共用零漂移）+ `TEAM_ROLES`。接 barrel（4 值 + 4 类型）。
  - 新增 `langgraph-advanced/05-multi-agent-graph/index.ts`：结论 ①~⑥ `invariant()` 硬核对、**全部旋钮无关**（supervisor 每任务一次/按类型路由逐条===computeTaskResult/顺序保持/supervise===tasks+1 队空终止 / team 每角色一条按集合比对/join 排序聚合两次 invoke 全等）。
  - 新增 `langgraph-advanced/05-multi-agent-graph/README.md`（手写 mermaid 双 subgraph 拓扑对照 + KG 注入 + 拓扑选择表 + 收官串联五章）。
  - `langgraph-advanced/smoke.ts` +9 断言（supervisor 4 + 空队列兜底 + team 4）。
  - 数据源：`graph.ts` 加 CHAPTERS(lg-multiagent) + CONCEPTS(lgma-* 5：multi-agent/supervisor/worker-routing/parallel-team/order-independent-join) + RELATIONS(章内5+跨章6 接回 lgrt-loop/lgrt-send-fanout/lgsg-reducer + **主课 c11-supervisor-worker/c11-supervisor-routing/c11-scratchpad**) + ARTICLES(multi-agent concept + agent-supervisor 教程)；`visuals.ts` 加 CONCEPT_VISUALS(kind:**fusion**，多 agent 汇聚成一份输出；区别 LG1 pipeline/LG2 loop/LG3 stream/LG4 shield) + 高亮。
  - 关键决策：(1) 两拓扑对照教学（supervisor 串行中心调度 vs parallel team 并行协作）覆盖多 agent 核心；(2) `computeTaskResult` 纯函数核 worker/期望共用 → 旋钮无关零漂移；(3) 并行 `contributions` 按集合/排序比对（原始顺序不保证，spike 坐实）+ join 排序聚合 → 确定；(4) 强力接回主课 c11（LG5 = lesson 11 手写多 agent 的 LangGraph 图版）；(5) fusion kind 走 renderFusionArt(steps) 确认 steps 驱动。
  - 共存验证：改共享文件前即时重读锚点——graph.ts lg-hitl 109/lghitl 概念 349-353/关系 741 一致无碰撞；config.mts 无需改。

## Phase 4: 审查结果

> 5/5 build 任务全绿完成，进入多视角对抗复核（含 LG3/LG4/LG5 此前推迟的复核）。
> 复核方式：Workflow 多视角（教学正确性/代码/集成一致性）→ 逐条对抗验证（skeptic 默认 refuted）。
> 11 findings，5 confirmed（0 P0 / 1 P1 / 2 P2 / 2 P3），6 refuted。
> （对抗验证子 agent 因外部限流 carpool quota 退出，confirmed 由存活 reviewer 的细节核对坐实——尤其 P1 已逐字验证路径与标题。）

### Confirmed findings + 处理

| # | 级别 | 文件:位置 | 问题 | 处理 |
|---|------|-----------|------|------|
| 1 | **P1** | `05/README.md:21,162` | 链接 `../../lessons/11-multi-agent-systems/README.md` 不存在（真实目录 `11-multi-agent-orchestration`）+ 链接文案「多 Agent 系统/手写多 agent」与第 11 章规范标题「多智能体编排」漂移 | ✅ 修：两处路径改 `11-multi-agent-orchestration/README.md`，文案统一「第 11 章 · 多智能体编排」。site:build 验证渲染 HTML 链接解析到 `/lessons/11-multi-agent-orchestration/`，无 README 死链 |
| 2 | **P2(a)** | `01/README.md:72` | 「多个节点往它写就会互相覆盖」过度概括——同步串行写才是覆盖；**同一步并行**写同一 replace channel 实际抛 `InvalidUpdateError` 而非静默覆盖 | ✅ 修：补限定从句（先后写=覆盖）+ 前向指针到第 05 章 fork/join（并行聚合留到那里讲） |
| 3 | **P2(b)** | `05/README.md:14,98,148,161,239` | 「并行产出顺序不保证」措辞误导——纯同步纯函数 demo 收集顺序其实**每次确定**，练习 4「去掉 sort 多跑几次观察不稳定」**不会复现**（违反「练习现象须可见」不变量） | ✅ 修：全部重框为**契约级不保证**（append 不承诺=边书写顺序、不可依赖；本地同步确定但换异步/分布式就变）；练习 4 改为「本地仍一样，改 async+延时才会变」可真实复现 |
| 4 | **P3(a)** | `02/README.md:95` | Send 汇总「顺序无关」归因错——归到 append reducer，实则 append **保留到达顺序**；顺序无关来自 **reduce 求和可交换** | ✅ 修：澄清 append 负责收齐、顺序无关来自聚合运算可交换；顺序敏感运算（拼接）需排序（前向指针第 05 章） |
| 5 | **P3(b)** | `knowledge-graph/generate.ts`（KG 注入「与其他章节的关系」段） | 跨章关系标签显示原始 id「（第 lg-routing 章）」而非人类可读章号/标题；根因在 generate.ts 渲染逻辑 | ⚠️ **manual gate kept — 推迟**：generate.ts 是**共享生成器**，改它同时影响并行的 RAG 轨道全部章节输出；纯外观 P3，不阻塞收官。已 flag 给用户，待 RAG sprint 停泊后再做全局修（见下方「未决项」） |

### Refuted（6）

对抗验证否定的 findings（多为「疑似不变量破坏」「疑似死代码」「疑似 demo 误报」经核对站得住）：例 computeTaskResult 被疑重复实现（实为单一纯函数核 worker/期望共用，零漂移，故意）、supervisor 循环被疑可能不终止（队列单调递减+recursionLimit 双保险）、stream kind 被疑串味（renderLayerArt steps 驱动，非 ch08/ch10 硬编码）等。

### 第 6 视角 · 集成连续性（跨 sprint 强制）

- ✅ 不变量未破坏：`CONCEPT_VISUALS.length===CHAPTERS.length`（36===36）；每章 `${dir}/index.ts` 存在；No-Vue（本轨道只加 md+ts demo）；CHAPTERS 单一事实源自动派生 sidebar/concept-visual/demo 白名单；新章 kind 全避开 space/compare 硬编码（pipeline/loop/stream/shield/fusion，steps 驱动）。
- ✅ 无死代码：barrel 5 模块全被各章 index.ts + smoke.ts import。
- ✅ 无半下沉漂移：每新章自包含、KG 自动派生入站，无跨层中间态。
- ✅ 与并行 RAG sprint 共存全绿：仅 P3(b) 触及共享 generator → 已推迟，不擅动。

### auto-mode gate 汇总

- 自动通过：P1（obvious 死链/文案漂移）、P3(a)（一处归因措辞）。
- 教学正确性修（doc-only L1、限本轨道我新建文件、修复自有「demo 确定性/练习现象可见」不变量）：P2(a)、P2(b)。
- ⚠ manual gate kept：P3(b) generate.ts 共享生成器，影响并行 RAG 轨道 → 推迟 + flag。
- 强制保留 0 个 destructive/L4/安全 gate（本轮纯文档修订）。

### 未决项（交接给用户）

- **P3(b) 全局修**：`knowledge-graph/generate.ts` 的跨章关系标签把章 id（lg-routing）渲染成人类可读章号/标题。属共享生成器、影响 RAG 轨道全部章节，建议待并行 RAG sprint（`2026-06-12-rag-completeness.md`）停泊后单独做、统一重跑 `npm run kg` 验证两轨道。
- **提交/部署**：本轨道全部改动仍**未提交、未部署**（强制人工 gate，需显式 "go"）。

## Phase 5: 复利记录

### 2026-06-16 Compound（本轨道收官）

- **解决方案**：`docs/solutions/2026-06-16-langgraph-offline-teaching-track.md`——离线确定性 LangGraph 教学轨道范式（六件套原子 + 旋钮无关 invariant + 0.2.74 API 离线坐实 + Phase 4 复核揪「教学谬误」三类）。
  - ⚠️ 本仓库无 Codex 端 `scripts/sync-solution-index.js` / `index.jsonl`（那是 Codex runtime 投影）；`docs/solutions/*.md` 直接维护，无需 sync 步骤。
- **记忆（Claude memory）**：新增 `teaching-order-independence-triad.md`——并行/聚合教学必分清「收集顺序≠聚合可交换≠契约保证」，混淆是教学谬误高发区；已加 MEMORY.md 索引。延续 [[teaching-demo-deterministic-payoff]] / [[precommit-adversarial-review-catches-dom-races]]。
- **复用经验沉淀**：
  1. LangGraph 核心机制纯函数节点即可离线讲透（needsKey:"none"）——把人/agent 抽象成确定值，审批两路径、多 agent 两拓扑全确定可回归。
  2. invariant 旋钮无关（断言构造性质非具体数，期望纯函数核现场重算）是教学 demo 抗练习改崩的关键。
  3. 0.2.74 interrupt payload 在 `getState().tasks[].interrupts[].value`（非返回值顶层）；累积靠 reducer 非 checkpointer。
  4. 「顺序无关」三件事区分 + 「不保证=契约级非每次乱」是教学谬误高发，对抗复核专治全绿漏网。
- **本能信号**：六件套原子契约 + kind 避硬编码 + 共享文件改前重读锚点，均已在前序 memory 沉淀，本轮复用验证有效。

### Sprint 收官汇总

- **交付**：`langgraph-advanced/` 5 章（01 StateGraph → 02 条件边 → 03 checkpointer → 04 HITL → 05 多 agent），六件套全齐。
- **全绿门**：lg smoke **55/0**；tsc 0；visuals **36===36**；generate/registry ok；site:build ok（5 章 index.html 入站、sidebar L1-L5、渲染 HTML 无 README 死链、ch11 链接解析正确）；5 demo exit 0（①~⑥ 旋钮无关）。
- **Checkpoints**：5 次（一窗口一大章原子完成）。
- **Phase 4 复核**：11 findings → 5 confirmed（P1×1 修 + P2×2 修 + P3(a) 修 + P3(b) 推迟）/ 6 refuted。
- **auto-mode gate**：自动通过 P1/P3(a)（obvious）；教学正确性修 P2(a)/P2(b)（修自有不变量）；⚠ manual gate kept ×1（P3(b) 共享 generator）；强制 destructive/L4/安全 gate 0。

### 🏁 收尾预热（无下一 Phase）

- **关键文件**：本 sprint 文档 frontmatter（status: completed ✅）。
- **未决项（交接用户，强制人工 gate）**：
  1. **提交/部署**：全部改动**未提交、未部署**——需显式 "go"。提交范围须排除 `deploy.ps1`/`DEPLOYMENT.md`（含 SSH target，禁入公开仓库）；提交无 attribution；base 保持 `/agent-build/`。
  2. **P3(b) 全局修**：`knowledge-graph/generate.ts` 跨章关系标签渲染原始 id（「第 lg-routing 章」）→ 人类可读章号。共享生成器、影响并行 RAG 轨道，建议待 `2026-06-12-rag-completeness.md` 停泊后统一做。
- **风险预判**：与并行 RAG sprint 仍共用 graph.ts/visuals.ts/config.mts/package.json——后续任何提交前重新 `git status` + 重读锚点，避免裹入对方未完成改动。
