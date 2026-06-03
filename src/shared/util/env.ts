/**
 * 环境变量加载与校验。
 *
 * WHY: 课程的每个示例都需要 API key。集中在这里加载 .env 并提供"取不到就报清晰错误"
 * 的辅助函数，避免每个 lesson 重复写 process.env 判空逻辑，也让初学者第一时间看到
 * "你少配了哪个 key、去哪里配"。
 */
import { config } from "dotenv";

// 副作用：把项目根目录 .env 的变量注入 process.env（只需调用一次，import 即生效）
config();

/** 取环境变量；没有则返回 fallback（可为 undefined）。 */
export function getEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

/** 取必需的环境变量；缺失则抛出带操作指引的错误（快速失败）。 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `缺少环境变量 ${key}。请复制 .env.example 为 .env 并填入你的 key（参考文件内注释）。`,
    );
  }
  return value;
}
