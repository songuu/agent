---
title: "离线确定性 LangGraph 教学轨道（六件套原子 + 旋钮无关 invariant + 复核揪教学谬误）"
date: 2026-06-16
tags: [solution, langgraph, curriculum, offline-deterministic, knowledge-graph, teaching]
related_instincts: [teaching-demo-deterministic-payoff, concept-visual-kind-hardcoded-captions, kg-data-driven-doc-generation]
aliases: ["langgraph 课程怎么离线讲", "纯函数节点教 StateGraph", "并行产出顺序不保证 措辞", "多 agent 离线教学"]
---

# 离线确定性 LangGraph 教学轨道

## Problem

要给初学者仓库新增「进阶 LangGraph 专题」5 章（StateGraph / 条件边 / checkpointer / human-in-the-loop / 多 agent），但 LangGraph 教程默认都要接 LLM（需 key、结果不确定、不可回归），与本仓库「离线确定教学」伦理冲突。同时新章必须满足知识图谱「六件套原子契约」（`CONCEPT_VISUALS.length===CHAPTERS.length` 等测试守门）。

## Root Cause

LangGraph 的**核心价值根本不在 LLM**：StateGraph、channels+reducers、条件边/循环、Send 扇出、checkpointer 持久化、interrupt 恢复、多 agent 拓扑——**节点就是普通函数**，用纯函数节点（确定规则、不调模型）即可把这些机制全讲透，`needsKey:"none"`、无 key 也能跑、结果确定可回归。把「人」「agent」抽象成确定值（resume 值 / 纯函数 worker），审批两路径、多 agent 两拓扑全部离线确定。

## Solution

**离线建轨范式（每章六件套原子完成）**：

1. `src/shared/langgraph/*.ts` 纯函数节点图 + barrel 导出；worker 与 demo 期望**共用同一纯函数核**（如 `computeTaskResult`）→ 零漂移。
2. demo `index.ts`：每条结论用 `invariant()` 运行时硬核对，且**全部旋钮无关**——断言**构造性质**（`2×STEP×INVOKES`、单调递减、线程隔离、顺序保持、集合相等、重放复现、`supervise===tasks+1`），期望由纯函数核现场重算，**不写死具体数**。改练习常量不得让 demo 误报崩。
3. README：手写 mermaid + `## 五、小结与延伸` 锚点（`npm run kg` 在该锚点前注入 KG 段）。
4. smoke.ts 累加断言。
5. 数据源 `graph.ts`（CHAPTERS+CONCEPTS+RELATIONS+ARTICLES）+ `visuals.ts`（CONCEPT_VISUALS+HIGHLIGHTS）。
6. CONCEPT_VISUALS kind 每章**选不同且 steps 驱动**避主题串味：pipeline/loop/stream/shield/fusion（**避开 space=ch08、compare=ch10 硬编码文案画布**）。

**0.2.74 API 离线坐实（勿照搬记忆，每章先 spike 实跑）**：
- checkpointer：`compile({checkpointer:new MemorySaver()})` + `invoke(input,{configurable:{thread_id}})` 跨 invoke 持久化；`invoke({})` 续跑合法；累积靠 **reducer（sum/append）非 checkpointer 本身**；`getStateHistory` 倒序；time-travel=`invoke(null, 历史entry.config)`。
- interrupt：`result.__interrupt__`=undefined（顶层不暴露）；**payload 读法=`getState(cfg).tasks[].interrupts[].value`**；resume=`invoke(new Command({resume}),cfg)`；**坑**=暂停时普通 `invoke(input)` 不 resume，会带新输入从头重跑。

**Phase 4 对抗复核揪出的「教学谬误」类缺陷（高复用警示）**：
- **顺序无关的归因**：`append reducer` **保留到达顺序、不消除顺序**；map-reduce 汇总「顺序无关」真正来自**聚合运算可交换**（求和 a+b===b+a）。顺序敏感运算（拼接）必须先排序。别把顺序无关归到 append。
- **「不保证」是契约级 ≠ 运行时每次乱**：纯同步纯函数 demo 的并行收集顺序其实**每次确定**。所以「去掉 sort 多跑几次观察不稳定」的练习**不会复现**（违反「练习现象须可见」不变量）。正确表述：契约上不承诺=边书写顺序、不可依赖；要复现需改 `async`+不同延时。
- **过度概括**：「多个节点往 replace channel 写就互相覆盖」只对**先后串行写**成立；**同一步并行**写同一 replace channel 实际抛 `InvalidUpdateError`，非静默覆盖。

## Prevention

- 新建任何「机制教学」轨道，先问「这机制的本质需要外部依赖吗」——LangGraph/RAG 大量机制纯逻辑即可演示，离线优先。
- 教学 demo 的每条「现象」都要能被构造保证或现场计算坐实；练习改的常量必须让现象**真实可见**（写完实跑核对，别假设）。
- 涉及「顺序/并行/聚合」的措辞，分清三件事：**收集顺序**（reducer 行为）、**聚合是否可交换**（运算性质）、**契约保证 vs 本地观测**（不可依赖本地确定性）。三者常被混为一谈，是教学谬误高发区。
- 提交前对抗式复核（skeptic 默认 refuted）专治这类「单测/build 全绿但教学讲错」——纯函数测不到措辞正确性。
- 共享生成器（generate.ts）的改动若影响并行轨道，**推迟 + flag**，不擅动。

## Related
- [[teaching-demo-deterministic-payoff]] — 教学 demo 结论须确定性，本轨道 invariant 旋钮无关的延续
- [[concept-visual-kind-hardcoded-captions]] — kind 选择避 space/compare 硬编码文案
- [[kg-data-driven-doc-generation]] — 单一数据源 + 幂等注入派生 KG
- [[precommit-adversarial-review-catches-dom-races]] — 提交前对抗复核揪全绿漏网缺陷（本轮揪教学谬误同理）
