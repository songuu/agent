import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tokenFile = resolve(repoRoot, ".vitepress/cache/demo-runner.json");
const deadline = Date.now() + 5000;

while (Date.now() < deadline) {
  if (hasTokenFile(tokenFile)) process.exit(0);
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
}

console.error("Timed out waiting for .vitepress/cache/demo-runner.json");
process.exit(1);

function hasTokenFile(path) {
  if (!existsSync(path)) return false;
  try {
    const payload = JSON.parse(readFileSync(path, "utf8"));
    return typeof payload.token === "string" && payload.token.length > 0;
  } catch {
    return false;
  }
}
