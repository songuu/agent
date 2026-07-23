// 运行时组装：业务编排只拿 ContentRepository，不知道是 PostgREST 还是 MySQL。
//
// 连接池按一次收集任务创建和关闭，避免 cron 长驻进程在凭据轮换或网络抖动后
// 持有不可恢复的旧连接；MySQL 的具体驱动也被限制在这个组合根。

import type { SupabaseConfig } from "../config.ts";
import {
  createMySqlContentRepository,
  createMysql2Executor,
  createSupabaseContentRepository,
  type ContentRepository,
  type ContentRepositoryConfig,
} from "./index.ts";

export interface ContentRepositoryHandle {
  readonly repository: ContentRepository;
  close(): Promise<void>;
}

interface MysqlPoolLike {
  execute(statement: string, values?: unknown[]): Promise<readonly [unknown, unknown]>;
  end(): Promise<void>;
}

interface MysqlPromiseModule {
  createPool(options: {
    readonly host: string;
    readonly port: number;
    readonly database: string;
    readonly user: string;
    readonly password: string;
    readonly ssl?: Record<string, never>;
    readonly connectionLimit: number;
    readonly enableKeepAlive: boolean;
    readonly timezone: "Z";
  }): MysqlPoolLike;
}

/**
 * 打开一次 worker 写入所需的仓库。MySQL 不允许静默回退到 Supabase：
 * 配置了 mysql 就必须连 mysql，防止迁移期间把新数据写回旧库。
 */
export async function openContentRepositoryForWorkers(input: {
  readonly config: ContentRepositoryConfig;
  readonly supabase: SupabaseConfig | null;
}): Promise<ContentRepositoryHandle> {
  if (input.config.driver === "supabase") {
    if (!input.supabase) {
      throw new Error("Supabase content repository requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    return {
      repository: createSupabaseContentRepository({ config: input.supabase }),
      close: async () => undefined,
    };
  }

  const moduleName = "mysql2/promise";
  let mysql: MysqlPromiseModule;
  try {
    mysql = (await import(moduleName)) as unknown as MysqlPromiseModule;
  } catch (error) {
    throw new Error(
      `MySQL content repository requires mysql2: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const pool = mysql.createPool({
    ...input.config.mysql,
    ssl: input.config.mysql.ssl ? {} : undefined,
    connectionLimit: 5,
    enableKeepAlive: true,
    timezone: "Z",
  });
  return {
    repository: createMySqlContentRepository({
      executor: createMysql2Executor({
        execute: (statement, values) => pool.execute(statement, values ? [...values] : undefined),
      }),
    }),
    close: async () => pool.end(),
  };
}