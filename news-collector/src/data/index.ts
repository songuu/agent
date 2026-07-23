// Worker composition root 的唯一公开入口；同步编排可只依赖 ContentRepository。

export type {
  ContentRepository,
  ContentRepositoryProvider,
  ContentUpsertResult,
} from "./content-repository.ts";
export {
  CONTENT_TABLE_CONTRACTS,
  CONTENT_TABLE_NAMES,
  getContentTableContract,
  pickContentRow,
} from "./content-table-contracts.ts";
export type { ContentRow, ContentTableContract, ContentTableName } from "./content-table-contracts.ts";
export {
  createSupabaseContentRepository,
} from "./supabase-content-repository.ts";
export type { SupabaseContentRepositoryOptions } from "./supabase-content-repository.ts";
export {
  buildMySqlUpsertStatement,
  createMySqlContentRepository,
  createMysql2Executor,
} from "./mysql-content-repository.ts";
export type {
  MySqlContentRepositoryOptions,
  MySqlExecutionResult,
  MySqlExecutor,
  Mysql2ConnectionLike,
} from "./mysql-content-repository.ts";
export { loadContentRepositoryConfig } from "./repository-config.ts";
export type { ContentRepositoryConfig, MySqlConnectionConfig } from "./repository-config.ts";
export { MYSQL_CONTENT_SCHEMA_SQL } from "./mysql-schema.ts";
