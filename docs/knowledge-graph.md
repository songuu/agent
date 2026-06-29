# 🗺️ 全局知识图谱

> 本文件由 `npm run kg` 自动生成（数据源 [`knowledge-graph/data/graph.ts`](../knowledge-graph/data/graph.ts)）。**请勿手改**，改数据源后重跑即可。

交互式（可缩放/筛选/点节点看关联文章）版本：[`knowledge-graph/output/index.html`](../knowledge-graph/output/index.html)（下载到本地用浏览器打开）。

共 **45** 个单元、**264** 个概念、**409** 条关系、**164** 篇关联文章。

## 章节地图

```mermaid
flowchart LR
  subgraph P0["第一部分 · 基础概念"]
    C_01["01 什么是 Agent"]
    C_02["02 你的第一次 LLM 调用"]
    C_03["03 提示工程"]
  end
  subgraph P1["第二部分 · 从零手写核心"]
    C_04["04 手写 Agent 循环 (ReAct)"]
    C_05["05 工具调用基础"]
    C_06["06 从零构建工具系统"]
    C_07["07 短期记忆与上下文"]
  end
  subgraph P2["第三部分 · 知识与检索"]
    C_08["08 Embedding 与向量检索"]
    C_09["09 从零实现 RAG"]
  end
  subgraph P3["第四部分 · 进阶模式"]
    C_10["10 推理范式"]
    C_11["11 多智能体编排"]
  end
  subgraph P4["第五部分 · 工程化与框架"]
    C_12["12 上框架：LangGraph.js 与 Vercel AI SDK"]
    C_13["13 结构化输出与校验"]
    C_14["14 流式输出与 UX"]
  end
  subgraph P5["第六部分 · 生产化"]
    C_15["15 评估与测试"]
    C_16["16 可观测性与成本"]
    C_17["17 安全与护栏"]
    C_18["18 部署：把 Agent 变成服务"]
  end
  subgraph P6["第七部分 · 前沿与生态"]
    C_19["19 Agent 前沿发展与生态拆解"]
    C_20["20 Agent 前沿文章库"]
  end
  subgraph P7["第八部分 · 源码解析"]
    C_21["21 源码解析"]
  end
  subgraph P8["毕业项目"]
    C_capstone["capstone 毕业项目 · Deep Research Agent"]
    C_cap-support["cap-support 毕业项目 · 客服 Copilot"]
    C_cap-review["cap-review 毕业项目 · 代码评审团"]
    C_cap-eval["cap-eval 毕业项目 · Agent 评测与回归门"]
    C_cap-incident["cap-incident 毕业项目 · 告警响应 Agent"]
    C_cap-feedback["cap-feedback 毕业项目 · 用户反馈洞察 Agent"]
    C_cap-sales["cap-sales 毕业项目 · 销售线索研究 Agent"]
    C_cap-enterprise-kb["cap-enterprise-kb 毕业项目 · 企业知识库 Agent"]
  end
  subgraph P9["进阶 RAG 专题"]
    C_rag-chunk["rag-chunk 进阶分块策略"]
    C_rag-hybrid["rag-hybrid 混合检索 (向量+BM25+RRF)"]
    C_rag-rerank["rag-rerank 召回-精排两段式"]
    C_rag-query["rag-query 查询改写 (multi-query/HyDE)"]
    C_rag-eval["rag-eval RAG 评估三指标"]
    C_rag-prod["rag-prod 生产化 RAG 全链路"]
    C_rag-contextual["rag-contextual Contextual Retrieval"]
    C_rag-agentic["rag-agentic Agentic RAG"]
    C_rag-security["rag-security RAG 安全护栏"]
    C_rag-index["rag-index 向量索引内部机制"]
    C_rag-context["rag-context 检索后上下文工程"]
  end
  subgraph P10["进阶 LangGraph 专题"]
    C_lg-stategraph["lg-stategraph 手写 StateGraph"]
    C_lg-routing["lg-routing 条件边与路由"]
    C_lg-checkpoint["lg-checkpoint Checkpointer 持久化与时间旅行"]
    C_lg-hitl["lg-hitl Human-in-the-Loop（interrupt 审批门）"]
    C_lg-multiagent["lg-multiagent 多 Agent 编排（supervisor / 并行 team）"]
  end
  C_01 --> C_02
  C_02 --> C_03
  C_03 --> C_04
  C_04 --> C_05
  C_05 --> C_06
  C_06 --> C_07
  C_07 --> C_08
  C_08 --> C_09
  C_09 --> C_10
  C_10 --> C_11
  C_11 --> C_12
  C_12 --> C_13
  C_13 --> C_14
  C_14 --> C_15
  C_15 --> C_16
  C_16 --> C_17
  C_17 --> C_18
  C_18 --> C_19
  C_19 --> C_20
  C_20 --> C_21
  C_21 --> C_capstone
  C_capstone --> C_cap-support
  C_cap-support --> C_cap-review
  C_cap-review --> C_cap-eval
  C_cap-eval --> C_cap-incident
  C_cap-incident --> C_cap-feedback
  C_cap-feedback --> C_cap-sales
  C_cap-sales --> C_cap-enterprise-kb
  C_cap-enterprise-kb --> C_rag-chunk
  C_rag-chunk --> C_rag-hybrid
  C_rag-hybrid --> C_rag-rerank
  C_rag-rerank --> C_rag-query
  C_rag-query --> C_rag-eval
  C_rag-eval --> C_rag-prod
  C_rag-prod --> C_rag-contextual
  C_rag-contextual --> C_rag-agentic
  C_rag-agentic --> C_rag-security
  C_rag-security --> C_rag-index
  C_rag-index --> C_rag-context
  C_rag-context --> C_lg-stategraph
  C_lg-stategraph --> C_lg-routing
  C_lg-routing --> C_lg-checkpoint
  C_lg-checkpoint --> C_lg-hitl
  C_lg-hitl --> C_lg-multiagent
```

## 概念图谱

> 关系类型：`前置`（学它前要先会）· `深化`（更深一层）· `对比`（同类对照）· `应用`（落地用法）· `组成`（构成部件）。

