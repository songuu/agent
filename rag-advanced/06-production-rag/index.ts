/**
 * 进阶 RAG · 第 06 章 demo：生产化 RAG（过滤 / 持久化 / 增量 / 全链路）
 *
 * 演示什么：把前面几章的零散进阶能力，组装成一条「接近生产」的 RAG 链路：
 *   ① 入库：用 add() 灌入带 metadata.tenant（租户/权限标签）的语料；
 *   ② 持久化：store.toJSON() 写到 os.tmpdir() 临时文件，再 MemoryVectorStore.fromJSON() 读回；
 *   ③ 增量：upsert() 按 id 改写其中一条（只为变更项重新付费 embedding）；
 *   ④ 过滤检索：search(query, k, {filter}) 只在某个租户的文档里检索（权限隔离）；
 *   ⑤ 全链路：answerWithRag({retriever: asRetriever(store), rerank:true}) 出带引用的答案。
 *
 * WHY 这是「生产化」而不只是「能跑」：
 *   - 持久化：embedding 是要花钱的网络调用。把「算好的向量」存盘再载入，重启后不必重嵌，
 *     这是把 demo 变成可长期运行服务的第一步。fromJSON 只读 JSON，不会再调一次 embedding。
 *   - 增量 upsert：真实知识库天天在变，整库重嵌又慢又贵；按 id 只重嵌变更项才划算。
 *   - metadata 过滤：多租户 / 权限场景下，A 租户绝不能检索到 B 租户的资料。过滤是「先按
 *     元数据筛子集，再算相似度」，把安全边界放在检索层而不是寄希望于大模型「别说出来」。
 *   - rerank：先宽召回再用 LLM 精排，把最相关的片段顶到前面，引用更准、幻觉更少。
 *
 * 需要 key：是。embedding（add/upsert/search）默认走 OPENAI_API_KEY；生成与精排走 getLLM()。
 * 运行：npx tsx rag-advanced/06-production-rag/index.ts
 */
import { writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MemoryVectorStore,
  asRetriever,
  answerWithRag,
} from "../../src/shared/rag";
import { divider, logger, color } from "../../src/shared";

/**
 * 虚构语料：两个租户（A / B）各自的内部资料。
 * 数字/版本/价格均为「虚构」，刻意编造以凸显「私有知识、防幻觉」——这些内容公网上查不到，
 * 模型不可能「凭记忆」答对，只能依赖被检索到的片段。
 */
const CORPUS: { id: string; text: string; metadata: { tenant: string } }[] = [
  {
    id: "A-pricing",
    text: "（虚构）租户 A「云雀 CRM」企业版定价：每席位每月 188 元，年付 8 折；满 50 席位赠送专属客户成功经理。",
    metadata: { tenant: "A" },
  },
  {
    id: "A-sla",
    text: "（虚构）租户 A「云雀 CRM」SLA：核心接口可用性承诺 99.95%，故障 15 分钟内首次响应，超时按当月费用 5% 赔付。",
    metadata: { tenant: "A" },
  },
  {
    id: "A-onboarding",
    text: "（虚构）租户 A 新客上线周期约 3 个工作日，含数据迁移与字段映射；老系统导出需为 UTF-8 编码的 CSV。",
    metadata: { tenant: "A" },
  },
  {
    id: "B-pricing",
    text: "（虚构）租户 B「夜莺 ERP」标准版定价：每月 99 元封顶不限人数，但单据条数上限 2 万条/月，超出按 0.01 元/条计费。",
    metadata: { tenant: "B" },
  },
  {
    id: "B-sla",
    text: "（虚构）租户 B「夜莺 ERP」SLA：可用性承诺 99.5%，仅工作日 9:00-18:00 提供人工支持。",
    metadata: { tenant: "B" },
  },
];

