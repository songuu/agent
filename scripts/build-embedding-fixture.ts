/**
 * 生成离线 embedding fixture：把各 RAG demo 的语料/查询用【真 API】算出真向量，落盘提交。
 *
 * 用法（需要一次性可用的 OPENAI_API_KEY）：
 *     npm run rag:build-fixture
 *
 * 跑完后 src/shared/rag/fixtures/embeddings.json 就含了所有登记文本的真向量，
 * 此后 rag-advanced 的向量 demo 可全离线运行（不再每次联网付费 embedding）。
 *
 * 数据源：rag-advanced/embedding-fixture-registry.ts（单一来源，新增 demo 时在那里登记）。
 */
import { writeFileSync } from "node:fs";
import { allFixtureTexts } from "../rag-advanced/embedding-fixture-registry";
import { embedViaApi } from "../src/shared/llm/embeddings";
import { fixtureKey, embeddingFixturePath } from "../src/shared/llm/embeddingFixture";
import { getEnv } from "../src/shared/util/env";
import { logger } from "../src/shared";

/** 单次 embeddings 请求的文本条数上限（保守取值，避免单请求过大）。 */
const BATCH_SIZE = 64;

async function main(): Promise<void> {
  const model = getEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")!;
  const texts = allFixtureTexts();
  if (texts.length === 0) {
    logger.info("registry 为空，没有需要预计算的文本。");
    return;
  }

  logger.info(`用模型 ${model} 预计算 ${texts.length} 条文本的真向量（分批 ${BATCH_SIZE}）…`);
  const vectors: Record<string, number[]> = {};
  let dim = 0;
  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const embedded = await embedViaApi(batch); // 真 API；缺 key 会在此快速失败并给指引
    batch.forEach((text, i) => {
      const vector = embedded[i]!;
      vectors[fixtureKey(model, text)] = vector;
      if (dim === 0) dim = vector.length;
    });
    logger.info(`  已完成 ${Math.min(start + BATCH_SIZE, texts.length)}/${texts.length}`);
  }

  const path = embeddingFixturePath();
  writeFileSync(path, `${JSON.stringify({ model, dim, vectors })}\n`, "utf8");
  logger.success(`已写入 fixture：${path}（${Object.keys(vectors).length} 向量，维度 ${dim}）`);
  logger.info("现在可以把相关章节的 demo.needsKey 改为 \"none\"，离线即可运行。");
}

main().catch((err) => {
  logger.error(`生成 fixture 失败：${(err as Error).message}`);
  process.exitCode = 1;
});