```mermaid
graph LR
  subgraph G0["第一部分 · 基础概念"]
    n_c01_llm_vs_agent["LLM 与 Agent 的区别"]
    n_c01_agent_formula["Agent 公式"]
    n_c01_react_loop["感知-决策-行动-观察循环"]
    n_c01_tool_as_capability["工具的本质"]
    n_c01_message_memory["消息数组即记忆"]
    n_c01_max_steps["maxSteps 安全阀"]
    n_c01_yagni_when_not_agent["何时不该用 Agent"]
    n_c02_llm_call_pure_function["LLM 调用本质 (无状态纯函数)"]
    n_c02_get_llm_abstraction["provider 无关抽象 getLLM()"]
    n_c02_chat["chat() 一次性调用"]
    n_c02_stream["stream() 流式输出"]
    n_c02_usage_token["usage 与 token 成本"]
    n_c02_stop_reason["stopReason 停止原因"]
    n_c03_system_vs_user["system 提示 vs user 提示"]
    n_c03_role_instruction["角色设定 + 明确指令"]
    n_c03_few_shot["few-shot 示例"]
    n_c03_cot["思维链 (CoT)"]
    n_c03_constrained_output["约束输出格式 (JSON)"]
    n_c03_temperature["temperature"]
    n_c03_prompt_as_spec["提示即行为规格"]
  end
  subgraph G1["第二部分 · 从零手写核心"]
    n_c04_react["ReAct (Reasoning + Acting)"]
    n_c04_agent_loop["Agent 循环"]
    n_c04_text_protocol["文本协议 + 正则解析"]
    n_c04_max_steps["maxSteps 停止条件"]
    n_c04_scratchpad["scratchpad 短期记忆"]
    n_c04_tool_table["工具分发表"]
    n_c04_native_fc["原生 function calling"]
    n_c05_native_tool_use["原生工具调用 (Function Calling)"]
    n_c05_request_execute_boundary["请求/执行职责边界"]
    n_c05_toolspec_schema["ToolSpec 与 JSON Schema"]
    n_c05_roundtrip_loop["工具调用往返循环"]
    n_c05_stop_reason["stopReason 终止控制"]
    n_c05_tool_call_id["toolCallId 结果绑定"]
    n_c05_error_feedback["工具错误回传"]
    n_c06_single_zod_schema["单一 zod schema"]
    n_c06_define_tool["defineTool / defineMiniTool"]
    n_c06_tool_registry["工具注册表 (ToolRegistry)"]
    n_c06_safe_execution["安全执行"]
    n_c06_type_erasure["类型擦除 run(unknown)"]
    n_c06_self_correction_loop["LLM 自我纠错闭环"]
    n_c06_run_agent_loop["runAgent 循环"]
    n_c07_conversation_as_array["记忆即回灌 messages"]
    n_c07_context_window_budget["上下文窗口预算"]
    n_c07_sliding_window["滑动窗口"]
    n_c07_llm_summary_compression["LLM 摘要压缩"]
    n_c07_message_layout["三段式消息结构"]
    n_c07_summarize_threshold["压缩阈值与滚动摘要"]
    n_c07_conversation_class["Conversation 类"]
  end
  subgraph G2["第三部分 · 知识与检索"]
    n_c08_embedding["Embedding (语义向量)"]
    n_c08_cosine_similarity["余弦相似度"]
    n_c08_vector_store["内存向量库 (add/search)"]
    n_c08_topk_retrieval["Top-k 检索"]
    n_c08_semantic_vs_keyword["语义检索 vs 关键词检索"]
    n_c08_rag_foundation["RAG 检索地基"]
    n_c09_rag_pipeline["RAG 全流程"]
    n_c09_chunk_overlap["分块与重叠 (chunk/overlap)"]
    n_c09_topk_retrieval["top-k 检索"]
    n_c09_augment_prompt["上下文增强 (augment)"]
    n_c09_citation["引用溯源"]
    n_c09_hallucination_reduction["幻觉抑制与 A/B 对比"]
  end
  subgraph G3["第四部分 · 进阶模式"]
    n_c10_reasoning_pattern["推理范式 (控制流选择)"]
    n_c10_react["ReAct (边想边做)"]
    n_c10_plan_and_execute["Plan-and-Execute (先规划再执行)"]
    n_c10_reflection["Reflection (自我反思修正)"]
    n_c10_zod_plan_schema["zod 计划契约"]
    n_c10_scratchpad["scratchpad 滚动上下文"]
    n_c10_cost_tradeoff["步数/成本/可靠性权衡"]
    n_c11_supervisor_worker["Supervisor + Worker 模式"]
    n_c11_topology_choice["编排拓扑选择"]
    n_c11_supervisor_routing["Supervisor 路由决策"]
    n_c11_worker_specialist["Worker 专才"]
    n_c11_scratchpad["Scratchpad 共享工作台"]
    n_c11_orchestration_loop["编排主循环"]
    n_c11_cost_tradeoff["多 agent 取舍"]
    n_c11_decision_validation["决策容错校验"]
    n_c11_subagent_workflow["Subagent workflow"]
    n_c11_agent_team["Agent team"]
    n_c11_worktree_isolation["Worktree 隔离写入"]
    n_c11_handoff_agent_tool["Handoff vs Agent-as-tool"]
    n_c11_approval_observability["审批与可观测"]
  end
  subgraph G4["第五部分 · 工程化与框架"]
    n_c12_why_frameworks["为什么生产要上框架"]
    n_c12_vercel_ai_sdk["Vercel AI SDK"]
    n_c12_max_steps["maxSteps 自动工具循环"]
    n_c12_langgraph["LangGraph.js"]
    n_c12_react_agent["createReactAgent 预制图"]
    n_c12_state_graph["状态机图模型"]
    n_c12_framework_choice["框架选型决策"]
    n_c13_structured_output["结构化输出"]
    n_c13_zod_schema["zod schema 单一事实来源"]
    n_c13_strict_prompt["强约束提示"]
    n_c13_retry_repair["retry-repair 自我修复重试"]
    n_c13_extract_json["extractJson 解析容错"]
    n_c13_runtime_validation["运行期校验"]
    n_c13_generate_object["框架 generateObject"]
    n_c14_token_streaming["Token 流式输出 (typewriter)"]
    n_c14_perceived_latency["首字延迟与体感"]
    n_c14_progress_streaming["进度流 (onStep)"]
    n_c14_abort_controller["AbortController 取消"]
    n_c14_consumer_side_cancel["消费侧取消"]
    n_c14_graceful_cleanup["优雅善后"]
  end
  subgraph G5["第六部分 · 生产化"]
    n_c15_nondeterminism["LLM 输出非确定性"]
    n_c15_eval_dataset["离线评估数据集"]
    n_c15_eval_harness["评估框架 runEval"]
    n_c15_rule_scoring["规则评分"]
    n_c15_llm_judge["LLM-as-judge"]
    n_c15_regression_ci["回归测试与 CI 门槛"]
    n_c15_sut_separation["被测对象与评估分离"]
    n_c16_observability["可观测性 (Observability)"]
    n_c16_span_trace_tree["Span 与 Trace 树"]
    n_c16_decorator_tracer["装饰器模式 Tracer"]
    n_c16_cost_estimation["费用估算公式"]
    n_c16_price_table["价格表单一事实来源"]
    n_c16_bottleneck_location["瓶颈定位"]
    n_c16_production_tooling["生产工具 LangSmith/OTel"]
    n_c17_prompt_injection["提示注入 (Prompt Injection)"]
    n_c17_trust_boundary["信任边界"]
    n_c17_isolate_and_label["隔离 + 标注 (wrapUntrusted)"]
    n_c17_defense_in_depth["纵深防御"]
    n_c17_output_validation["出口行为校验"]
    n_c17_pii_redaction["PII 脱敏"]
    n_c17_human_in_the_loop["最小权限 + 人在回路"]
    n_c18_agent_as_service["脚本到服务 (Agent as Service)"]
    n_c18_stateless["无状态服务 (Stateless)"]
    n_c18_request_timeout["请求超时 (Timeout)"]
    n_c18_error_fallback["错误兜底 (withGuards)"]
    n_c18_secret_safety["密钥安全 (Secrets)"]
    n_c18_sse_streaming["SSE 流式接口 (/chat/stream)"]
    n_c18_deploy_checklist["部署 checklist 与 Docker"]
  end
  subgraph G6["第七部分 · 前沿与生态"]
    n_c19_ecosystem_layers["Agent 生态分层"]
    n_c19_mcp["MCP (模型上下文协议)"]
    n_c19_a2a["A2A (Agent2Agent)"]
    n_c19_agent_sdk["Agent SDK"]
    n_c19_orchestration_runtime["编排 runtime"]
    n_c19_hosted_tools["Hosted tools 与 sandbox"]
    n_c19_stack_selection["需求倒推选型"]
    n_c19_governance["可观测与安全治理"]
    n_c20_news_archive["前沿文章库"]
    n_c20_date_filter["日期筛选"]
    n_c20_layer_filter["体系层筛选"]
    n_c20_article_detail["文章卡片与原文入口"]
  end
  subgraph G7["第八部分 · 源码解析"]
    n_srca_reading_map["源码阅读路线"]
    n_srca_langchain_agent_factory["LangChain create_agent"]
    n_srca_langchain_runnable["Runnable 调用协议"]
    n_srca_langgraph_runtime["LangGraph Pregel runtime"]
    n_srca_langgraph_tool_node["ToolNode 工具边界"]
    n_srca_llamaindex_query_engine["LlamaIndex QueryEngine"]
    n_srca_llamaindex_workflow["LlamaIndex Workflow"]
  end
  subgraph G8["毕业项目"]
    n_ccapstone_plan_and_execute["Plan-and-Execute 架构"]
    n_ccapstone_research_pipeline["research() 研究主干"]
    n_ccapstone_tool_registry["工具系统 (search/calc/saveNote)"]
    n_ccapstone_rag_corpus["RAG 内置语料检索"]
    n_ccapstone_structured_output["结构化输出 (zod 约束)"]
    n_ccapstone_tracer_cost["Tracer 可观测与成本"]
    n_ccapstone_dual_entrypoint["CLI / HTTP 双入口"]
    n_csup_pipeline["单轮纵深处理管线"]
    n_csup_memory["会话短期记忆 (不可变快照)"]
    n_csup_rag["知识库检索 (BM25 带引用)"]
    n_csup_tools["查单/退款工具 (zod 边界校验)"]
    n_csup_hitl["退款 HITL 审批门"]
    n_csup_security["注入检测 + PII 脱敏"]
    n_csup_observability["Tracer 估算 token 与成本"]
    n_crev_crew["评审团 supervisor (并行 fork-join)"]
    n_crev_reviewers["角色评审员 (security/perf/style)"]
    n_crev_structured["结构化发现 (zod schema)"]
    n_crev_severity["严重度排序与去重"]
    n_crev_gate["评审门 (critical 即 BLOCK)"]
    n_cev_golden["Golden 测试集"]
    n_cev_subject["被测 Agent (合规 vs 退化)"]
    n_cev_judges["离线裁判 (tool/keyword/refusal)"]
    n_cev_metrics["聚合指标"]
    n_cev_gate["回归门 (CI exit code)"]
    n_cinc_severity["告警 SEV 分级"]
    n_cinc_runbook["Runbook 匹配"]
    n_cinc_evidence["根因证据链"]
    n_cinc_approval["处置动作审批分层"]
    n_cinc_postmortem["复盘清单"]
    n_cfb_quarantine["反馈注入隔离"]
    n_cfb_redaction["反馈 PII 脱敏"]
    n_cfb_clustering["主题聚类"]
    n_cfb_weighting["价值加权优先级"]
    n_cfb_roadmap["Roadmap Ticket 生成"]
    n_csales_icp["ICP Fit 评分"]
    n_csales_signals["业务信号证据链"]
    n_csales_risk["合规风险扣分"]
    n_csales_talk_track["销售开场话术"]
    n_csales_next_action["下一步动作"]
  end
  subgraph G9["进阶 RAG 专题"]
    n_cragchunk_why_matters["切块决定检索上限"]
    n_cragchunk_sliding_window["字符滑窗切分"]
    n_cragchunk_recursive["递归语义切分"]
    n_cragchunk_markdown_aware["Markdown 标题感知切分"]
    n_cragchunk_token_budget["按 token 计长 (approxTokens)"]
    n_craghybrid_sparse_vs_dense["稀疏 vs 稠密检索"]
    n_craghybrid_bm25["BM25 关键词打分"]
    n_craghybrid_vector_recall["向量语义召回"]
    n_craghybrid_rrf["RRF 排名融合"]
    n_craghybrid_retriever["混合检索器"]
    n_cragrerank_recall_precision["召回-精排两段式"]
    n_cragrerank_llm_rerank["LLM 重排"]
    n_cragrerank_signal_to_noise["上下文信噪比"]
    n_cragrerank_cross_encoder["cross-encoder 精排器"]
    n_cragquery_mismatch["查询-资料措辞错配"]
    n_cragquery_multi_query["多查询改写"]
    n_cragquery_hyde["HyDE 假设答案检索"]
    n_cragquery_recall_coverage["召回覆盖率"]
    n_crageval_llm_judge_rag["RAG 的 LLM-as-judge"]
    n_crageval_context_relevance["上下文相关性"]
    n_crageval_faithfulness["忠实度"]
    n_crageval_answer_relevance["答案相关性"]
    n_crageval_stage_localization["按指标定位坏环"]
    n_cragprod_metadata_filter["metadata 过滤"]
    n_cragprod_persistence["向量库持久化"]
    n_cragprod_incremental_upsert["增量 upsert"]
    n_cragprod_pipeline_compose["端到端管线组合"]
    n_cragprod_vectordb_migration["迁移到专用向量 DB"]
    n_cragcontextual_document_context["文档级上下文"]
    n_cragcontextual_pre_index["入索引前补上下文"]
    n_cragcontextual_title_recall["标题词召回恢复"]
    n_cragcontextual_raw_preserved["原文可审计"]
    n_cragcontextual_hybrid_friendly["同时服务 BM25 与向量"]
    n_cragagentic_gated_retrieve["gated retrieve"]
    n_cragagentic_grade["证据打分器"]
    n_cragagentic_rewrite_loop["改写重试循环"]
    n_cragagentic_refuse["无答案拒答"]
    n_cragagentic_state_machine["RAG 状态机"]
    n_cragsec_untrusted_retrieval["检索内容即不可信数据"]
    n_cragsec_injection_detection["注入检测与隔离"]
    n_cragsec_pii_redaction["PII 出口脱敏"]
    n_cragsec_citation_verification["引用可核验"]
    n_cragsec_defense_in_depth["RAG 纵深防御"]
    n_cragidx_brute_force["暴力精确检索"]
    n_cragidx_ann_tradeoff["ANN 近似最近邻的交易"]
    n_cragidx_ivf_bucketing["IVF 倒排分桶"]
    n_cragidx_nprobe_knob["nprobe 旋钮"]
    n_cragidx_recall_at_scale["近似召回度量"]
    n_cragctx_context_budget["上下文 token 预算"]
    n_cragctx_dedup["近重复去重"]
    n_cragctx_compression["抽取式压缩"]
    n_cragctx_lost_in_middle["中间遗忘 (lost-in-the-middle)"]
    n_cragctx_reorder["注意力感知重排"]
  end
  subgraph G10["进阶 LangGraph 专题"]
    n_lgsg_state_channels["State 与 channels"]
    n_lgsg_reducer["channel reducer"]
    n_lgsg_node_partial["节点返回 partial 更新"]
    n_lgsg_edges_compile["边与 compile/invoke"]
    n_lgsg_vs_prebuilt["揭开 createReactAgent"]
    n_lgrt_conditional_edge["条件边 (addConditionalEdges)"]
    n_lgrt_branch["分支路由"]
    n_lgrt_loop["循环边"]
    n_lgrt_recursion_limit["recursionLimit 安全阀"]
    n_lgrt_send_fanout["Send 扇出 (map-reduce)"]
    n_lgcp_checkpointer["Checkpointer 与 thread_id"]
    n_lgcp_persist_accumulate["跨 invoke 持久化累积"]
    n_lgcp_getstate["getState 状态快照"]
    n_lgcp_history["getStateHistory 执行时间线"]
    n_lgcp_time_travel["updateState 改写与时间旅行"]
    n_lghitl_interrupt["interrupt 节点中途暂停"]
    n_lghitl_read_payload["读取 interrupt payload"]
    n_lghitl_command_resume["Command(resume) 续跑"]
    n_lghitl_approval_gate["审批门：放行 / 拦截"]
    n_lghitl_plain_invoke_pitfall["易错：普通 invoke 不 resume"]
    n_lgma_multi_agent["多 Agent = 多专职节点编排"]
    n_lgma_supervisor["supervisor 中心化调度"]
    n_lgma_worker_routing["按类型路由到 worker"]
    n_lgma_parallel_team["并行异构 team（fork/join）"]
    n_lgma_order_independent_join["join 顺序无关聚合"]
  end
  n_c01_llm_vs_agent -->|深化| n_c01_agent_formula
  n_c01_agent_formula -->|组成| n_c01_react_loop
  n_c01_agent_formula -->|组成| n_c01_tool_as_capability
  n_c01_agent_formula -->|组成| n_c01_message_memory
  n_c01_react_loop -->|应用| n_c01_tool_as_capability
  n_c01_react_loop -->|应用| n_c01_message_memory
  n_c01_react_loop -->|前置| n_c01_max_steps
  n_c01_llm_vs_agent -->|应用| n_c01_yagni_when_not_agent
  n_c02_llm_call_pure_function -->|应用| n_c02_get_llm_abstraction
  n_c02_get_llm_abstraction -->|组成| n_c02_chat
  n_c02_get_llm_abstraction -->|组成| n_c02_stream
  n_c02_chat -->|对比| n_c02_stream
  n_c02_chat -->|应用| n_c02_usage_token
  n_c02_chat -->|应用| n_c02_stop_reason
  n_c03_prompt_as_spec -->|组成| n_c03_system_vs_user
  n_c03_system_vs_user -->|应用| n_c03_role_instruction
  n_c03_role_instruction -->|深化| n_c03_few_shot
  n_c03_role_instruction -->|深化| n_c03_cot
  n_c03_system_vs_user -->|应用| n_c03_constrained_output
  n_c03_few_shot -->|应用| n_c03_temperature
  n_c03_constrained_output -->|应用| n_c03_temperature
  n_c03_prompt_as_spec -->|组成| n_c03_temperature
  n_c04_react -->|组成| n_c04_agent_loop
  n_c04_agent_loop -->|组成| n_c04_max_steps
  n_c04_agent_loop -->|组成| n_c04_scratchpad
  n_c04_agent_loop -->|组成| n_c04_tool_table
  n_c04_text_protocol -->|应用| n_c04_agent_loop
  n_c04_scratchpad -->|应用| n_c04_react
  n_c04_native_fc -->|对比| n_c04_text_protocol
  n_c05_native_tool_use -->|组成| n_c05_request_execute_boundary
  n_c05_toolspec_schema -->|前置| n_c05_native_tool_use
  n_c05_native_tool_use -->|应用| n_c05_roundtrip_loop
  n_c05_stop_reason -->|组成| n_c05_roundtrip_loop
  n_c05_tool_call_id -->|组成| n_c05_roundtrip_loop
  n_c05_error_feedback -->|深化| n_c05_roundtrip_loop
  n_c05_toolspec_schema -->|深化| n_c05_request_execute_boundary
  n_c06_single_zod_schema -->|组成| n_c06_define_tool
  n_c06_define_tool -->|组成| n_c06_tool_registry
  n_c06_define_tool -->|组成| n_c06_safe_execution
  n_c06_define_tool -->|应用| n_c06_type_erasure
  n_c06_type_erasure -->|前置| n_c06_tool_registry
  n_c06_safe_execution -->|深化| n_c06_self_correction_loop
  n_c06_tool_registry -->|应用| n_c06_run_agent_loop
  n_c06_self_correction_loop -->|应用| n_c06_run_agent_loop
  n_c07_context_window_budget -->|前置| n_c07_conversation_as_array
  n_c07_sliding_window -->|应用| n_c07_context_window_budget
  n_c07_llm_summary_compression -->|应用| n_c07_context_window_budget
  n_c07_sliding_window -->|对比| n_c07_llm_summary_compression
  n_c07_message_layout -->|组成| n_c07_sliding_window
  n_c07_message_layout -->|组成| n_c07_llm_summary_compression
  n_c07_summarize_threshold -->|深化| n_c07_llm_summary_compression
  n_c07_conversation_class -->|组成| n_c07_message_layout
  n_c07_conversation_class -->|组成| n_c07_summarize_threshold
  n_c08_embedding -->|前置| n_c08_cosine_similarity
  n_c08_cosine_similarity -->|组成| n_c08_vector_store
  n_c08_embedding -->|组成| n_c08_vector_store
  n_c08_vector_store -->|应用| n_c08_topk_retrieval
  n_c08_embedding -->|应用| n_c08_semantic_vs_keyword
  n_c08_topk_retrieval -->|前置| n_c08_rag_foundation
  n_c08_semantic_vs_keyword -->|深化| n_c08_rag_foundation
  n_c09_chunk_overlap -->|组成| n_c09_rag_pipeline
  n_c09_topk_retrieval -->|组成| n_c09_rag_pipeline
  n_c09_augment_prompt -->|组成| n_c09_rag_pipeline
  n_c09_chunk_overlap -->|前置| n_c09_topk_retrieval
  n_c09_topk_retrieval -->|前置| n_c09_augment_prompt
  n_c09_augment_prompt -->|应用| n_c09_citation
  n_c09_augment_prompt -->|应用| n_c09_hallucination_reduction
  n_c09_citation -->|深化| n_c09_hallucination_reduction
  n_c10_reasoning_pattern -->|组成| n_c10_react
  n_c10_reasoning_pattern -->|组成| n_c10_plan_and_execute
  n_c10_reasoning_pattern -->|组成| n_c10_reflection
  n_c10_react -->|对比| n_c10_plan_and_execute
  n_c10_plan_and_execute -->|应用| n_c10_zod_plan_schema
  n_c10_plan_and_execute -->|应用| n_c10_scratchpad
  n_c10_reasoning_pattern -->|深化| n_c10_cost_tradeoff
  n_c10_cost_tradeoff -->|应用| n_c10_reflection
  n_c11_supervisor_worker -->|组成| n_c11_supervisor_routing
  n_c11_supervisor_worker -->|组成| n_c11_worker_specialist
  n_c11_topology_choice -->|前置| n_c11_supervisor_worker
  n_c11_topology_choice -->|组成| n_c11_subagent_workflow
  n_c11_topology_choice -->|组成| n_c11_agent_team
  n_c11_topology_choice -->|组成| n_c11_worktree_isolation
  n_c11_topology_choice -->|组成| n_c11_handoff_agent_tool
  n_c11_supervisor_routing -->|深化| n_c11_decision_validation
  n_c11_orchestration_loop -->|应用| n_c11_supervisor_routing
  n_c11_orchestration_loop -->|应用| n_c11_scratchpad
  n_c11_scratchpad -->|应用| n_c11_worker_specialist
  n_c11_cost_tradeoff -->|前置| n_c11_topology_choice
  n_c11_approval_observability -->|应用| n_c11_subagent_workflow
  n_c11_approval_observability -->|应用| n_c11_agent_team
  n_c11_approval_observability -->|应用| n_c11_handoff_agent_tool
  n_c12_why_frameworks -->|应用| n_c12_vercel_ai_sdk
  n_c12_why_frameworks -->|应用| n_c12_langgraph
  n_c12_vercel_ai_sdk -->|组成| n_c12_max_steps
  n_c12_langgraph -->|组成| n_c12_react_agent
  n_c12_langgraph -->|深化| n_c12_state_graph
  n_c12_react_agent -->|应用| n_c12_state_graph
  n_c12_max_steps -->|对比| n_c12_state_graph
  n_c12_vercel_ai_sdk -->|前置| n_c12_framework_choice
  n_c12_langgraph -->|前置| n_c12_framework_choice
  n_c13_structured_output -->|应用| n_c13_zod_schema
  n_c13_zod_schema -->|应用| n_c13_strict_prompt
  n_c13_zod_schema -->|应用| n_c13_runtime_validation
  n_c13_strict_prompt -->|前置| n_c13_retry_repair
  n_c13_runtime_validation -->|组成| n_c13_retry_repair
  n_c13_extract_json -->|前置| n_c13_runtime_validation
  n_c13_retry_repair -->|对比| n_c13_generate_object
  n_c13_zod_schema -->|应用| n_c13_generate_object
  n_c14_token_streaming -->|应用| n_c14_perceived_latency
  n_c14_token_streaming -->|对比| n_c14_progress_streaming
  n_c14_abort_controller -->|深化| n_c14_consumer_side_cancel
  n_c14_abort_controller -->|组成| n_c14_graceful_cleanup
  n_c14_consumer_side_cancel -->|应用| n_c14_perceived_latency
  n_c15_nondeterminism -->|前置| n_c15_eval_dataset
  n_c15_eval_dataset -->|应用| n_c15_eval_harness
  n_c15_rule_scoring -->|组成| n_c15_eval_harness
  n_c15_llm_judge -->|组成| n_c15_eval_harness
  n_c15_rule_scoring -->|对比| n_c15_llm_judge
  n_c15_eval_harness -->|应用| n_c15_regression_ci
  n_c15_sut_separation -->|前置| n_c15_eval_harness
  n_c16_observability -->|组成| n_c16_span_trace_tree
  n_c16_decorator_tracer -->|应用| n_c16_observability
  n_c16_decorator_tracer -->|应用| n_c16_span_trace_tree
  n_c16_cost_estimation -->|前置| n_c16_price_table
  n_c16_span_trace_tree -->|应用| n_c16_cost_estimation
  n_c16_span_trace_tree -->|应用| n_c16_bottleneck_location
  n_c16_decorator_tracer -->|对比| n_c16_production_tooling
  n_c17_prompt_injection -->|前置| n_c17_trust_boundary
  n_c17_trust_boundary -->|应用| n_c17_isolate_and_label
  n_c17_defense_in_depth -->|组成| n_c17_isolate_and_label
  n_c17_defense_in_depth -->|组成| n_c17_output_validation
  n_c17_defense_in_depth -->|组成| n_c17_pii_redaction
  n_c17_defense_in_depth -->|组成| n_c17_human_in_the_loop
  n_c17_output_validation -->|对比| n_c17_pii_redaction
  n_c17_prompt_injection -->|深化| n_c17_defense_in_depth
  n_c18_agent_as_service -->|组成| n_c18_stateless
  n_c18_agent_as_service -->|组成| n_c18_request_timeout
  n_c18_agent_as_service -->|组成| n_c18_error_fallback
  n_c18_agent_as_service -->|组成| n_c18_secret_safety
  n_c18_agent_as_service -->|组成| n_c18_sse_streaming
  n_c18_stateless -->|前置| n_c18_deploy_checklist
  n_c18_request_timeout -->|组成| n_c18_error_fallback
  n_c18_sse_streaming -->|应用| n_c18_error_fallback
  n_c18_secret_safety -->|应用| n_c18_deploy_checklist
  n_c18_deploy_checklist -->|组成| n_c18_request_timeout
  n_c19_ecosystem_layers -->|组成| n_c19_mcp
  n_c19_ecosystem_layers -->|组成| n_c19_agent_sdk
  n_c19_ecosystem_layers -->|组成| n_c19_orchestration_runtime
  n_c19_ecosystem_layers -->|组成| n_c19_governance
  n_c19_mcp -->|对比| n_c19_a2a
  n_c19_agent_sdk -->|深化| n_c19_orchestration_runtime
  n_c19_hosted_tools -->|对比| n_c19_mcp
  n_c19_stack_selection -->|应用| n_c19_ecosystem_layers
  n_c19_stack_selection -->|应用| n_c19_agent_sdk
  n_c19_governance -->|应用| n_c19_orchestration_runtime
  n_c20_news_archive -->|组成| n_c20_date_filter
  n_c20_news_archive -->|组成| n_c20_layer_filter
  n_c20_news_archive -->|组成| n_c20_article_detail
  n_c20_layer_filter -->|应用| n_c19_ecosystem_layers
  n_c20_article_detail -->|应用| n_c19_stack_selection
  n_ccapstone_plan_and_execute -->|组成| n_ccapstone_research_pipeline
  n_ccapstone_research_pipeline -->|应用| n_ccapstone_tool_registry
  n_ccapstone_tool_registry -->|组成| n_ccapstone_rag_corpus
  n_ccapstone_research_pipeline -->|应用| n_ccapstone_structured_output
  n_ccapstone_tracer_cost -->|应用| n_ccapstone_research_pipeline
  n_ccapstone_research_pipeline -->|前置| n_ccapstone_dual_entrypoint
  n_ccapstone_rag_corpus -->|深化| n_ccapstone_plan_and_execute
  n_c02_llm_call_pure_function -->|深化| n_c01_llm_vs_agent
  n_c04_agent_loop -->|深化| n_c01_react_loop
  n_c04_agent_loop -->|应用| n_c02_chat
  n_c04_text_protocol -->|应用| n_c03_system_vs_user
  n_c05_native_tool_use -->|对比| n_c04_text_protocol
  n_c05_roundtrip_loop -->|深化| n_c04_agent_loop
  n_c06_define_tool -->|深化| n_c05_toolspec_schema
  n_c06_run_agent_loop -->|深化| n_c05_roundtrip_loop
  n_c06_self_correction_loop -->|深化| n_c05_error_feedback
  n_c07_conversation_as_array -->|深化| n_c01_message_memory
  n_c07_context_window_budget -->|应用| n_c02_usage_token
  n_c09_rag_pipeline -->|深化| n_c08_rag_foundation
  n_c09_rag_pipeline -->|组成| n_c08_vector_store
  n_c10_react -->|深化| n_c04_react
  n_c10_reasoning_pattern -->|对比| n_c04_agent_loop
  n_c11_orchestration_loop -->|应用| n_c06_run_agent_loop
  n_c12_vercel_ai_sdk -->|对比| n_c06_run_agent_loop
  n_c12_langgraph -->|对比| n_c04_agent_loop
  n_c12_react_agent -->|应用| n_c04_react
  n_c13_structured_output -->|深化| n_c03_constrained_output
  n_c14_token_streaming -->|深化| n_c02_stream
  n_c14_progress_streaming -->|应用| n_c06_run_agent_loop
  n_c15_eval_dataset -->|应用| n_c13_structured_output
  n_c16_cost_estimation -->|深化| n_c02_usage_token
  n_c16_decorator_tracer -->|应用| n_c02_get_llm_abstraction
  n_c17_isolate_and_label -->|应用| n_c09_augment_prompt
  n_c17_human_in_the_loop -->|应用| n_c06_tool_registry
  n_c18_sse_streaming -->|深化| n_c14_token_streaming
  n_c18_agent_as_service -->|应用| n_c06_run_agent_loop
  n_c19_ecosystem_layers -->|深化| n_c12_framework_choice
  n_c19_mcp -->|应用| n_c05_native_tool_use
  n_c20_news_archive -->|深化| n_c19_ecosystem_layers
  n_srca_reading_map -->|深化| n_c12_framework_choice
  n_srca_langchain_agent_factory -->|对比| n_c06_run_agent_loop
  n_srca_langchain_runnable -->|深化| n_c02_stream
  n_srca_langgraph_runtime -->|深化| n_lgsg_edges_compile
  n_srca_langgraph_tool_node -->|应用| n_c05_roundtrip_loop
  n_srca_llamaindex_query_engine -->|深化| n_c09_rag_pipeline
  n_srca_llamaindex_workflow -->|对比| n_lgma_multi_agent
  n_ccapstone_research_pipeline -->|深化| n_c10_plan_and_execute
  n_ccapstone_tool_registry -->|组成| n_c06_tool_registry
  n_ccapstone_rag_corpus -->|组成| n_c09_rag_pipeline
  n_ccapstone_structured_output -->|组成| n_c13_structured_output
  n_ccapstone_tracer_cost -->|组成| n_c16_decorator_tracer
  n_ccapstone_dual_entrypoint -->|组成| n_c18_agent_as_service
  n_csup_pipeline -->|组成| n_csup_memory
  n_csup_pipeline -->|组成| n_csup_rag
  n_csup_pipeline -->|应用| n_csup_tools
  n_csup_pipeline -->|组成| n_csup_hitl
  n_csup_pipeline -->|组成| n_csup_security
  n_csup_observability -->|应用| n_csup_pipeline
  n_csup_memory -->|组成| n_c07_conversation_as_array
  n_csup_rag -->|组成| n_c09_rag_pipeline
  n_csup_tools -->|组成| n_c06_tool_registry
  n_csup_hitl -->|组成| n_c17_human_in_the_loop
  n_csup_security -->|组成| n_cragsec_injection_detection
  n_csup_security -->|组成| n_cragsec_pii_redaction
  n_csup_observability -->|组成| n_c16_cost_estimation
  n_crev_crew -->|组成| n_crev_reviewers
  n_crev_reviewers -->|应用| n_crev_structured
  n_crev_crew -->|应用| n_crev_severity
  n_crev_severity -->|前置| n_crev_gate
  n_crev_crew -->|深化| n_c11_topology_choice
  n_crev_crew -->|应用| n_c11_approval_observability
  n_crev_structured -->|组成| n_c13_structured_output
  n_crev_gate -->|应用| n_c15_eval_harness
  n_cev_golden -->|组成| n_cev_judges
  n_cev_subject -->|应用| n_cev_judges
  n_cev_judges -->|组成| n_cev_metrics
  n_cev_metrics -->|前置| n_cev_gate
  n_cev_golden -->|组成| n_c15_eval_dataset
  n_cev_judges -->|深化| n_c15_llm_judge
  n_cev_gate -->|组成| n_c15_eval_harness
  n_cev_metrics -->|应用| n_c16_observability
  n_cev_judges -->|对比| n_crageval_llm_judge_rag
  n_cinc_severity -->|应用| n_c16_observability
  n_cinc_runbook -->|前置| n_cinc_evidence
  n_cinc_evidence -->|前置| n_cinc_approval
  n_cinc_approval -->|组成| n_c17_human_in_the_loop
  n_cinc_postmortem -->|应用| n_c15_regression_ci
  n_cfb_quarantine -->|组成| n_cragsec_injection_detection
  n_cfb_redaction -->|组成| n_cragsec_pii_redaction
  n_cfb_clustering -->|前置| n_cfb_weighting
  n_cfb_weighting -->|前置| n_cfb_roadmap
  n_cfb_roadmap -->|应用| n_c13_structured_output
  n_csales_icp -->|前置| n_csales_signals
  n_csales_signals -->|应用| n_csales_risk
  n_csales_risk -->|前置| n_csales_next_action
  n_csales_talk_track -->|组成| n_csales_next_action
  n_csales_talk_track -->|应用| n_c03_prompt_as_spec
  n_cragchunk_why_matters -->|深化| n_cragchunk_sliding_window
  n_cragchunk_sliding_window -->|对比| n_cragchunk_recursive
  n_cragchunk_recursive -->|深化| n_cragchunk_markdown_aware
  n_cragchunk_token_budget -->|前置| n_cragchunk_recursive
  n_craghybrid_sparse_vs_dense -->|组成| n_craghybrid_bm25
  n_craghybrid_sparse_vs_dense -->|组成| n_craghybrid_vector_recall
  n_craghybrid_bm25 -->|前置| n_craghybrid_rrf
  n_craghybrid_vector_recall -->|前置| n_craghybrid_rrf
  n_craghybrid_rrf -->|组成| n_craghybrid_retriever
  n_cragrerank_recall_precision -->|组成| n_cragrerank_llm_rerank
  n_cragrerank_recall_precision -->|应用| n_cragrerank_signal_to_noise
  n_cragrerank_llm_rerank -->|对比| n_cragrerank_cross_encoder
  n_cragrerank_recall_precision -->|应用| n_craghybrid_retriever
  n_cragquery_mismatch -->|应用| n_cragquery_multi_query
  n_cragquery_mismatch -->|应用| n_cragquery_hyde
  n_cragquery_multi_query -->|深化| n_cragquery_recall_coverage
  n_cragquery_hyde -->|深化| n_cragquery_recall_coverage
  n_crageval_llm_judge_rag -->|组成| n_crageval_context_relevance
  n_crageval_llm_judge_rag -->|组成| n_crageval_faithfulness
  n_crageval_llm_judge_rag -->|组成| n_crageval_answer_relevance
  n_crageval_stage_localization -->|应用| n_crageval_context_relevance
  n_crageval_stage_localization -->|应用| n_crageval_faithfulness
  n_cragprod_pipeline_compose -->|组成| n_cragprod_metadata_filter
  n_cragprod_pipeline_compose -->|组成| n_cragprod_persistence
  n_cragprod_pipeline_compose -->|组成| n_cragprod_incremental_upsert
  n_cragprod_metadata_filter -->|前置| n_cragprod_vectordb_migration
  n_cragprod_pipeline_compose -->|应用| n_cragrerank_recall_precision
  n_cragchunk_why_matters -->|深化| n_c09_chunk_overlap
  n_cragchunk_recursive -->|应用| n_c09_rag_pipeline
  n_cragchunk_token_budget -->|应用| n_c07_context_window_budget
  n_craghybrid_vector_recall -->|深化| n_c08_topk_retrieval
  n_craghybrid_bm25 -->|深化| n_c08_semantic_vs_keyword
  n_craghybrid_retriever -->|深化| n_c09_topk_retrieval
  n_cragrerank_signal_to_noise -->|应用| n_c09_augment_prompt
  n_cragrerank_llm_rerank -->|对比| n_c15_llm_judge
  n_cragquery_hyde -->|应用| n_c08_embedding
  n_cragquery_multi_query -->|应用| n_c09_topk_retrieval
  n_crageval_llm_judge_rag -->|深化| n_c15_llm_judge
  n_crageval_faithfulness -->|深化| n_c09_hallucination_reduction
  n_crageval_stage_localization -->|应用| n_c15_eval_harness
  n_cragprod_metadata_filter -->|应用| n_c17_human_in_the_loop
  n_cragprod_persistence -->|深化| n_c08_vector_store
  n_cragprod_pipeline_compose -->|应用| n_c18_agent_as_service
  n_cragprod_vectordb_migration -->|对比| n_ccapstone_rag_corpus
  n_cragcontextual_document_context -->|前置| n_cragcontextual_pre_index
  n_cragcontextual_pre_index -->|应用| n_cragcontextual_title_recall
  n_cragcontextual_pre_index -->|组成| n_cragcontextual_raw_preserved
  n_cragcontextual_pre_index -->|应用| n_cragcontextual_hybrid_friendly
  n_cragcontextual_title_recall -->|深化| n_cragcontextual_hybrid_friendly
  n_cragcontextual_document_context -->|深化| n_cragchunk_markdown_aware
  n_cragcontextual_pre_index -->|应用| n_craghybrid_retriever
  n_cragcontextual_title_recall -->|应用| n_c09_topk_retrieval
  n_cragcontextual_raw_preserved -->|应用| n_c09_citation
  n_cragcontextual_hybrid_friendly -->|前置| n_cragctx_context_budget
  n_cragagentic_state_machine -->|组成| n_cragagentic_gated_retrieve
  n_cragagentic_gated_retrieve -->|组成| n_cragagentic_grade
  n_cragagentic_grade -->|应用| n_cragagentic_rewrite_loop
  n_cragagentic_grade -->|应用| n_cragagentic_refuse
  n_cragagentic_rewrite_loop -->|应用| n_cragagentic_gated_retrieve
  n_cragagentic_rewrite_loop -->|应用| n_cragquery_multi_query
  n_cragagentic_grade -->|应用| n_crageval_context_relevance
  n_cragagentic_refuse -->|应用| n_cragsec_defense_in_depth
  n_cragagentic_state_machine -->|深化| n_c04_agent_loop
  n_cragagentic_state_machine -->|应用| n_c16_decorator_tracer
  n_cragsec_untrusted_retrieval -->|应用| n_cragsec_injection_detection
  n_cragsec_untrusted_retrieval -->|应用| n_cragsec_pii_redaction
  n_cragsec_injection_detection -->|组成| n_cragsec_defense_in_depth
  n_cragsec_pii_redaction -->|组成| n_cragsec_defense_in_depth
  n_cragsec_citation_verification -->|组成| n_cragsec_defense_in_depth
  n_cragsec_untrusted_retrieval -->|应用| n_c17_trust_boundary
  n_cragsec_injection_detection -->|深化| n_c17_prompt_injection
  n_cragsec_injection_detection -->|应用| n_c17_isolate_and_label
  n_cragsec_pii_redaction -->|深化| n_c17_pii_redaction
  n_cragsec_citation_verification -->|深化| n_c09_citation
  n_cragsec_defense_in_depth -->|深化| n_c17_defense_in_depth
  n_cragidx_brute_force -->|对比| n_cragidx_ann_tradeoff
  n_cragidx_ann_tradeoff -->|组成| n_cragidx_ivf_bucketing
  n_cragidx_ivf_bucketing -->|组成| n_cragidx_nprobe_knob
  n_cragidx_nprobe_knob -->|应用| n_cragidx_recall_at_scale
  n_cragidx_brute_force -->|前置| n_cragidx_recall_at_scale
  n_cragidx_brute_force -->|深化| n_c08_vector_store
  n_cragidx_brute_force -->|深化| n_c08_cosine_similarity
  n_cragidx_recall_at_scale -->|深化| n_c08_topk_retrieval
  n_cragidx_recall_at_scale -->|应用| n_crageval_context_relevance
  n_cragidx_ann_tradeoff -->|应用| n_cragprod_vectordb_migration
  n_cragidx_ivf_bucketing -->|深化| n_cragprod_vectordb_migration
  n_cragctx_lost_in_middle -->|前置| n_cragctx_reorder
  n_cragctx_context_budget -->|组成| n_cragctx_dedup
  n_cragctx_context_budget -->|组成| n_cragctx_compression
  n_cragctx_dedup -->|对比| n_cragctx_compression
  n_cragctx_context_budget -->|前置| n_cragctx_reorder
  n_cragctx_context_budget -->|深化| n_c07_context_window_budget
  n_cragctx_context_budget -->|应用| n_c09_augment_prompt
  n_cragctx_dedup -->|应用| n_cragrerank_signal_to_noise
  n_cragctx_reorder -->|对比| n_cragrerank_recall_precision
  n_cragctx_compression -->|对比| n_c07_llm_summary_compression
  n_cragctx_lost_in_middle -->|应用| n_crageval_answer_relevance
  n_lgsg_state_channels -->|组成| n_lgsg_reducer
  n_lgsg_state_channels -->|前置| n_lgsg_node_partial
  n_lgsg_node_partial -->|应用| n_lgsg_reducer
  n_lgsg_node_partial -->|组成| n_lgsg_edges_compile
  n_lgsg_reducer -->|应用| n_lgsg_vs_prebuilt
  n_lgsg_vs_prebuilt -->|深化| n_c12_react_agent
  n_lgsg_state_channels -->|深化| n_c12_state_graph
  n_lgsg_edges_compile -->|深化| n_c12_langgraph
  n_lgsg_node_partial -->|对比| n_c06_run_agent_loop
  n_lgsg_reducer -->|应用| n_c07_conversation_as_array
  n_lgsg_vs_prebuilt -->|前置| n_c12_framework_choice
  n_lgrt_conditional_edge -->|组成| n_lgrt_branch
  n_lgrt_conditional_edge -->|组成| n_lgrt_loop
  n_lgrt_loop -->|应用| n_lgrt_recursion_limit
  n_lgrt_conditional_edge -->|组成| n_lgrt_send_fanout
  n_lgrt_branch -->|对比| n_lgrt_send_fanout
  n_lgrt_conditional_edge -->|深化| n_lgsg_edges_compile
  n_lgrt_loop -->|深化| n_lgsg_vs_prebuilt
  n_lgrt_loop -->|应用| n_c04_react
  n_lgrt_recursion_limit -->|对比| n_c01_max_steps
  n_lgrt_send_fanout -->|应用| n_lgsg_reducer
  n_lgrt_conditional_edge -->|应用| n_c12_react_agent
  n_lgcp_checkpointer -->|前置| n_lgcp_persist_accumulate
  n_lgcp_persist_accumulate -->|应用| n_lgcp_getstate
  n_lgcp_getstate -->|组成| n_lgcp_history
  n_lgcp_history -->|前置| n_lgcp_time_travel
  n_lgcp_checkpointer -->|应用| n_lgcp_time_travel
  n_lgcp_checkpointer -->|深化| n_lgsg_edges_compile
  n_lgcp_persist_accumulate -->|应用| n_lgsg_reducer
  n_lgcp_persist_accumulate -->|深化| n_c07_conversation_as_array
  n_lgcp_time_travel -->|对比| n_c06_run_agent_loop
  n_lgcp_time_travel -->|应用| n_lgrt_loop
  n_lgcp_checkpointer -->|深化| n_c12_langgraph
  n_lghitl_interrupt -->|前置| n_lghitl_read_payload
  n_lghitl_interrupt -->|应用| n_lghitl_command_resume
  n_lghitl_read_payload -->|应用| n_lghitl_approval_gate
  n_lghitl_command_resume -->|组成| n_lghitl_approval_gate
  n_lghitl_command_resume -->|对比| n_lghitl_plain_invoke_pitfall
  n_lghitl_interrupt -->|前置| n_lgcp_checkpointer
  n_lghitl_read_payload -->|应用| n_lgcp_getstate
  n_lghitl_approval_gate -->|应用| n_lgrt_conditional_edge
  n_lghitl_command_resume -->|对比| n_lgcp_time_travel
  n_lghitl_interrupt -->|应用| n_c04_agent_loop
  n_lghitl_plain_invoke_pitfall -->|深化| n_lgcp_persist_accumulate
  n_lgma_multi_agent -->|组成| n_lgma_supervisor
  n_lgma_multi_agent -->|组成| n_lgma_parallel_team
  n_lgma_supervisor -->|组成| n_lgma_worker_routing
  n_lgma_parallel_team -->|组成| n_lgma_order_independent_join
  n_lgma_supervisor -->|对比| n_lgma_parallel_team
  n_lgma_supervisor -->|深化| n_c11_supervisor_worker
  n_lgma_worker_routing -->|对比| n_c11_supervisor_routing
  n_lgma_order_independent_join -->|深化| n_c11_scratchpad
  n_lgma_supervisor -->|应用| n_lgrt_loop
  n_lgma_parallel_team -->|对比| n_lgrt_send_fanout
  n_lgma_order_independent_join -->|应用| n_lgsg_reducer
```

