import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tokenFile = resolve(repoRoot, ".vitepress/cache/demo-runner.json");

rmSync(tokenFile, { force: true });
