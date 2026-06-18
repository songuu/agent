// 离线 fixtures 装置：把打包的 RSS/Atom 样本当作"假源"喂进真实管道。
// smoke、单测、seed 生成器三处共用，保证离线、确定、无 key/无网络可跑。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFeedString, type FeedResult } from "./rss.ts";
import type { NewsSource } from "./types.ts";

const FIXTURES_DIR = join(import.meta.dirname, "..", "fixtures");

export interface FixtureSource extends NewsSource {
  readonly fixtureFile: string;
}

export const FIXTURE_SOURCES: readonly FixtureSource[] = [
  {
    key: "fx-qbitai",
    name: "量子位",
    url: "https://www.qbitai.com/feed",
    kind: "cn-media",
    lang: "zh",
    enabled: true,
    fixtureFile: "qbitai-sample.xml",
  },
  {
    key: "fx-decoder",
    name: "The Decoder",
    url: "https://the-decoder.com/feed/",
    kind: "en-media",
    lang: "en",
    enabled: true,
    fixtureFile: "the-decoder-sample.xml",
  },
  {
    key: "fx-atom",
    name: "Vendor Engineering Blog",
    url: "https://example.com/feed",
    kind: "vendor-blog",
    lang: "en",
    enabled: true,
    fixtureFile: "atom-sample.xml",
  },
];

export function readFixture(file: string): string {
  return readFileSync(join(FIXTURES_DIR, file), "utf8");
}

/**
 * 离线 fetchFeedImpl：按 source.key 找对应 fixture 解析。
 * 与真实 fetchFeed 一样**永不抛错**——无 fixture 或解析失败都回 ok:false，
 * 便于测试单源故障隔离。
 */
export async function fixtureFetchFeed(source: NewsSource): Promise<FeedResult> {
  const fixture = FIXTURE_SOURCES.find((candidate) => candidate.key === source.key);
  if (!fixture) {
    return {
      source,
      ok: false,
      items: [],
      attempts: 1,
      error: `no fixture for ${source.key}`,
    };
  }
  try {
    const items = await parseFeedString(readFixture(fixture.fixtureFile));
    return { source, ok: true, items, attempts: 1 };
  } catch (error: unknown) {
    return {
      source,
      ok: false,
      items: [],
      attempts: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