## 概念索引

| 概念 | 章节 | 说明 |
| --- | --- | --- |
| LLM 与 Agent 的区别 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | LLM 是无状态、无工具、活在过去的纯函数；Agent 是给它装上机制后的执行体 |
| Agent 公式 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | Agent = LLM + 循环 + 工具 + 记忆，对应 LLM 的三大缺陷 |
| 感知-决策-行动-观察循环 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | Agent 的核心心智模型：四步循环往复推进任务 |
| 工具的本质 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | 工具是一段模型不会、但代码会的能力，是 LLM 伸向真实世界的手 |
| 消息数组即记忆 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | 不断追加的多轮消息数组是最初级的记忆，让下一步看见上一步 |
| maxSteps 安全阀 | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | 强制的步数上限，防止模型反复要工具导致无限循环烧钱 |
| 何时不该用 Agent | [01 什么是 Agent](../lessons/01-what-is-an-agent/README.md) | 一次问答能解决的需求别套 Agent，YAGNI 在 AI 工程的体现 |
| LLM 调用本质 (无状态纯函数) | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 消息进、文本进 token 出，模型不记历史，需自行回传上下文 |
| provider 无关抽象 getLLM() | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 统一 LLMClient 接口隔离厂商差异，换厂商只改 .env |
| chat() 一次性调用 | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 发起一轮对话并一次性返回完整 ChatResult |
| stream() 流式输出 | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 逐字增量返回，降低首字延迟，最后一块带完整结果 |
| usage 与 token 成本 | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 输入/输出 token 用量是成本与可观测性的地基 |
| stopReason 停止原因 | [02 你的第一次 LLM 调用](../lessons/02-first-llm-call/README.md) | 归一的停止原因 stop/tool_use/max_tokens/other |
| system 提示 vs user 提示 | [03 提示工程](../lessons/03-prompt-engineering/README.md) | system 设角色规则全局生效，user 给本次具体任务 |
| 角色设定 + 明确指令 | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 把受众、格式、长度等隐含期望显式写进提示 |
| few-shot 示例 | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 给几个输入→输出范例，不微调即对齐自定义标签 |
| 思维链 (CoT) | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 让模型先写推理步骤再给结论，提升多步正确率 |
| 约束输出格式 (JSON) | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 用 system 锁定固定结构，供下游代码稳定解析 |
| temperature | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 控制随机性：0 确定可复现，接近 1 发散有创意 |
| 提示即行为规格 | [03 提示工程](../lessons/03-prompt-engineering/README.md) | 提示是可测试可版本化的程序，需配合评估迭代 |
| ReAct (Reasoning + Acting) | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 思考与行动交替的范式：想一步、做一步、看结果再想 |
| Agent 循环 | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 带停止条件的 while 循环：思考→行动→观察→…→答案 |
| 文本协议 + 正则解析 | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 用 system 约定固定格式，再正则抠出模型想调的工具 |
| maxSteps 停止条件 | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 防止死循环和预算失控的安全阀，比循环体更重要 |
| scratchpad 短期记忆 | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 手动维护的草稿纸，每轮重放历史弥补 LLM 无状态 |
| 工具分发表 | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 名字到字符串进出纯函数的映射，新增工具只登记一行 |
| 原生 function calling | [04 手写 Agent 循环 (ReAct)](../lessons/04-the-agent-loop/README.md) | 模型直接返回结构化工具调用，下一章取代手摇文本协议 |
| 原生工具调用 (Function Calling) | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | 模型返回结构化 toolCalls 而非裸文本来请求调用工具 |
| 请求/执行职责边界 | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | 模型只请求调用，校验执行副作用全在你的本地代码里 |
| ToolSpec 与 JSON Schema | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | 用 parameters(JSON Schema) 教模型何时调用、参数怎么填 |
| 工具调用往返循环 | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | chat→读toolCalls→执行→回传tool消息→再chat 的闭环 |
| stopReason 终止控制 | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | stopReason 不再是 tool_use 时即拿到最终答案、结束循环 |
| toolCallId 结果绑定 | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | 每个 toolCall 必须有对应 id 的 tool 结果消息回传 |
| 工具错误回传 | [05 工具调用基础](../lessons/05-tool-use-basics/README.md) | 把异常转字符串回传给模型，让它有机会自我修正 |
| 单一 zod schema | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 一份 schema 同时做运行期校验和生成模型可读描述 |
| defineTool / defineMiniTool | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 把校验、执行、字符串化封装进统一工具对象 |
| 工具注册表 (ToolRegistry) | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 按名登记、列举 specs、分发执行的权限边界 |
| 安全执行 | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 未知工具/非法参数/抛错都转字符串回给模型 |
| 类型擦除 run(unknown) | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 对外统一入参，规避函数参数逆变导致的集合不兼容 |
| LLM 自我纠错闭环 | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 错误字符串回传模型，下一轮补参数或换工具 |
| runAgent 循环 | [06 从零构建工具系统](../lessons/06-building-a-tool-system/README.md) | 调模型→registry.run→回传 tool 消息→再调模型 |
| 记忆即回灌 messages | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | LLM 无状态，多轮记忆靠每次把历史数组重新塞回请求 |
| 上下文窗口预算 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 窗口有 token 上限，且成本随轮次累积上升，不能无脑堆历史 |
| 滑动窗口 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 只保留最近 N 轮原文，更早的直接丢弃以控规模 |
| LLM 摘要压缩 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 把窗口外旧历史交给模型压成一条摘要，省 token 又不失忆 |
| 三段式消息结构 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | system + 一条前情摘要 + 最近 N 轮原文 的拼装顺序 |
| 压缩阈值与滚动摘要 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 攒够一批旧历史才压一次，并喂回旧摘要防早期信息流失 |
| Conversation 类 | [07 短期记忆与上下文](../lessons/07-short-term-memory/README.md) | 自管理规模的对话对象，封装窗口、摘要与回灌逻辑 |
| Embedding (语义向量) | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | 用模型把文本压成高维向量，语义近则向量近 |
| 余弦相似度 | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | 算两向量夹角余弦，只看方向作为检索排序信号 |
| 内存向量库 (add/search) | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | add 存原文+向量，search 算相似度排序取 top-k |
| Top-k 检索 | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | 按相似度降序取前 k 条作为候选材料 |
| 语义检索 vs 关键词检索 | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | 向量跨越字面差异(汽车≈轿车)，关键词只做字面匹配 |
| RAG 检索地基 | [08 Embedding 与向量检索](../lessons/08-embeddings-and-vector-search/README.md) | 向量检索负责捞候选，不生成答案，是 RAG 的前置 |
| RAG 全流程 | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 加载→分块→入库→检索→增强→生成的检索增强闭环 |
| 分块与重叠 (chunk/overlap) | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 滑动窗口切块并让相邻块重叠，防边界信息被截断 |
| top-k 检索 | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 按余弦相似度取最相近 k 块，k 太小漏答太大引噪 |
| 上下文增强 (augment) | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 把命中片段+'仅据资料作答'约束拼进 system 提示 |
| 引用溯源 | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 片段编号注入并要求标注依据，让答案可审计可核对 |
| 幻觉抑制与 A/B 对比 | [09 从零实现 RAG](../lessons/09-rag-from-scratch/README.md) | 注入私有知识+约束作答，对同一问题对比有无 RAG |
| 推理范式 (控制流选择) | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 组织模型多步思考的结构，决定可控性、成本与稳定性 |
| ReAct (边想边做) | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 思考→调工具→观察→再思考循环，动态自适应探索 |
| Plan-and-Execute (先规划再执行) | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 先产出 JSON 步骤计划，再逐步执行，可控可复用 |
| Reflection (自我反思修正) | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 初稿→批评→改写，用调用次数换产出质量 |
| zod 计划契约 | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 用 schema 强校验把 LLM 计划固化为可程序消费的数据 |
| scratchpad 滚动上下文 | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 每步结论喂给下一步，让后续步骤站在前面的肩膀上 |
| 步数/成本/可靠性权衡 | [10 推理范式](../lessons/10-reasoning-patterns/README.md) | 按调用次数与稳定性三轴为任务选范式，三者可组合 |
| Supervisor + Worker 模式 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 协调者只决策派活/结束，worker 是按职责裁剪上下文、工具和权限的专才 |
| 编排拓扑选择 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 按单 agent、subagent、agent team、worktree、handoff、agent-as-tool 选择最小可控拓扑 |
| Supervisor 路由决策 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 一次结构化 JSON 的 LLM 调用，决定派给谁、是否并行或 done |
| Worker 专才 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 独立 system prompt 与按职责裁剪的工具，输入子任务输出文本 |
| Scratchpad 共享工作台 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 累积各 worker 产出，让结果在 agent 间流动 |
| 编排主循环 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 决策→派活→回写→再决策，maxRounds 防死循环 |
| 多 agent 取舍 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 聚焦/可维护 vs token/复杂度，过载且边界清晰才拆 |
| 决策容错校验 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 宽容提取 JSON + zod 校验，失败退化为安全默认值 |
| Subagent workflow | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 把读多写少的探索、日志、测试、审查移出主线程，再回传摘要 |
| Agent team | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 多个独立会话通过 lead、task list、mailbox 协作，适合需要互相质询的任务 |
| Worktree 隔离写入 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 写代码并行前先隔离分支、目录和文件边界，降低冲突成本 |
| Handoff vs Agent-as-tool | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | handoff 让 specialist 接管对话，agent-as-tool 让 manager 保持最终控制 |
| 审批与可观测 | [11 多智能体编排](../lessons/11-multi-agent-orchestration/README.md) | 用 sandbox、approval、guardrails、traces、evals 控制副作用和回归风险 |
| 为什么生产要上框架 | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 手写够学原理，生产需状态/持久化/恢复/流式/可观测等重活标准化 |
| Vercel AI SDK | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 把 agent 看作一次带工具的文本生成，轻量、流式、贴近前端 |
| maxSteps 自动工具循环 | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | generateText 一个参数替代第06章整段手写工具 for 循环 |
| LangGraph.js | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 把 agent 看作一张状态机图，强在持久化与可恢复编排 |
| createReactAgent 预制图 | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 已编译状态图，内置模型节点↔工具节点的循环边 |
| 状态机图模型 | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 节点做计算、边定转移、状态在节点间流动，可视化/持久化/恢复 |
| 框架选型决策 | [12 上框架：LangGraph.js 与 Vercel AI SDK](../lessons/12-intro-to-frameworks/README.md) | 聊天/Web 流式选 AI SDK；长流程/checkpoint/多agent 选 LangGraph |
| 结构化输出 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 让模型产出程序可消费的数据而非自由文本 |
| zod schema 单一事实来源 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 一个 schema 约束模型、运行期校验、推导类型 |
| 强约束提示 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 明确要求只输出 JSON 并贴 JSON Schema 当契约 |
| retry-repair 自我修复重试 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 校验失败把 zod 错误回传给模型让它改 |
| extractJson 解析容错 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 从带围栏/客套话的文本里抠出 JSON |
| 运行期校验 | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | 用 safeParse 校验模型返回，类型仅编译期不可信 |
| 框架 generateObject | [13 结构化输出与校验](../lessons/13-structured-output/README.md) | AI SDK 内建要 JSON+按 schema 校验+推类型 |
| Token 流式输出 (typewriter) | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 用 llm.stream() 逐字蹦出文本，降低首字延迟焦虑 |
| 首字延迟与体感 | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 流式优化的是体感与首字延迟，不缩短总耗时 |
| 进度流 (onStep) | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 用 runAgent 的 onStep 回调实时播报每步工具调用与结果 |
| AbortController 取消 | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 协作式取消：abort() 置位 signal，消费方在检查点主动退出 |
| 消费侧取消 | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 停止向 async generator 要数据即关闭流，跨厂商最通用 |
| 优雅善后 | [14 流式输出与 UX](../lessons/14-streaming-and-ux/README.md) | 区分完成与已取消，finally 中清理定时器避免悬挂 |
| LLM 输出非确定性 | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 同一输入多次输出可能不同，传统单测的确定性前提不成立 |
| 离线评估数据集 | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 一组固定的 input→期望/评分标准样本，数据集即测试集 |
| 评估框架 runEval | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 跑数据集→逐条打分→汇总通过率与失败明细，与被测函数解耦 |
| 规则评分 | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 字段相等/含子串/正则等精确判定，确定、免费、快 |
| LLM-as-judge | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 用另一个模型按标准打分并给 reason，适合开放式输出 |
| 回归测试与 CI 门槛 | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | 重跑全集比对通过率，低于阈值让流水线变红，拦住静默退化 |
| 被测对象与评估分离 | [15 评估与测试](../lessons/15-evaluation-and-testing/README.md) | SUT 与评分逻辑分文件，同一数据集可复用测不同版本 |
| 可观测性 (Observability) | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 在每次外部调用进出两端打点，把一次任务还原成可复盘的调用树 |
| Span 与 Trace 树 | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 每次调用记一条 span（model/tokens/耗时/stopReason），聚合成 trace 树 |
| 装饰器模式 Tracer | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 用装饰器包住 LLMClient，对业务零侵入地收集 span |
| 费用估算公式 | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 成本 = 输入tokens×输入单价 + 输出tokens×输出单价 |
| 价格表单一事实来源 | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 按每百万 token 维护价格常量表，未知模型回退兜底价 |
| 瓶颈定位 | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 从 span 中找出最慢、最贵的一步，定位慢与贵的根因 |
| 生产工具 LangSmith/OTel | [16 可观测性与成本](../lessons/16-observability-and-cost/README.md) | 把 span 上报后台看板，原理与本章 Tracer 一致 |
| 提示注入 (Prompt Injection) | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 外部数据里的文本被模型当成指令执行，劫持系统意图 |
| 信任边界 | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 只有系统规则和用户问题是命令，其余一切都是不可信数据 |
| 隔离 + 标注 (wrapUntrusted) | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 用唯一分隔符框住不可信内容并声明框内永远是数据 |
| 纵深防御 | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 隔离/强化system/出口校验/脱敏/人工确认多层叠加，无单点银弹 |
| 出口行为校验 | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 在边界检查输出是否复述注入话术或泄露内部口令 |
| PII 脱敏 | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 输出落地前用正则过滤邮箱/手机/身份证/卡号并留审计 |
| 最小权限 + 人在回路 | [17 安全与护栏](../lessons/17-safety-and-guardrails/README.md) | 工具白名单，危险不可逆操作在execute内由人确认放行 |
| 脚本到服务 (Agent as Service) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | 把跑一次就退的脚本包成常驻、并发、多用户的 HTTP 服务 |
| 无状态服务 (Stateless) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | 请求自带完整上下文，会话不放进程内存，多实例才能水平扩展 |
| 请求超时 (Timeout) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | Promise.race 给每请求设上限，防慢请求拖垮服务 |
| 错误兜底 (withGuards) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | 异常统一转结构化错误、不泄堆栈，进程绝不因单请求崩溃 |
| 密钥安全 (Secrets) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | key 只从环境变量读，绝不进代码/响应/日志 |
| SSE 流式接口 (/chat/stream) | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | text/event-stream 把 token 逐字推前端，断开做消费侧取消 |
| 部署 checklist 与 Docker | [18 部署：把 Agent 变成服务](../lessons/18-deployment/README.md) | 端口从 env 读、健康检查、优雅退出、Dockerfile 与上线自查清单 |
| Agent 生态分层 | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 把 agent 栈拆成 8 个可替换工程层的拆解框架 |
| MCP (模型上下文协议) | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 标准化 agent 连接外部工具/数据/资源的协议，AI 的 USB-C |
| A2A (Agent2Agent) | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 标准化不同厂商 agent 间发现、通信与协作的协议 |
| Agent SDK | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 封装 loop/handoff/guardrail/session 的开发层，如 OpenAI/Vercel SDK |
| 编排 runtime | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 管长任务持久化、恢复、人工介入的状态层，如 LangGraph/CrewAI |
| Hosted tools 与 sandbox | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 平台内置的 web/file search、computer use、代码沙箱执行能力 |
| 需求倒推选型 | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | 从约束出发判断手写还是选 SDK/runtime/协议的决策方法 |
| 可观测与安全治理 | [19 Agent 前沿发展与生态拆解](../lessons/19-agent-ecosystem-and-frontier/README.md) | tracing/eval/cost/guardrails/HITL 作为上线门槛与一等部件 |
| 前沿文章库 | [20 Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 把 agent 前沿资料按日期、体系层和文章卡片组织成可扫描资讯页 |
| 日期筛选 | [20 Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 按原文发布时间浏览文章，避免长列表失去时间上下文 |
| 体系层筛选 | [20 Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 用八层生态分类快速定位模型、协议、runtime、评测与安全资料 |
| 文章卡片与原文入口 | [20 Agent 前沿文章库](../lessons/20-agent-frontier-news/README.md) | 文章卡片直接展示摘要、来源、体系层和原文入口 |
| Plan-and-Execute 架构 | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 先规划拆子问题再多步执行，减少无效工具调用且可审计 |
| research() 研究主干 | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 规划→检索推理→结构化汇总→成本统计的端到端纯逻辑 |
| 工具系统 (search/calc/saveNote) | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 工厂函数+闭包注入状态，zod schema 同管描述与校验 |
| RAG 内置语料检索 | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 虚构语料装入内存向量库，search 工具做语义检索防幻觉 |
| 结构化输出 (zod 约束) | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | planSchema/reportSchema 把不确定模型输出收敛为类型安全产物 |
| Tracer 可观测与成本 | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 装饰器无侵入包裹 LLMClient，统计 tokens/调用并估算成本 |
| CLI / HTTP 双入口 | [capstone 毕业项目 · Deep Research Agent](../capstone/deep-research-agent/README.md) | 核心逻辑与展示层解耦，同一份能力暴露为命令行和 HTTP 服务 |
| 单轮纵深处理管线 | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | 安全→记忆→路由→RAG/工具→HITL→脱敏→可观测，一轮串起七种能力 |
| 会话短期记忆 (不可变快照) | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | 跨轮累积订单号等槽位，每次返回新快照不就地改写 |
| 知识库检索 (BM25 带引用) | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | FAQ 装入 BM25 倒排，离线确定地按问题检索并带 [n] 引用 |
| 查单/退款工具 (zod 边界校验) | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | defineTool 把不可信输入挡在系统边界外，退款仅产出待审批意图 |
| 退款 HITL 审批门 | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | 大额/敏感退款挂起等人工审批，签名记入会话后才放行 |
| 注入检测 + PII 脱敏 | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | 入口扫提示注入即拦截，出口正则脱敏邮箱/手机/卡号 |
| Tracer 估算 token 与成本 | [cap-support 毕业项目 · 客服 Copilot](../capstone/support-copilot/README.md) | 累加工具调用、用 approxTokens 估 token 并按价格表算成本 |
| 评审团 supervisor (并行 fork-join) | [cap-review 毕业项目 · 代码评审团](../capstone/code-review-crew/README.md) | 多角色评审员并行跑每个文件，supervisor 只负责调度与合并 |
| 角色评审员 (security/perf/style) | [cap-review 毕业项目 · 代码评审团](../capstone/code-review-crew/README.md) | 每个角色是纯函数 agent，用确定性规则扫出本职发现 |
| 结构化发现 (zod schema) | [cap-review 毕业项目 · 代码评审团](../capstone/code-review-crew/README.md) | findingSchema 校验每条发现，挡掉格式跑偏的产物 |
| 严重度排序与去重 | [cap-review 毕业项目 · 代码评审团](../capstone/code-review-crew/README.md) | critical/major/minor 排序，同文件同行同规则合并去重 |
| 评审门 (critical 即 BLOCK) | [cap-review 毕业项目 · 代码评审团](../capstone/code-review-crew/README.md) | 出现任何 critical 即拦截合并，门禁裁决可作 CI 卡点 |
| Golden 测试集 | [cap-eval 毕业项目 · Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | 固定的输入+期望(工具/关键词/是否拒答)，是评测的事实基准 |
| 被测 Agent (合规 vs 退化) | [cap-eval 毕业项目 · Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | 确定性 Subject，退化版『该拒答却乱答』用来演示评测能抓回归 |
| 离线裁判 (tool/keyword/refusal) | [cap-eval 毕业项目 · Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | 纯函数裁判逐条打分，复用 shared 的 isRefusalAnswer 规则 |
| 聚合指标 | [cap-eval 毕业项目 · Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | 通过率/工具准确率/拒答准确率/成本，量化 Agent 质量 |
| 回归门 (CI exit code) | [cap-eval 毕业项目 · Agent 评测与回归门](../capstone/agent-eval-harness/README.md) | 指标跌破阈值即非零退出，自动拦下退化版本 |
| 告警 SEV 分级 | [cap-incident 毕业项目 · 告警响应 Agent](../capstone/incident-responder/README.md) | 把 5xx、延迟、队列积压等信号合成 SEV1/2/3 处置等级 |
| Runbook 匹配 | [cap-incident 毕业项目 · 告警响应 Agent](../capstone/incident-responder/README.md) | 用日志关键词匹配最可能的处置手册，避免临场拍脑袋 |
| 根因证据链 | [cap-incident 毕业项目 · 告警响应 Agent](../capstone/incident-responder/README.md) | 把错误日志、指标和影响服务整理成可审计诊断 |
| 处置动作审批分层 | [cap-incident 毕业项目 · 告警响应 Agent](../capstone/incident-responder/README.md) | 诊断命令可直接执行，扩容/暂停批处理等变更必须审批 |
| 复盘清单 | [cap-incident 毕业项目 · 告警响应 Agent](../capstone/incident-responder/README.md) | 把告警、压测、审计和 runbook 改进固化成后续任务 |
| 反馈注入隔离 | [cap-feedback 毕业项目 · 用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 把不可信用户反馈先过提示注入检测，可疑内容不进入分析 |
| 反馈 PII 脱敏 | [cap-feedback 毕业项目 · 用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 邮箱、手机等个人信息在入库和展示前统一脱敏 |
| 主题聚类 | [cap-feedback 毕业项目 · 用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 按导出、引导、集成等真实产品问题把反馈归类 |
| 价值加权优先级 | [cap-feedback 毕业项目 · 用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 结合账号层级与严重度排序，避免只按数量排期 |
| Roadmap Ticket 生成 | [cap-feedback 毕业项目 · 用户反馈洞察 Agent](../capstone/feedback-intelligence/README.md) | 把洞察输出成 owner 明确、样本可追溯的产品任务 |
| ICP Fit 评分 | [cap-sales 毕业项目 · 销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | 按行业、规模和技术栈判断客户是否适合当前 Agent 方案 |
| 业务信号证据链 | [cap-sales 毕业项目 · 销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | 从痛点、招聘、预算、合规等公开信号解释为什么值得跟进 |
| 合规风险扣分 | [cap-sales 毕业项目 · 销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | 金融、教育等敏感场景提高风险权重，先确认权限边界 |
| 销售开场话术 | [cap-sales 毕业项目 · 销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | 把证据链转成面向行业痛点的 discovery call 切入点 |
| 下一步动作 | [cap-sales 毕业项目 · 销售线索研究 Agent](../capstone/sales-lead-researcher/README.md) | 按 priority/nurture/disqualify 输出可执行跟进策略 |
| 切块决定检索上限 | [rag-chunk 进阶分块策略](../rag-advanced/01-chunking-strategies/README.md) | 检索质量的天花板很大程度由分块策略决定，太大太小都伤召回 |
| 字符滑窗切分 | [rag-chunk 进阶分块策略](../rag-advanced/01-chunking-strategies/README.md) | 第09章基线：定长字符 + 重叠，简单但会盲切句子 |
| 递归语义切分 | [rag-chunk 进阶分块策略](../rag-advanced/01-chunking-strategies/README.md) | 优先在段落/句子/词等语义边界下刀，按 token 控大小 |
| Markdown 标题感知切分 | [rag-chunk 进阶分块策略](../rag-advanced/01-chunking-strategies/README.md) | 按标题分节并把标题路径前缀进块，让片段自带出处 |
| 按 token 计长 (approxTokens) | [rag-chunk 进阶分块策略](../rag-advanced/01-chunking-strategies/README.md) | 用 token 而非字符控制块大小，贴合上下文预算 |
| 稀疏 vs 稠密检索 | [rag-hybrid 混合检索 (向量+BM25+RRF)](../rag-advanced/02-hybrid-search/README.md) | BM25 关键词(稀疏) 与 向量语义(稠密) 各有盲区，互补 |
| BM25 关键词打分 | [rag-hybrid 混合检索 (向量+BM25+RRF)](../rag-advanced/02-hybrid-search/README.md) | 经典词频检索，擅长精确词/专名/型号，对语义改写无能 |
| 向量语义召回 | [rag-hybrid 混合检索 (向量+BM25+RRF)](../rag-advanced/02-hybrid-search/README.md) | 余弦相似度召回语义近似，对精确专名/罕见词不敏感 |
| RRF 排名融合 | [rag-hybrid 混合检索 (向量+BM25+RRF)](../rag-advanced/02-hybrid-search/README.md) | 只看名次不看分值地融合多路结果，免归一化、抗异常分 |
| 混合检索器 | [rag-hybrid 混合检索 (向量+BM25+RRF)](../rag-advanced/02-hybrid-search/README.md) | 同源建向量+BM25 双索引，各召回一批再 RRF 融合 top-k |
| 召回-精排两段式 | [rag-rerank 召回-精排两段式](../rag-advanced/03-reranking/README.md) | 先廉价多召回(别漏)，再贵而准地精排到少数(排得准) |
| LLM 重排 | [rag-rerank 召回-精排两段式](../rag-advanced/03-reranking/README.md) | 让模型同看 query 与候选给出相关性排序，教学用近似精排 |
| 上下文信噪比 | [rag-rerank 召回-精排两段式](../rag-advanced/03-reranking/README.md) | 精排提升注入片段的相关密度，减少无关噪声干扰生成 |
| cross-encoder 精排器 | [rag-rerank 召回-精排两段式](../rag-advanced/03-reranking/README.md) | 生产常用专用重排模型(bge-reranker/Cohere)，原理一致 |
| 查询-资料措辞错配 | [rag-query 查询改写 (multi-query/HyDE)](../rag-advanced/04-query-transformation/README.md) | 用户问法与资料写法常对不上，检索前需先优化查询 |
| 多查询改写 | [rag-query 查询改写 (multi-query/HyDE)](../rag-advanced/04-query-transformation/README.md) | 扩成多个措辞/角度的查询，多路召回取并集降低漏召回 |
| HyDE 假设答案检索 | [rag-query 查询改写 (multi-query/HyDE)](../rag-advanced/04-query-transformation/README.md) | 先生成假设答案，用其向量检索，常比用问题本身更准 |
| 召回覆盖率 | [rag-query 查询改写 (multi-query/HyDE)](../rag-advanced/04-query-transformation/README.md) | 查询改写优化的核心指标：相关片段是否被召回进候选集 |
| RAG 的 LLM-as-judge | [rag-eval RAG 评估三指标](../rag-advanced/05-rag-evaluation/README.md) | 用裁判模型给一次 RAG 问答的多个质量维度打分 |
| 上下文相关性 | [rag-eval RAG 评估三指标](../rag-advanced/05-rag-evaluation/README.md) | 检索到的资料是否相关，低分指向检索环出问题 |
| 忠实度 | [rag-eval RAG 评估三指标](../rag-advanced/05-rag-evaluation/README.md) | 答案是否都有资料支撑、无臆造，低分说明模型在编 |
| 答案相关性 | [rag-eval RAG 评估三指标](../rag-advanced/05-rag-evaluation/README.md) | 答案是否直接切题，低分指向提示或生成跑偏 |
| 按指标定位坏环 | [rag-eval RAG 评估三指标](../rag-advanced/05-rag-evaluation/README.md) | 三分拆开看，定位是检索/生成/提示哪一环需要调 |
| metadata 过滤 | [rag-prod 生产化 RAG 全链路](../rag-advanced/06-production-rag/README.md) | 按租户/权限/类别先筛子集再检索，最小权限的落地 |
| 向量库持久化 | [rag-prod 生产化 RAG 全链路](../rag-advanced/06-production-rag/README.md) | toJSON/fromJSON 存载已算好的向量，重启免重新付费 embedding |
| 增量 upsert | [rag-prod 生产化 RAG 全链路](../rag-advanced/06-production-rag/README.md) | 知识变动时按 id 只重嵌变更项，不整库重建 |
| 端到端管线组合 | [rag-prod 生产化 RAG 全链路](../rag-advanced/06-production-rag/README.md) | 过滤+检索+精排+引用增强生成组装成可复用 answerWithRag |
| 迁移到专用向量 DB | [rag-prod 生产化 RAG 全链路](../rag-advanced/06-production-rag/README.md) | 数据量/并发/持久化需求超内存库时迁 pgvector/Qdrant，接口对齐 |
| 文档级上下文 | [rag-contextual Contextual Retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 标题、章节路径、metadata 等 chunk 被切出来后容易丢掉的语境 |
| 入索引前补上下文 | [rag-contextual Contextual Retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 在 embedding/BM25 前把上下文与原文拼成 contextualized chunk |
| 标题词召回恢复 | [rag-contextual Contextual Retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 用户查询命中标题/章节词时，补上下文能让孤立片段重新被召回 |
| 原文可审计 | [rag-contextual Contextual Retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 上下文前缀与原文正文分层保存，确保不改写原始事实 |
| 同时服务 BM25 与向量 | [rag-contextual Contextual Retrieval](../rag-advanced/07-contextual-retrieval/README.md) | 补上下文后的文本可同时增强关键词匹配与语义 embedding 输入 |
| gated retrieve | [rag-agentic Agentic RAG](../rag-advanced/08-agentic-rag/README.md) | 检索后先判断证据是否足够，够才进入回答，不够则重试 |
| 证据打分器 | [rag-agentic Agentic RAG](../rag-advanced/08-agentic-rag/README.md) | 把候选片段评成 answer/retry/refuse，控制后续路径 |
| 改写重试循环 | [rag-agentic Agentic RAG](../rag-advanced/08-agentic-rag/README.md) | 证据不足时把口语 query 改写成更贴资料的检索词再召回 |
| 无答案拒答 | [rag-agentic Agentic RAG](../rag-advanced/08-agentic-rag/README.md) | 资料没有答案时停止并拒答，而不是强行生成 |
| RAG 状态机 | [rag-agentic Agentic RAG](../rag-advanced/08-agentic-rag/README.md) | retrieve、grade、rewrite、answer/refuse 显式成状态，便于测试和观测 |
| 检索内容即不可信数据 | [rag-security RAG 安全护栏](../rag-advanced/09-rag-security/README.md) | RAG 把外部文档塞进提示词，等于把不可信数据递给模型，是间接注入的攻击面 |
| 注入检测与隔离 | [rag-security RAG 安全护栏](../rag-advanced/09-rag-security/README.md) | 用确定性规则扫描检索片段里的指令式文本，命中即隔离，不让投毒文档当指令执行 |
| PII 出口脱敏 | [rag-security RAG 安全护栏](../rag-advanced/09-rag-security/README.md) | 片段/答案落地前在边界用正则脱敏邮箱/手机/身份证/卡号，并留审计命中 |
| 引用可核验 | [rag-security RAG 安全护栏](../rag-advanced/09-rag-security/README.md) | 校验答案声称的引用编号是否真落在检索来源范围内，把幻觉引用变成可量化信号 |
| RAG 纵深防御 | [rag-security RAG 安全护栏](../rag-advanced/09-rag-security/README.md) | 检测+脱敏+引用核验分层叠加；确定性纯函数是模型对齐前最便宜的第一层 |
| 暴力精确检索 | [rag-index 向量索引内部机制](../rag-advanced/10-index-internals/README.md) | 第08章 search 的真面目：查询和全库每条算余弦，比较次数=N，精确但随库线性变慢 |
| ANN 近似最近邻的交易 | [rag-index 向量索引内部机制](../rag-advanced/10-index-internals/README.md) | 用可控的召回损失换数量级的比较次数下降；不是更聪明的精确，是只和可能的答案比 |
| IVF 倒排分桶 | [rag-index 向量索引内部机制](../rag-advanced/10-index-internals/README.md) | 先把向量聚类成 nlist 个桶，查询只在最近的几个桶里精确比较，缩小候选集合 |
| nprobe 旋钮 | [rag-index 向量索引内部机制](../rag-advanced/10-index-internals/README.md) | 探桶数：小=快但可能漏，大=准但接近全扫，=nlist 退化为暴力且更贵 |
| 近似召回度量 | [rag-index 向量索引内部机制](../rag-advanced/10-index-internals/README.md) | 拿暴力结果当金标、recall@k 当尺子，把『近似漏了多少』从感觉变成可回归的实测 |
| 上下文 token 预算 | [rag-context 检索后上下文工程](../rag-advanced/11-context-engineering/README.md) | 窗口有 token 上限，检索回来的片段塞不下全部，要在预算内挑价值最高的子集 |
| 近重复去重 | [rag-context 检索后上下文工程](../rag-advanced/11-context-engineering/README.md) | 多路召回/块重叠带来近重复片段，按 Jaccard 删整片冗余，把预算让给唯一信息 |
| 抽取式压缩 | [rag-context 检索后上下文工程](../rag-advanced/11-context-engineering/README.md) | 超长片段按句抽取裁到预算内，保留高信息前缀；纯抽取是原文子串，无幻觉风险 |
| 中间遗忘 (lost-in-the-middle) | [rag-context 检索后上下文工程](../rag-advanced/11-context-engineering/README.md) | 模型对上下文首尾注意力强、中间弱，埋在中部的关键证据容易被忽略 |
| 注意力感知重排 | [rag-context 检索后上下文工程](../rag-advanced/11-context-engineering/README.md) | 按位置注意力权重把高相关片段放到首尾，依重排不等式最大化有效相关性 |
| State 与 channels | [lg-stategraph 手写 StateGraph](../langgraph-advanced/01-stategraph-basics/README.md) | 图的共享状态由若干带类型的 channel 组成，在节点间流动；State 是 StateGraph 的中枢 |
| channel reducer | [lg-stategraph 手写 StateGraph](../langgraph-advanced/01-stategraph-basics/README.md) | 每个 channel 配一个 reducer 决定多次写入如何合并：append 累积 / replace 覆盖（默认） |
| 节点返回 partial 更新 | [lg-stategraph 手写 StateGraph](../langgraph-advanced/01-stategraph-basics/README.md) | 节点是普通函数，只返回它要改的 channel；没碰的 channel 由上一状态自动保留 |
| 边与 compile/invoke | [lg-stategraph 手写 StateGraph](../langgraph-advanced/01-stategraph-basics/README.md) | START/END + addEdge 连成流程，compile 成可执行图，invoke 给初始 state 跑到终态 |
| 揭开 createReactAgent | [lg-stategraph 手写 StateGraph](../langgraph-advanced/01-stategraph-basics/README.md) | 预制 agent = StateGraph + messages channel(append reducer) + 模型节点 + 工具节点 + 循环边 |
| 条件边 (addConditionalEdges) | [lg-routing 条件边与路由](../langgraph-advanced/02-conditional-routing/README.md) | router 函数读 State 返回下一个节点名，图在运行时自己决定走向——分支/循环/扇出的共同基础 |
| 分支路由 | [lg-routing 条件边与路由](../langgraph-advanced/02-conditional-routing/README.md) | router 按 State 返回不同节点名，把流程导向不同 handler |
| 循环边 | [lg-routing 条件边与路由](../langgraph-advanced/02-conditional-routing/README.md) | 条件边指回更早的节点形成循环，必须有终止条件；这正是 ReAct「反复行动直到完成」的骨架 |
| recursionLimit 安全阀 | [lg-routing 条件边与路由](../langgraph-advanced/02-conditional-routing/README.md) | 循环不收敛跑到上限抛 GraphRecursionError，图版的 maxSteps，防无限循环烧资源 |
| Send 扇出 (map-reduce) | [lg-routing 条件边与路由](../langgraph-advanced/02-conditional-routing/README.md) | 从一条边返回一组 Send 动态生成多个并行节点实例，结果经 reducer 合并、与完成顺序无关 |
| Checkpointer 与 thread_id | [lg-checkpoint Checkpointer 持久化与时间旅行](../langgraph-advanced/03-checkpointing/README.md) | 给图 compile 时挂 MemorySaver，invoke 带 {configurable:{thread_id}}，每个 super-step 的状态即按 thread 持久化 |
| 跨 invoke 持久化累积 | [lg-checkpoint Checkpointer 持久化与时间旅行](../langgraph-advanced/03-checkpointing/README.md) | 同一 thread 多次 invoke，状态经 reducer 自动续上（append 累积/sum 累加），无需手动回传历史；不同 thread 完全隔离 |
| getState 状态快照 | [lg-checkpoint Checkpointer 持久化与时间旅行](../langgraph-advanced/03-checkpointing/README.md) | getState 取某 thread 的当前快照：values（各 channel 值）+ next（待执行节点，空=已到 END）+ checkpoint_id |
| getStateHistory 执行时间线 | [lg-checkpoint Checkpointer 持久化与时间旅行](../langgraph-advanced/03-checkpointing/README.md) | getStateHistory 倒序（newest-first）遍历每个 super-step 的快照，构成可回溯的执行时间线 |
| updateState 改写与时间旅行 | [lg-checkpoint Checkpointer 持久化与时间旅行](../langgraph-advanced/03-checkpointing/README.md) | updateState 人工改写某个 channel（经 reducer 合并）；invoke(null, 历史 checkpoint 的 config) 从过去某点重放，纯函数节点下结果可复现 |
| interrupt 节点中途暂停 | [lg-hitl Human-in-the-Loop（interrupt 审批门）](../langgraph-advanced/04-human-in-the-loop/README.md) | 节点内调用 interrupt(payload) 把 payload 交给人、就地暂停整张图；必须配 checkpointer 才能持久化暂停点 |
| 读取 interrupt payload | [lg-hitl Human-in-the-Loop（interrupt 审批门）](../langgraph-advanced/04-human-in-the-loop/README.md) | 暂停时 payload 不在 invoke 返回值顶层，要从 getState(cfg).tasks[].interrupts[].value 取（0.2.x 实证暴露位置） |
| Command(resume) 续跑 | [lg-hitl Human-in-the-Loop（interrupt 审批门）](../langgraph-advanced/04-human-in-the-loop/README.md) | invoke(new Command({resume:val}), cfg) 续跑，被暂停的 interrupt() 就地返回 val；这是唯一能 resume 的方式 |
| 审批门：放行 / 拦截 | [lg-hitl Human-in-the-Loop（interrupt 审批门）](../langgraph-advanced/04-human-in-the-loop/README.md) | humanReview 后用条件边按人给的决定路由——批准走 apply 放行，否则走 cancel 拦截；终态完全由人决定 |
| 易错：普通 invoke 不 resume | [lg-hitl Human-in-the-Loop（interrupt 审批门）](../langgraph-advanced/04-human-in-the-loop/README.md) | 暂停时用普通 invoke(input)（非 Command）不会续跑，会带新输入从头重跑并再次暂停——resume 必须用 Command |
| 多 Agent = 多专职节点编排 | [lg-multiagent 多 Agent 编排（supervisor / 并行 team）](../langgraph-advanced/05-multi-agent-graph/README.md) | 把多个专职 agent 编排进一张图协作；agent 就是节点，拓扑由边决定——两种基本拓扑是 supervisor 与并行 team |
| supervisor 中心化调度 | [lg-multiagent 多 Agent 编排（supervisor / 并行 team）](../langgraph-advanced/05-multi-agent-graph/README.md) | 一个调度节点用条件边按任务类型把每条任务分给对应 worker，worker 干完回到 supervisor，循环到队列空——串行、顺序可控 |
| 按类型路由到 worker | [lg-multiagent 多 Agent 编排（supervisor / 并行 team）](../langgraph-advanced/05-multi-agent-graph/README.md) | supervisor 的条件边读队首任务类型，返回对应 worker 节点名（math/upper/echo）；队列空则返回 END 收工 |
| 并行异构 team（fork/join） | [lg-multiagent 多 Agent 编排（supervisor / 并行 team）](../langgraph-advanced/05-multi-agent-graph/README.md) | 从 fork 点一次连出多条边，多个不同角色 agent 在同一 super-step 并行执行，结果汇入 join——并行、靠 reducer 合并 |
| join 顺序无关聚合 | [lg-multiagent 多 Agent 编排（supervisor / 并行 team）](../langgraph-advanced/05-multi-agent-graph/README.md) | 并行产出的原始顺序不保证，append reducer 汇集后 join 先排序再聚合，使最终报告与各 agent 完成顺序无关、确定可回归 |
| 源码阅读路线 | [21 源码解析](../source-analysis/README.md) | 按入口函数、runtime、状态/工具/检索、停止条件四层读框架源码 |
| LangChain create_agent | [21 源码解析](../source-analysis/README.md) | 把模型、工具、middleware、structured output 组装成 agent runtime |
| Runnable 调用协议 | [21 源码解析](../source-analysis/README.md) | invoke/batch/stream/composition 是 LangChain 组件统一接口 |
| LangGraph Pregel runtime | [21 源码解析](../source-analysis/README.md) | compile 后按 super-step 执行节点、合并 state、输出 stream/checkpoint |
| ToolNode 工具边界 | [21 源码解析](../source-analysis/README.md) | 读取 tool_calls、执行工具、把 ToolMessage 写回 messages |
| LlamaIndex QueryEngine | [21 源码解析](../source-analysis/README.md) | retriever、postprocessor、response synthesizer 串成 data-first RAG 查询链路 |
| LlamaIndex Workflow | [21 源码解析](../source-analysis/README.md) | 用 step、event、context、handoff 组织 agent 和多 agent 控制流 |

## 关联文章

> 想新增文章？在 `knowledge-graph/data/graph.ts` 的 `ARTICLES` 加一条，跑 `npm run kg` 即可。外部链接请自行核实有效性。

| 文章 | 来源 | 类型 | 关联章节 | 说明 |
| --- | --- | --- | --- | --- |
| [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | doc | 01, 19, cap-support | Anthropic 官方工程博客，系统讲解 Agent 的循环、工具与何时该用 Agent，与本章心智模型高度对应 |
| [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/) | OpenAI | doc | 19 | OpenAI 官方 TypeScript Agents SDK 文档，对应 agent、tool、handoff、guardrail、session、tracing、MCP 等 SDK 层能力 |
| [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses) | OpenAI | doc | 19 | OpenAI 官方 Responses API 参考，对应模型原生输入输出、工具调用与状态化交互接口层 |
| [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/) | OpenAI | blog | 19 | OpenAI 官方产品文章：Agents SDK 向 sandbox execution、long-horizon tasks、durable harness 演进，是前沿趋势来源 |
| [OpenAI Docs · Sandbox agents](https://developers.openai.com/api/docs/guides/agents/sandboxes) | OpenAI | doc | 19 | Agents SDK sandbox 文档，对应 code execution / long-running task 的隔离执行与生产化边界 |
| [OpenAI Docs · Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals) | OpenAI | doc | 19, cap-eval | OpenAI 官方 agent workflow eval 指南，对应第 19 章评估治理层 |
| [Google SRE Book · Managing Incidents](https://sre.google/sre-book/managing-incidents/) | Google SRE | doc | cap-incident | Google SRE 事件管理章节，对应告警分级、角色分工、沟通和复盘的生产化边界 |
| [Voice of the customer](https://en.wikipedia.org/wiki/Voice_of_the_customer) | Wikipedia | doc | cap-feedback | Voice of Customer 方法入口，对应多渠道反馈收集、主题归纳和产品改进闭环 |
| [Lead scoring](https://en.wikipedia.org/wiki/Lead_scoring) | Wikipedia | doc | cap-sales | Lead scoring 概念入口，对应 fit、行为信号、风险和销售优先级的结构化评分 |
| [OpenAI Docs · MCP and Connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) | OpenAI | doc | 19 | OpenAI 官方 MCP/connectors 文档，对应 hosted platform 如何接入远程工具协议 |
| [OpenAI Docs · Web search](https://developers.openai.com/api/docs/guides/tools-web-search) | OpenAI | doc | 19 | OpenAI 官方 web search 工具文档，对应 hosted tools 层的网页检索能力 |
| [OpenAI Docs · File search](https://developers.openai.com/api/docs/guides/tools-file-search) | OpenAI | doc | 19 | OpenAI 官方 file search 工具文档，对应 hosted tools / 私有资料检索能力 |
| [OpenAI Docs · Computer use](https://developers.openai.com/api/docs/guides/tools-computer-use) | OpenAI | doc | 19 | OpenAI 官方 computer use 工具文档，对应 UI/桌面自动化与 sandbox 风险边界 |
| [OpenAI Docs · Conversation state](https://developers.openai.com/api/docs/guides/conversation-state) | OpenAI | doc | 19 | OpenAI 官方 conversation state 文档，对应状态化交互和从手写 message history 到平台托管状态的迁移 |
| [Anthropic Messages API 文档](https://docs.anthropic.com/en/api/messages) | docs.anthropic.com | doc | 02 | Claude 的 messages.create 接口，对应本章 chat() 的底层 |
| [OpenAI Chat Completions API 文档](https://platform.openai.com/docs/api-reference/chat) | platform.openai.com | doc | 02 | OpenAI 的 chat.completions.create 接口，本章 provider 抽象的另一实现 |
| [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903) | arxiv.org | paper | 03 | 思维链 (CoT) 的奠基论文，对应本章实验三 |
| [Language Models are Few-Shot Learners (GPT-3)](https://arxiv.org/abs/2005.14165) | arxiv.org | paper | 03 | few-shot 学习的代表性论文，对应本章实验二 |
| [Anthropic 文档：Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) | docs.anthropic.com | doc | 03 | 官方提示工程技巧汇总，覆盖角色/示例/格式约束 |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | arxiv.org | paper | 04, 10, capstone | ReAct 原始论文，本章「思考+行动交替」范式的来源 |
| [Anthropic Docs · Tool use (function calling) with Claude](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) | docs.anthropic.com | doc | 05, 06 | 官方工具调用文档，含 tool_use stopReason 与 tool_result 回传机制 |
| [OpenAI Docs · Function calling](https://platform.openai.com/docs/guides/function-calling) | platform.openai.com | doc | 05 | OpenAI 侧 function calling 指南，与本章抽象对应 |
| [Zod 官方文档](https://zod.dev) | zod.dev | doc | 06 | 本章 schema 校验与类型推断的基础库，README 前置知识引用 |
| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Anthropic | blog | 07, 19 | Anthropic 官方：上下文是有限资源，需主动裁剪与压缩，与本章窗口预算/摘要思路一致 |
| [Vector embeddings - OpenAI API documentation](https://platform.openai.com/docs/guides/embeddings) | platform.openai.com | doc | 08 | 本章 embedding 默认调用 OpenAI text-embedding-3-small，官方指南 |
| [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | arxiv.org | paper | 09, capstone, cap-enterprise-kb | RAG 原始论文 (Lewis et al., 2020)，提出检索增强生成范式 |
| [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) | arxiv.org | paper | 10 | Reflection/自我反思修正的代表性论文 |
| [Claude Code Docs · Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams) | code.claude.com | doc | 11 | Claude Code 官方 agent teams 文档：team lead、teammates、共享任务列表、mailbox、hooks 与限制 |
| [Codex Docs · Subagents](https://developers.openai.com/codex/subagents) | developers.openai.com | doc | 11 | OpenAI Codex 官方 subagent workflows 文档：显式 spawn、线程管理、sandbox/approval 继承与 custom agents |
| [OpenAI Agents SDK · Orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) | developers.openai.com | doc | 11, cap-review | OpenAI 官方 Agents SDK 编排文档：handoff 与 agent-as-tool 的选择边界 |
| [Claude Code Docs · Create custom subagents](https://code.claude.com/docs/en/sub-agents) | code.claude.com | doc | 11 | Claude Code 官方 subagents 文档：独立上下文、工具权限、自动/显式委派与上下文隔离 |
| [Codex Docs · Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md) | developers.openai.com | doc | 11 | OpenAI Codex 官方 AGENTS.md 文档：全局、项目、子目录指令链与覆盖规则 |
| [OpenAI Agents SDK · Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) | OpenAI | doc | 11, 19 | OpenAI 官方：guardrails 与 human-in-the-loop approvals 控制敏感工具和副作用 |
| [OpenAI Agents SDK · Integrations and observability](https://developers.openai.com/api/docs/guides/agents/integrations-observability) | OpenAI | doc | 11, 19 | OpenAI 官方：tracing 记录 model calls、tool calls、handoffs、guardrails 与 custom spans |
| [Vercel AI SDK 官方文档](https://sdk.vercel.ai/docs) | Vercel | doc | 12, 19 | generateText / streamText / tool / maxSteps 的权威参考 |
| [LangGraph.js 官方文档](https://langchain-ai.github.io/langgraphjs/) | langchain-ai.github.io | doc | 12 | StateGraph / createReactAgent / checkpointer 的权威参考 |
| [Zod - TypeScript-first schema validation](https://zod.dev/) | zod.dev | doc | 13 | z.object / z.infer / safeParse 官方文档 |
| [Vercel AI SDK - generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) | ai-sdk.dev | doc | 13 | 框架内建结构化输出 API 参考 |
| [AbortController - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) | developer.mozilla.org | doc | 14 | 本章取消机制的权威参考，README 中直接引用 |
| [Streaming Messages - Anthropic API](https://docs.anthropic.com/en/api/messages-streaming) | docs.anthropic.com | doc | 14 | 官方流式消息 SSE 协议，对应底层 stream() 的实现 |
| [Statistical Approaches to Evaluating LLM Outputs (Anthropic - Create strong empirical evaluations)](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests) | docs.anthropic.com | doc | 15 | Anthropic 官方关于设计评估与评分（含规则与模型评分）的指南 |
| [promptfoo - LLM evals & testing](https://www.promptfoo.dev/docs/intro/) | promptfoo.dev | doc | 15 | 本章小结点名的生产级 eval/数据集管理框架官方文档 |
| [Anthropic Pricing](https://www.anthropic.com/pricing) | anthropic.com | doc | 16 | Anthropic 官方价格页，价格表单价的权威来源 |
| [OpenAI API Pricing](https://openai.com/api/pricing) | openai.com | doc | 16 | OpenAI 官方价格页，对比厂商单价用 |
| [OpenAI Agents — Guardrails](https://platform.openai.com/docs/guides/agents/guardrails) | platform.openai.com | doc | 17 | 官方对 agent 输入/输出护栏的设计说明，与本章分层防御思路一致 |
| [Server-sent events - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) | developer.mozilla.org | doc | 18 | SSE 与 EventSource 的官方权威说明，对应本章 /chat/stream |
| [Node.js HTTP module documentation](https://nodejs.org/api/http.html) | nodejs.org | doc | 18 | node:http 内置模块文档，本章无框架起服务的基础 |
| [Model Context Protocol: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro) | Model Context Protocol | doc | 19 | MCP 官方入门，工具/数据连接标准化的一手来源 |
| [Model Context Protocol specification repository](https://github.com/modelcontextprotocol/modelcontextprotocol) | Model Context Protocol | doc | 19 | MCP 官方 specification 与文档仓库，用于复核协议层术语、版本与实现边界 |
| [A2A Protocol specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md) | A2A Project | doc | 19 | A2A 官方 specification，对应 agent card、task/message、artifact/status 等跨 agent 协作对象 |
| [Google Developers Blog · Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) | Google Developers Blog | blog | 19 | Google Cloud 官方 A2A 发布文章，解释协议动机、设计原则、Agent Card、task/artifact/status 等生态背景 |
| [Google Agent Development Kit (ADK) docs](https://adk.dev/) | Google ADK | doc | 19 | Google ADK 官方文档，对应 Google 生态里的 agent 开发框架与多 agent 工程实践 |
| [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview) | LangChain | doc | 19 | 编排 runtime 代表，长任务持久化与 human-in-the-loop 官方文档 |
| [LangSmith Observability](https://docs.langchain.com/langsmith/observability) | LangChain | doc | 19 | LangSmith 官方观测文档，对应 agent tracing、调试、线上监控与评估治理层 |
| [Vercel AI SDK 5 announcement](https://vercel.com/blog/ai-sdk-5) | Vercel | blog | 19 | Vercel 官方 AI SDK 5 发布文章，对应前端流式 UI、typed messages、tooling 与产品体验层趋势 |
| [Vercel AI SDK UI · Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) | Vercel | doc | 19 | Vercel AI SDK UI 官方 chatbot 文档，对应产品/UI 层的对话体验与状态管理 |
| [CrewAI introduction](https://docs.crewai.com/en/introduction) | CrewAI | doc | 19 | CrewAI 官方入门，对应企业流程自动化、Flows 与 Crews 的团队/流程 runtime 心智模型 |
| [CrewAI Flows](https://docs.crewai.com/en/concepts/flows) | CrewAI | doc | 19 | CrewAI 官方 Flows 文档，对应事件驱动 workflow、状态管理、条件控制流与长期流程编排 |
| [LlamaIndex Agents documentation](https://developers.llamaindex.ai/python/framework/use_cases/agents/) | LlamaIndex | doc | 19 | LlamaIndex 官方 Agents 用例文档，对应数据密集型 agent、query planning、tools 与 RAG 生态层 |
| [LlamaIndex Workflows](https://developers.llamaindex.ai/python/llamaagents/workflows/) | LlamaIndex | doc | 19 | LlamaIndex 官方 Workflows 文档，对应事件驱动、可观测、可组合的数据/agent 工作流 |
| [Microsoft AutoGen · AgentChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html) | Microsoft AutoGen | doc | 19 | AutoGen 官方 AgentChat 文档，对应 agents、teams、human-in-the-loop、state、observability 等多 agent 框架能力 |
| [Microsoft Semantic Kernel Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) | Microsoft Learn | doc | 19 | Semantic Kernel 官方 agent framework 文档，对应企业应用里的 agent 协作、人工参与和流程编排 |
| [Amazon Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html) | AWS | doc | 19 | Amazon Bedrock 官方 Agents 文档，对应云平台托管 agent、API action、knowledge base 与企业集成生态 |
| [Testing Agentic Workflows with Structural Coverage Criteria](https://arxiv.org/abs/2605.26521) | arXiv | paper | 19 | 2026 论文：用结构覆盖衡量多 agent workflow 的测试充分性，对应 agent eval 的前沿方向 |
| [Agent-Diff: Benchmarking LLM Agents on Enterprise API Tasks via Code Execution with State-Diff-Based Evaluation](https://arxiv.org/abs/2602.11224) | arXiv | paper | 19 | 2026 论文：用企业 API 任务和 state-diff 合约评估 agent 执行结果，对应生产级 agent benchmark 方向 |
| [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432) | arXiv | paper | 19 | 综述型入口：从 agent 构造、应用到评估梳理 LLM autonomous agents，适合作为第 19 章体系地图的总览来源 |
| [Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://arxiv.org/abs/2402.01680) | arXiv | paper | 19 | 多 Agent 系统综述，覆盖角色画像、通信、协作机制、环境模拟与常用 benchmark，用于补齐 multi-agent 生态视角 |
| [LLM-Based Human-Agent Collaboration and Interaction Systems: A Survey](https://arxiv.org/abs/2505.00753) | arXiv | paper | 19 | Human-Agent Systems 综述，把人类反馈、控制、协作、profile 与安全风险纳入 agent 体系，而不是只讨论全自动 agent |
| [Memory for Autonomous LLM Agents: Mechanisms, Evaluation, and Emerging Frontiers](https://arxiv.org/abs/2603.07670) | arXiv | paper | 19 | 2026 agent memory 综述：write-manage-read、长期记忆、反思、压缩、隐私治理与评估，为记忆层提供系统分类 |
| [A Comprehensive Survey of Agents for Computer Use: Foundations, Challenges, and Future Directions](https://arxiv.org/abs/2501.16150) | arXiv | paper | 19 | Computer-use agents 综述，按环境、观察空间、动作空间与 agent 学习方式分类 GUI/桌面/浏览器代理 |
| [OpenAI · Introducing Operator](https://openai.com/index/introducing-operator/) | OpenAI | blog | 19 | OpenAI Operator 官方发布文：浏览器 GUI agent、CUA、WebArena/WebVoyager、用户接管与安全确认，是产品化 computer-use agent 的关键来源 |
| [OpenAI · Introducing deep research](https://openai.com/index/introducing-deep-research/) | OpenAI | blog | 19 | OpenAI deep research 官方发布文：长时网页研究、引用报告、文件/PDF/网页综合分析，对应研究型 agent 产品形态 |
| [OpenAI · Introducing Codex](https://openai.com/index/introducing-codex/) | OpenAI | blog | 19 | OpenAI Codex 官方发布文：云端软件工程 agent、隔离 sandbox、并行任务、终端日志与测试证据，对应 coding agent 产品化形态 |
| [OpenAI · Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) | OpenAI | blog | 19 | OpenAI ChatGPT agent 官方发布文：把 Operator、deep research、terminal、connectors 融合为统一 agent mode，展示产品层整合方向 |
| [OpenAI Apps SDK · MCP Apps compatibility in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt) | OpenAI | doc | 19 | OpenAI Apps SDK 文档：MCP Apps 在 ChatGPT 中的兼容与 UI 组件接入，补齐 agent 工具协议到交互界面的桥梁 |
| [MCP Specification · Lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle) | Model Context Protocol | doc | 19 | MCP 官方生命周期规范：初始化、能力协商、运行、关闭，是协议实现和兼容性复核的一手来源 |
| [MCP Specification · Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) | Model Context Protocol | doc | 19 | MCP 官方授权规范：OAuth 2.1、resource 参数、audience binding、token passthrough 禁止等安全边界 |
| [Linux Foundation · Agentic AI Foundation (AAIF) announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) | Linux Foundation | blog | 19 | Linux Foundation 官方公告：AAIF 承接 MCP、goose、AGENTS.md，说明 agent 生态进入中立治理与标准化阶段 |
| [WebArena: A Realistic Web Environment for Building Autonomous Agents](https://arxiv.org/abs/2307.13854) | arXiv | paper | 19 | Web agent 经典 benchmark：真实网站任务、功能正确性评估、长链路网页操作，是浏览器 agent 评测基线 |
| [OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments](https://arxiv.org/abs/2404.07972) | arXiv | paper | 19 | Computer-use agent 代表 benchmark：真实 OS、桌面应用、文件系统与跨应用 workflow，用执行脚本验证任务完成 |
| [MacArena: Benchmarking Computer Use Agents on an Online macOS Environment](https://arxiv.org/abs/2606.06560) | arXiv | paper | 19 | 2026 computer-use 新 benchmark：421 个 macOS 任务、50 个应用，用于观察跨平台 GUI agent 能力差异 |
| [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045) | arXiv | paper | 19 | tool-agent-user 交互 benchmark：零售/航空领域、多轮用户模拟、数据库状态对齐与 pass^k 稳定性指标 |
| [TRAJECT-Bench: A Trajectory-Aware Benchmark for Evaluating Agentic Tool Use](https://arxiv.org/abs/2510.04550) | arXiv | paper | 19 | 轨迹感知工具使用 benchmark：不仅看最终答案，也看工具选择、参数、顺序、依赖链是否正确 |
| [SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering](https://arxiv.org/abs/2405.15793) | arXiv | paper | 19 | 软件工程 agent 代表论文，强调 agent-computer interface 对代码浏览、编辑、测试和性能的影响 |
| [SWE-Lancer: Can Frontier LLMs Earn $1 Million from Real-World Freelance Software Engineering?](https://arxiv.org/abs/2502.12115) | arXiv | paper | 19 | OpenAI SWE-Lancer benchmark：把 freelance 软件工程任务映射到真实经济价值，补齐 coding agent 的经济任务评估视角 |
| [PaperBench: Evaluating AI's Ability to Replicate AI Research](https://arxiv.org/abs/2504.01848) | arXiv | paper | 19 | OpenAI PaperBench：以复现 AI 论文为任务，评估 agent 做长周期科研工程的能力、rubric 与 judge 体系 |
| [OWASP · Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/) | OWASP | doc | 19 | OWASP Agentic Security Initiative 指南：以 threat model 方式整理 agentic AI 新威胁与缓解策略 |
| [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) | OWASP | doc | 17, 19 | OWASP LLM Top 10 2025：生产 LLM/agent 应用的通用风险清单，是第 19 章治理层的安全基线 |
| [Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837) | arXiv | paper | 19 | prompt injection 防御设计模式论文，讨论工具权限、敏感信息和 agent 架构层面的安全/效用取舍 |
| [Identity Management for Agentic AI](https://arxiv.org/abs/2510.25819) | arXiv | paper | 19 | OpenID Foundation 相关白皮书：agent 身份、认证、授权、delegated authority 与访问管理，是企业落地关键议题 |
| [When Agents Handle Secrets: A Survey of Confidential Computing for Agentic AI](https://arxiv.org/abs/2605.03213) | arXiv | paper | 19 | 2026 综述：当 agent 持有密钥、记忆和工具权限时，TEE/远程证明/多跳 attestation 如何进入生产安全架构 |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | arXiv | paper | 19 | Agent 控制流的奠基范式：交错 reasoning trace 与 action，让模型边推理边调用外部工具/环境，是本课程 ReAct 循环与 maxSteps 的源头 |
| [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) | arXiv | paper | 19 | 不更新权重、用语言反思 + episodic memory 让 agent 从试错中改进，是自我批判/重试类控制流（含进阶 RAG 的 self-grade）的理论根 |
| [LLM Powered Autonomous Agents (Lilian Weng)](https://lilianweng.github.io/posts/2023-06-23-agent/) | Lil'Log | blog | 19 | 把 LLM agent 拆成 planning / memory / tool use 三大件的经典体系文，第 19 章生态地图的概念脚手架 |
| [Anthropic · Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) | Anthropic | doc | 19 | 把驱动 Claude Code 的 agent loop / 工具执行 / 上下文管理做成 Python、TS 可编程 SDK 的官方文档，平台级 agent primitives 一手来源 |
| [Anthropic Engineering · Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) | Anthropic | blog | 19 | 官方工程博客：用 gather context / take action / verify work 三段式讲如何在 SDK 上搭生产 agent，对照本课程手写 loop 的取舍 |
| [Amazon Bedrock AgentCore is now generally available](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available) | AWS | doc | 19 | AWS 把 Runtime（8 小时执行 + 会话隔离 + A2A）、Memory、Identity、Gateway 等托管 agent 基建打包 GA，企业落地的平台层代表 |
| [Introducing Microsoft Agent Framework](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/) | Microsoft | blog | 19 | 微软把 Semantic Kernel 的企业基座与 AutoGen 的多 agent 编排合并成单一开源 SDK/runtime（原生支持 A2A、MCP），runtime 收敛的标志性事件 |
| [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) | arXiv | paper | 19 | 把 LLM 上下文当虚拟内存分层管理（core/recall/archival），用中断在主体与用户间切换控制流，Letta 的理论原型与长期记忆层基石 |
| [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory](https://arxiv.org/abs/2504.19413) | arXiv | paper | 19 | 可外挂的记忆层：从对话动态抽取/合并/检索关键信息（含图变体），LOCOMO 上比满上下文省 90%+ token 与延迟，生产记忆的工程权衡样本 |
| [Letta · Benchmarking AI Agent Memory](https://www.letta.com/blog/benchmarking-ai-agent-memory/) | Letta | blog | 19 | Letta（MemGPT 团队）用基准对比文件系统记忆 vs 各类记忆框架，给「agent 记忆到底该怎么存/取」提供可量化对照 |
| [Anthropic Engineering · Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Anthropic | blog | 19 | 长跑 agent 的上下文工程：跨多个 context window 的 compaction、记忆落盘与首窗特殊 prompt，承接 context engineering 的实操篇 |
| [OpenAI Agents Python v0.17.5 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.5) | OpenAI | doc | 19 | 官方 release notes：新增可重试 sandbox_tool 错误、MongoDBSession memory 示例与 ModelSettings.truncation，让托管工具、会话存储和上下文截断的工程边界更明确。 |
| [Microsoft Agent Framework .NET 1.10.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.10.0) | Microsoft | doc | 19 | 官方 release notes：加入 Authorization Toolbox、Azure AI Foundry deployment docs、上下文 compaction opt-in 与 auto-approval rule 增强，直接影响企业 agent 的授权、部署和长上下文治理。 |
| [Google ADK Python v1.35.0 release notes](https://github.com/google/adk-python/releases/tag/v1.35.0) | Google | doc | 19 | 官方 release notes：加入 OpenTelemetry 自动 tracing、trajectory evaluator、A2A auth vs input required 区分、history compaction summaries 与 request_input 标准化，适合观察多 agent runtime 的工程收敛方向。 |
| [StreamMemBench: Towards Better Long-Context Evaluation for Memory Agents](https://arxiv.org/abs/2509.16490) | arXiv | paper | 19 | 提出 streaming long-context benchmark，把 observations、user feedback、knowledge archive 与 follow-up reuse 放到同一条评测线上，适合校正“只看 recall 不看真实复用”的记忆评测偏差。 |
| [What makes a harness a harness? Model-free foundation for agentic AI](https://arxiv.org/abs/2606.10666) | arXiv | paper | 19 | 把 harness 定义为不依赖模型能力、只负责状态、权限、审批、重试与回放的工程壳层，正好补上『agent framework ≠ harness』这层实践边界。 |
| [WorkBench Revisited: Towards a Scalable Benchmark for Evaluating Agents in Realistic Enterprise Workflows](https://arxiv.org/abs/2606.13715) | arXiv | paper | 19 | 面向真实企业 workflow 的 agent benchmark，强调 success 之外还要统计 unintended / harmful action，适合补齐 workplace agent 的安全型评测口径。 |
| [SciAgentArena: Benchmarking Scientific Agents from Paper to Experiment](https://arxiv.org/abs/2508.21126) | arXiv | paper | 19 | 把 scientific agents 的任务从 paper comprehension 拉到 experiment design / execution planning，适合校验研究型 agent 是否真的能从『读』走到『做』。 |
| [LangGraph CLI 0.4.30 release notes](https://github.com/langchain-ai/langgraph/releases/tag/langgraph-cli%3D%3D0.4.30) | LangChain | doc | 19 | 官方 release notes：CLI 开始校验 deployment 与 API version ranges 的兼容关系，并修复 config init 与 env 注入细节，说明 agent runtime tooling 正把部署契约前移到命令行阶段。 |
| [RetailBench: A Long-Horizon Benchmark for AI Agents in Retail Management](https://arxiv.org/abs/2606.14545) | arXiv | paper | 19 | 把零售经营拆成跨天库存、定价、补货与促销决策，强调 agent 不能只会单步答题，还要在长周期里维持策略一致性与收益稳定。 |
| [Can AI Agents Synthesize Scientific Conclusions? Understanding Strategic Generalization on SciConBench](https://arxiv.org/abs/2606.11337) | arXiv | paper | 19 | 提出 SciConBench，要求 agent 从多篇 scientific claims 做 clean-room 结论综合并避免直接搬运原句，适合检验研究型 agent 是否真的具备跨文献 synthesis 能力。 |
| [SubtleMemory: Benchmarking Long-Term Relational Memory in LLM Agents](https://arxiv.org/abs/2606.05761) | arXiv | paper | 19 | 把长期记忆评测拆成补充关系、矛盾关系与无关关系判断，强调 agent 需要维护人物/事件关系一致性，而不是只做关键词 recall。 |
| [SentinelBench: Benchmarking Monitoring Agents in Dynamic Environments](https://arxiv.org/abs/2606.05342) | arXiv | paper | 19 | 聚焦监控/告警场景，要求 agent 在动态环境中持续观测、解释异常并触发后续动作，补齐 monitoring agent 的时序反应与行动链评测。 |
| [OpenAI Agents Python v0.17.6 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.6) | OpenAI | doc | 19 | 官方 release notes：新增 pre-approval tool input guardrails，并允许 SDK-only custom tool-output data，说明高权限工具的审批边界与工具输出契约正在前移、收紧。 |
| [OpenAI Agents JS v0.11.8 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.11.8) | OpenAI | doc | 19 | 官方 release notes：JS 版同步加入 opt-in pre-approval tool input guardrails 与 SDK-only custom tool-output data，说明 py/js agent SDK 正在收敛到同一套安全执行边界。 |
| [Google ADK Python v2.3.0 release notes](https://github.com/google/adk-python/releases/tag/v2.3.0) | Google | doc | 19 | 官方 release notes：引入 mTLS AgentRegistry、Remote sandbox workspaces、per-request OpenTelemetry 配置、enterprise 参数迁移与 compaction 修复，说明企业级 agent runtime 的 auth、telemetry 和 remote execution 正在快速工程化。 |
| [LangGraph 1.2.6 release notes](https://github.com/langchain-ai/langgraph/releases/tag/1.2.6) | LangChain | doc | 19 | 官方 release notes：修复 nested subgraph 继承父 checkpoint namespace 回归，以及 v3 stream abort 时未取消运行中 subgraph 的问题，直接关系到 checkpoint 正确性与流式中断一致性。 |
| [Sovereign Execution Brokers: Enforcing Certificate-Bound Authority in Agentic Control Planes](https://arxiv.org/abs/2606.20520) | arXiv | paper | 19 | 提出 Sovereign Execution Broker：把 agent 的 proposal、admission、execution 三层拆开，用证书绑定、撤销窗口、drift 检查和 scoped execution identity 把真实变更权限卡在独立执行边界。 |
| [Efficient and Sound Probabilistic Verification for AI Agents](https://arxiv.org/abs/2606.20510) | arXiv | paper | 19 | 把 runtime monitoring 从 deterministic policy 推到 probabilistic verification：当 PII detector、declassifier 等工具本身有误差时，仍能给出 policy violation 的 sound 上界。 |
| [Probe-and-Refine Tuning of Repository Guidance for Coding Agents](https://arxiv.org/abs/2606.20512) | arXiv | paper | 19 | 研究 repository guidance（如 AGENTS.md）如何影响 coding agent：结论不是“有说明就行”，而是要通过 probe-and-refine 迭代补齐仓库知识，主要提升 agent 找到正确文件的覆盖率。 |
| [CrewAI 1.14.8a3 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a3) | CrewAI | doc | 19 | 官方 release notes：统一 declarative flow loading、收敛 `crewai run` / `crewai flow kickoff` 启动入口，并补上 nested crews 的进度可见性，说明多 agent workflow 的定义与运维体验正在继续向声明式和可观测靠拢。 |
| [Shared infrastructure, isolated tenants: Pool model multi-tenancy with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/shared-infrastructure-isolated-tenants-pool-model-multi-tenancy-with-amazon-bedrock-agentcore/) | AWS | blog | 19 | AWS 官方实践：用 AgentCore 展示 pool-model 多租户模式，强调共享基础设施下仍要隔离 tenant state、identity、telemetry 与审批边界，适合拿来理解生产级 agent runtime 的隔离设计。 |
| [Build a protein research copilot with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/build-a-protein-research-copilot-with-amazon-bedrock-agentcore/) | AWS | blog | 19 | AWS 官方实践：把自然语言参数抽取、protein embedding 检索和 AI scientific summaries 串成研究 copilot，说明垂类 agent 仍应拆开 query parsing、retrieval、summarization 三段，而不是用一个大 prompt 端到端硬做。 |
| [Linux Foundation Agent Name Service identity infrastructure announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents) | Linux Foundation | blog | 19 | Linux Foundation 官方公告：计划推出 Agent Name Service，为 AI agents 建 trusted identity infrastructure，信号是跨组织 agent 互认这件事正在从“各家自己做账号映射”走向独立身份层。 |
| [OpenAI Agents Python v0.17.7 release notes](https://github.com/openai/openai-agents-python/releases/tag/v0.17.7) | OpenAI | doc | 19 | 官方 release notes：新增可配置 websocket `max_size`、buffered Chat Completions tool-call streaming，并修复 sibling guardrail cancellation、ambiguous realtime multi-agent tool dispatch、sandbox sink buffering 等问题，信号是 agent runtime 正在补齐并发收尾、流式工具调用和沙箱 IO 的稳定性边界。 |
| [OpenAI Agents JS v0.12.0 release notes](https://github.com/openai/openai-agents-js/releases/tag/v0.12.0) | OpenAI | doc | 19 | 官方 release notes：修复 resolved tool approvals 被重复求值、guardrail failure 后 sibling 任务收尾、特殊 permission bits 解析与 realtime tool dispatch 歧义，说明 JS agent SDK 也在把审批状态机和并发 guardrail 清理做成硬边界。 |
| [Microsoft Agent Framework .NET 1.11.0 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.0) | Microsoft | doc | 19 | 官方 release notes：要求 file-access tools 在 read-only auto-approval 下也走显式审批，并把 looping、refreshable MCP auth headers、Foundry Hosting 对 MCP 的依赖与 durable worker hosting 进一步收敛到 harness/runtime 层，说明长流程 agent 的权限边界和协议基座正在继续下沉。 |
| [CrewAI 1.14.8a4 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.14.8a4) | CrewAI | doc | 19 | 官方 prerelease notes：在继续推进 conversational flows CLI 的同时，补上 skill archive symlink path traversal 修复与 declarative flow definition path 校验，说明 workflow DSL 与本地文件边界已经成为 agent runtime 的直接攻击面。 |
| [OpenAI research: How agents are transforming work](https://openai.com/index/how-agents-are-transforming-work) | OpenAI | blog | 19 | OpenAI 官方研究总结：agent 正在把使用场景从单轮问答推向更长、更复杂、跨角色的工作流，信号不是『聊天更顺』，而是任务边界、过程可见性和生产力衡量口径都在变化。 |
| [CrewAI 1.15.0 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.0) | CrewAI | doc | 19 | 官方 release notes：开始系统化追踪 conversational flow turn usage、统一 declarative flow loading，并把 conversational flows 贯通到 CLI/TUI，说明多智能体 workflow 已从『能跑』进入『可观测、可回放、可统一运维』阶段。 |
| [Retrofit, don't rebuild: Agentic overlays for transforming legacy enterprise services](https://aws.amazon.com/blogs/machine-learning/retrofit-dont-rebuild-agentic-overlays-for-transforming-legacy-enterprise-services/) | AWS | blog | 19 | AWS 官方技术实践：提出 agentic overlays，用薄包装层把传统 REST 服务转成 agent 可消费能力，核心不是重写遗留系统，而是把工具接口、权限边界与渐进迁移拆开。 |
| [Building agentic AI applications with a modern data mesh strategy on AWS](https://aws.amazon.com/blogs/machine-learning/building-agentic-ai-applications-with-a-modern-data-mesh-strategy-on-aws/) | AWS | blog | 19 | AWS 官方技术实践：把 governed, serverless data mesh 作为 production agentic AI 的数据底座，强调 catalog、IAM、Lake Formation、knowledge base 与 retrieval 层要一起设计，而不是让 agent 直连散落数据源。 |
| [Microsoft Agent Framework .NET 1.11.1 release notes](https://github.com/microsoft/agent-framework/releases/tag/dotnet-1.11.1) | Microsoft | doc | 19 | 官方 release notes：把 AgentSkillsProvider tools 改成默认 require approval，并补上 AOT-safe declarative workflow checkpointing 与版本升级后的 checkpoint resume 修复，信号是 runtime 的默认权限姿态和持久化兼容性正在被提升为一等边界。 |
| [CrewAI 1.15.1 release notes](https://github.com/crewAIInc/crewAI/releases/tag/1.15.1) | CrewAI | doc | 19 | 官方 release notes：稳定版开始要求显式 CrewAI project 定义、为生成项目自动初始化 Git，并修复 scraping fetches 的 SSRF redirect bypass，说明 coding/deploy agent 的项目边界与网络边界都在继续收紧。 |
| [Benchmarking AI Agents for Addressing Scientific Challenges Across Scales](https://arxiv.org/abs/2606.12736) | arXiv | paper | 19 | SciAgentArena 论文提出约 200 个带 stepwise verification 的交互式科学任务，结果显示 agent 在结构清晰的数据分析流程里更稳，但在自驱探索、原创洞见和开放式研究题上仍明显失稳，适合作为 deep research / science agent 的评测参照。 |
| [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) | anthropic.com | blog | rag-chunk, rag-hybrid, rag-contextual | Anthropic 官方：上下文化分块 + 向量与 BM25 混合 + 重排的实战配方，进阶 RAG 必读 |
| [Okapi BM25 - Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25) | en.wikipedia.org | doc | rag-hybrid | BM25 打分公式与 k1/b 参数的权威说明，对应本章 BM25Index |
| [Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://dl.acm.org/doi/10.1145/1571941.1572114) | dl.acm.org | paper | rag-hybrid | RRF 原始论文 (Cormack et al., SIGIR 2009)，混合检索融合法的来源 |
| [Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE)](https://arxiv.org/abs/2212.10496) | arxiv.org | paper | rag-query | HyDE 原始论文：用假设性文档的向量做检索 |
| [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) | arxiv.org | paper | rag-eval | RAG 评估指标 (faithfulness / context & answer relevance) 的代表性论文，本章三指标的来源 |
| [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511) | arxiv.org | paper | rag-agentic | 把检索、生成、批判做成可控循环的代表论文，对应本章 gated retrieve / grade / retry 思想 |
| [Corrective Retrieval Augmented Generation](https://arxiv.org/abs/2401.15884) | arxiv.org | paper | rag-agentic | CRAG 用检索评估触发纠错与补充检索，对应本章证据不足就改写重试的控制流 |
| [Cohere · Rerank documentation](https://docs.cohere.com/docs/rerank-overview) | docs.cohere.com | doc | rag-rerank | 生产级 rerank API 与 cross-encoder 精排的官方说明，对照本章 llmRerank |
| [pgvector — open-source vector similarity search for Postgres](https://github.com/pgvector/pgvector) | github.com | doc | rag-prod | 最常见的生产持久化向量库，迁移目标之一，对照本章 MemoryVectorStore 接口 |
| [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | owasp.org | doc | rag-security | LLM01 提示注入位列榜首；RAG 检索内容是典型的间接注入攻击面，本章三道防线的威胁模型来源 |
| [Prompt injection: What's the worst that can happen? (Simon Willison)](https://simonwillison.net/2023/Apr/14/worst-that-can-happen/) | simonwillison.net | blog | rag-security | 讲透『把不可信数据喂进 LLM』为何危险，对应本章『检索内容即不可信数据』 |
| [Faiss: A library for efficient similarity search (Meta Engineering)](https://engineering.fb.com/2017/03/29/data-infrastructure/faiss-a-library-for-efficient-similarity-search/) | engineering.fb.com | blog | rag-index | FAISS 官方工程博客，讲清暴力检索为何扛不住规模、IVF 等索引如何用分桶换速度，本章 IVF 直觉的来源 |
| [Efficient and robust approximate nearest neighbor search using HNSW graphs](https://arxiv.org/abs/1603.09320) | arxiv.org | paper | rag-index | HNSW 原始论文 (Malkov & Yashunin)：另一类主流 ANN 索引，efSearch 与本章 nprobe 同属『查多准 vs 查多快』旋钮 |
| [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) | arxiv.org | paper | rag-context | Liu 等 (2023)：实证模型对长上下文『首尾强、中间弱』的 U 形利用曲线，本章注意力重排的直接依据 |
| [LangChain · How to reorder retrieved results for long context](https://python.langchain.com/docs/how_to/long_context_reorder/) | python.langchain.com | doc | rag-context | 把最相关文档放到上下文首尾、次相关压中间的工程实现，正是本章 reorderForAttention 的现成对应 |
| [LangGraph.js · Low-level 概念（State / Nodes / Edges / Reducers）](https://langchain-ai.github.io/langgraphjs/concepts/low_level/) | langchain-ai.github.io | doc | lg-stategraph | LangGraph.js 官方底层概念：StateGraph、channel reducer、节点/边——本章手写图的权威参考 |
| [LangGraph.js · Workflows and Agents](https://langchain-ai.github.io/langgraphjs/tutorials/workflows/) | langchain-ai.github.io | doc | lg-stategraph | 从底层图到预制 agent 的官方教程，对照本章「createReactAgent 只是预制 StateGraph」 |
| [LangGraph.js · Map-reduce branches with Send](https://langchain-ai.github.io/langgraphjs/how-tos/map-reduce/) | langchain-ai.github.io | doc | lg-routing | 用 Send 从一条边动态扇出多个并行节点实例再 reduce 合并——本章图3 的官方对应 |
| [LangGraph.js · How to control graph recursion limit](https://langchain-ai.github.io/langgraphjs/how-tos/recursion-limit/) | langchain-ai.github.io | doc | lg-routing | recursionLimit 控制循环上限、超限抛 GraphRecursionError——本章循环安全阀的官方说明 |
| [LangGraph.js · Persistence（Checkpointer / thread / state history）](https://langchain-ai.github.io/langgraphjs/concepts/persistence/) | langchain-ai.github.io | doc | lg-checkpoint | 官方持久化概念：checkpointer 按 thread_id 存每个 super-step、getState/getStateHistory 取快照与时间线——本章的权威参考 |
| [LangGraph.js · How to view and update past graph state（time travel）](https://langchain-ai.github.io/langgraphjs/how-tos/time-travel/) | langchain-ai.github.io | doc | lg-checkpoint | 用 getStateHistory 回到过去某个 checkpoint、updateState 改写并从该点重放——本章时间旅行的官方对应 |
| [LangGraph.js · Human-in-the-loop（概念）](https://langchain-ai.github.io/langgraphjs/concepts/human_in_the_loop/) | langchain-ai.github.io | doc | lg-hitl | 官方 HITL 概念：interrupt 暂停、Command(resume) 续跑、审批/编辑/工具确认等模式——本章的权威参考 |
| [LangGraph.js · How to wait for user input using interrupt](https://langchain-ai.github.io/langgraphjs/how-tos/wait-user-input-functional/) | langchain-ai.github.io | doc | lg-hitl | 用 interrupt 暂停等用户输入、再用 Command({resume}) 续跑的官方 how-to，对应本章审批门 demo |
| [LangGraph.js · Multi-agent systems（概念）](https://langchain-ai.github.io/langgraphjs/concepts/multi_agent/) | langchain-ai.github.io | doc | lg-multiagent | 官方多 agent 拓扑总览：supervisor、network、hierarchical 等——本章 supervisor / parallel team 的权威参考 |
| [LangGraph.js · Agent supervisor（教程）](https://langchain-ai.github.io/langgraphjs/tutorials/multi_agent/agent_supervisor/) | langchain-ai.github.io | doc | lg-multiagent | 一个 supervisor 用条件边把任务派给多个 worker agent 的官方教程，对应本章图1 的中心化调度循环 |
| [LangChain v1 agents source](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/factory.py) | LangChain | doc | 21 | LangChain 官方源码入口：create_agent 如何组装模型、工具、middleware、structured output 与 agent runtime |
| [LangGraph StateGraph and Pregel runtime source](https://github.com/langchain-ai/langgraph/blob/main/libs/langgraph/langgraph/graph/state.py) | LangGraph | doc | 21 | LangGraph 官方源码入口：StateGraph 的 state schema、channel reducer、node、edge 与 compile |
| [LlamaIndex RetrieverQueryEngine source](https://github.com/run-llama/llama_index/blob/main/llama-index-core/llama_index/core/query_engine/retriever_query_engine.py) | LlamaIndex | doc | 21 | LlamaIndex 官方源码入口：retriever、node postprocessor、response synthesizer 组成 data-first RAG 查询链路 |