async function main(): Promise<void> {
  divider("① 入库：带 metadata.tenant 的多租户语料");
  const store = new MemoryVectorStore();
  await store.add(CORPUS);
  logger.success(`已入库 ${store.size} 条文档（含 A/B 两个租户）。`);

  divider("② 持久化：toJSON → 临时文件 → fromJSON（不必重新付费 embedding）");
  // 把「已算好的向量」连同文本一起序列化为 JSON。
  const snapshot = store.toJSON();
  const snapshotPath = join(tmpdir(), "agent-build-rag-store.json");
  writeFileSync(snapshotPath, snapshot, "utf-8");
  logger.info(`已写盘：${color(snapshotPath, "gray")}（${snapshot.length} 字节）`);

  // fromJSON 只解析 JSON、重建内存结构，不会再触发任何 embedding 网络调用。
  const reloaded = MemoryVectorStore.fromJSON(readFileSync(snapshotPath, "utf-8"));
  logger.success(
    `从磁盘载回 ${reloaded.size} 条文档；后续都用这个「省钱副本」，重启不重嵌。`,
  );

  divider("③ 增量：upsert 按 id 改写一条（只为变更项重新付费）");
  // 模拟 A 租户调价：用相同 id 覆盖旧文档，store 内文档数不变（是更新而非新增）。
  await reloaded.upsert([
    {
      id: "A-pricing",
      text: "（虚构）租户 A「云雀 CRM」企业版【2025Q3 新价】：每席位每月 218 元，年付 75 折；满 30 席位即赠专属客户成功经理。",
      metadata: { tenant: "A" },
    },
  ]);
  logger.success(`upsert 完成；文档总数仍为 ${reloaded.size}（覆盖而非新增）。`);

  divider("④ 过滤检索：只在租户 A 的文档里检索（权限隔离）");
  const query = "企业版每个席位多少钱？满多少席位送客户成功经理？";
  const filteredHits = await reloaded.search(query, 3, {
    filter: (doc) => doc.metadata?.["tenant"] === "A",
  });
  logger.info(`查询：${color(query, "cyan")}`);
  for (const hit of filteredHits) {
    const tenant = String(hit.doc.metadata?.["tenant"] ?? "?");
    logger.info(
      `  ${color(`[${tenant}] ${hit.doc.id}`, "green")} score=${hit.score.toFixed(3)}`,
    );
  }
  // 安全断言：过滤后的命中里绝不应出现 B 租户的资料。
  const leaked = filteredHits.some((hit) => hit.doc.metadata?.["tenant"] !== "A");
  if (leaked) {
    logger.error("检索结果里混入了非 A 租户文档，过滤未生效！");
  } else {
    logger.success("过滤生效：命中全部来自租户 A，没有跨租户泄漏。");
  }

  divider("⑤ 全链路：answerWithRag（带精排，输出可溯源答案）");
  // asRetriever 把向量库适配成统一 Retriever；rerank:true 先宽召回再用 LLM 精排到 k 条。
  const result = await answerWithRag({
    query,
    retriever: asRetriever(reloaded),
    k: 2,
    recallK: 4,
    rerank: true,
    systemPreamble: "你是租户 A 的内部知识库助手，只回答租户 A 的问题。",
  });

  logger.success("答案（每条结论后带 [片段 N] 引用）：");
  console.log(color(result.answer, "green"));

  divider("本次注入生成的引用片段");
  result.contexts.forEach((chunk, idx) => {
    logger.info(
      `[片段 ${idx}] ${color(chunk.id, "cyan")} score=${chunk.score.toFixed(3)}`,
    );
    logger.info(`         ${chunk.text}`);
  });

  logger.info(
    color(
      `token 用量：输入 ${result.usage.inputTokens} / 输出 ${result.usage.outputTokens}`,
      "gray",
    ),
  );
  logger.success(
    "全链路跑通：入库 → 持久化 → 增量 → 过滤检索 → 精排 → 带引用生成。",
  );
}

main().catch((err) => {
  logger.error(`运行失败：${(err as Error).message}`);
  process.exitCode = 1;
});
