import { BM25Index } from "./bm25";

export interface ContextualChunk {
  id: string;
  text: string;
  documentTitle: string;
  sectionPath?: string;
}

export interface ContextualizedChunk extends ContextualChunk {
  contextualText: string;
}

export interface ContextualRetrievalComparison {
  query: string;
  rawTopIds: string[];
  contextualTopIds: string[];
  expectedId: string;
  rawHit: boolean;
  contextualHit: boolean;
}

export function contextualizeChunk(chunk: ContextualChunk): ContextualizedChunk {
  const section = chunk.sectionPath ? `；章节：${chunk.sectionPath}` : "";
  return {
    ...chunk,
    contextualText: `文档：${chunk.documentTitle}${section}\n片段：${chunk.text}`,
  };
}

export function contextualizeChunks(chunks: readonly ContextualChunk[]): ContextualizedChunk[] {
  return chunks.map(contextualizeChunk);
}

export function makeContextualRetrievalCorpus(): ContextualChunk[] {
  return [
    {
      id: "target-retention",
      documentTitle: "云笺数据生命周期与删除规则",
      sectionPath: "治理 > 生命周期",
      text: "超过 90 天未访问后转入冷存储，默认 365 天后永久删除；管理员可延长保留期。",
    },
    {
      id: "distractor-account",
      documentTitle: "账户设置",
      sectionPath: "个人资料 > 注销账号",
      text: "数据删除规则：删除账号后，头像和主题偏好会立即清空，昵称保留 7 天。",
    },
    {
      id: "distractor-export",
      documentTitle: "云笺导出任务说明",
      sectionPath: "导出 > 限制",
      text: "批量导出每天最多 50 万行，超过额度后会进入排队状态。",
    },
    {
      id: "distractor-security",
      documentTitle: "云笺安全白皮书",
      sectionPath: "加密 > 密钥",
      text: "端到端加密开启后，服务端不会保存用户明文密钥。",
    },
  ];
}

export function compareContextualRetrieval(
  query: string,
  chunks: readonly ContextualChunk[],
  expectedId: string,
  k = 1,
): ContextualRetrievalComparison {
  const rawIndex = new BM25Index();
  rawIndex.add(chunks.map((chunk) => ({ id: chunk.id, text: chunk.text })));
  const contextual = contextualizeChunks(chunks);
  const contextualIndex = new BM25Index();
  contextualIndex.add(contextual.map((chunk) => ({ id: chunk.id, text: chunk.contextualText })));

  const rawTopIds = rawIndex.search(query, k).map((hit) => hit.id);
  const contextualTopIds = contextualIndex.search(query, k).map((hit) => hit.id);
  return {
    query,
    rawTopIds,
    contextualTopIds,
    expectedId,
    rawHit: rawTopIds.includes(expectedId),
    contextualHit: contextualTopIds.includes(expectedId),
  };
}
