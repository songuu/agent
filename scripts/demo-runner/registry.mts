import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTERS, type Chapter } from "../../knowledge-graph/data/graph.js";

export type DemoNeedsKey = "none" | "llm" | "embedding";

export interface RunnableDemo {
  id: string;
  title: string;
  dir: string;
  entry: string;
  realpath: string;
  needsKey: DemoNeedsKey;
}

export type DemoRegistry = Map<string, RunnableDemo>;

export function buildDemoRegistry(
  repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../.."),
  chapters: readonly Chapter[] = CHAPTERS,
): DemoRegistry {
  const rootRealpath = realpathSync(repoRoot);
  const registry: DemoRegistry = new Map();

  for (const chapter of chapters) {
    if (!chapter.demo) continue;
    if (chapter.demo.interactive || chapter.demo.needsServer) continue;

    const entry = chapter.demo.entry ?? `${chapter.dir}/index.ts`;
    const absoluteEntry = resolve(rootRealpath, entry);
    if (!existsSync(absoluteEntry)) {
      throw new Error(`Demo entry does not exist for ${chapter.id}: ${entry}`);
    }

    const entryRealpath = realpathSync(absoluteEntry);
    if (!isInsideRoot(rootRealpath, entryRealpath)) {
      throw new Error(`Demo entry escapes repo root for ${chapter.id}`);
    }
    if (!entryRealpath.endsWith(`${sep}index.ts`)) {
      throw new Error(`Demo entry must be an index.ts file for ${chapter.id}`);
    }

    registry.set(chapter.id, {
      id: chapter.id,
      title: chapter.title,
      dir: chapter.dir,
      entry,
      realpath: entryRealpath,
      needsKey: chapter.demo.needsKey ?? "llm",
    });
  }

  return registry;
}

export function getRunnableDemo(
  demoId: string,
  registry = buildDemoRegistry(),
): RunnableDemo | undefined {
  return registry.get(demoId);
}

function isInsideRoot(rootRealpath: string, entryRealpath: string): boolean {
  return entryRealpath === rootRealpath || entryRealpath.startsWith(rootRealpath + sep);
}
