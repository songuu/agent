// 仅解析内容库选择与 MySQL 私有连接参数。
// 不在这里创建驱动/连接，避免 package 安装和基础设施选择渗透到业务代码。

export interface MySqlConnectionConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly ssl: boolean;
}

export type ContentRepositoryConfig =
  | { readonly driver: "supabase" }
  | { readonly driver: "mysql"; readonly mysql: MySqlConnectionConfig };

function required(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required env var for MySQL content repository: ${name}`);
  return value;
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 3306;
  if (!/^\d+$/.test(value)) throw new Error("CONTENT_MYSQL_PORT must be an integer between 1 and 65535");
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("CONTENT_MYSQL_PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseBoolean(value: string | undefined, name: string): boolean {
  if (value === undefined || value.trim() === "") return false;
  if (/^(1|true|yes|on)$/i.test(value)) return true;
  if (/^(0|false|no|off)$/i.test(value)) return false;
  throw new Error(`${name} must be true or false`);
}

function decodeUrlPart(value: string, name: string): string {
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded) throw new Error();
    return decoded;
  } catch {
    throw new Error(`CONTENT_MYSQL_URL is missing a valid ${name}.`);
  }
}

function fromMysqlUrl(value: string, ssl: boolean): MySqlConnectionConfig {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("CONTENT_MYSQL_URL must be a mysql:// URL with host, user, password, and database.");
  }
  if (
    parsed.protocol !== "mysql:" ||
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    !parsed.pathname ||
    parsed.pathname === "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("CONTENT_MYSQL_URL must be a mysql:// URL with host, user, password, and database.");
  }

  const database = decodeUrlPart(parsed.pathname.slice(1), "database");
  if (database.includes("/")) {
    throw new Error("CONTENT_MYSQL_URL must contain exactly one database path segment.");
  }
  return {
    host: parsed.hostname,
    port: parsePort(parsed.port),
    database,
    user: decodeUrlPart(parsed.username, "user"),
    password: decodeUrlPart(parsed.password, "password"),
    ssl,
  };
}

function parseMysqlConnection(source: NodeJS.ProcessEnv): MySqlConnectionConfig {
  const url = source.CONTENT_MYSQL_URL?.trim();
  const hasSplitConnectionValues = [
    "CONTENT_MYSQL_HOST",
    "CONTENT_MYSQL_PORT",
    "CONTENT_MYSQL_DATABASE",
    "CONTENT_MYSQL_USER",
    "CONTENT_MYSQL_PASSWORD",
  ].some((name) => source[name]?.trim());
  const ssl = parseBoolean(source.CONTENT_MYSQL_SSL, "CONTENT_MYSQL_SSL");

  if (url) {
    if (hasSplitConnectionValues) {
      throw new Error("Use either CONTENT_MYSQL_URL or CONTENT_MYSQL_HOST/PORT/DATABASE/USER/PASSWORD, not both.");
    }
    return fromMysqlUrl(url, ssl);
  }

  return {
    host: required(source, "CONTENT_MYSQL_HOST"),
    port: parsePort(source.CONTENT_MYSQL_PORT),
    database: required(source, "CONTENT_MYSQL_DATABASE"),
    user: required(source, "CONTENT_MYSQL_USER"),
    password: required(source, "CONTENT_MYSQL_PASSWORD"),
    ssl,
  };
}

/**
 * 未配置时保持现有 Supabase 行为；明确写 mysql 时绝不静默回退，防止误把生产写入旧库。
 * 可使用单一 CONTENT_MYSQL_URL，或使用分项私有字段；两种形式不能混用。
 * 密码只从服务端环境读取；不要使用 NEXT_PUBLIC_ 前缀或写入 VitePress runtime config。
 */
export function loadContentRepositoryConfig(
  source: NodeJS.ProcessEnv = process.env,
): ContentRepositoryConfig {
  const requested = source.CONTENT_REPOSITORY_DRIVER?.trim().toLowerCase();
  const hasMysqlSettings = [
    "CONTENT_MYSQL_URL",
    "CONTENT_MYSQL_HOST",
    "CONTENT_MYSQL_PORT",
    "CONTENT_MYSQL_DATABASE",
    "CONTENT_MYSQL_USER",
    "CONTENT_MYSQL_PASSWORD",
    "CONTENT_MYSQL_SSL",
  ].some((name) => source[name]?.trim());
  const driver = requested || (hasMysqlSettings ? "mysql" : "supabase");

  if (driver === "supabase") return { driver: "supabase" };
  if (driver !== "mysql") {
    throw new Error(`Unsupported CONTENT_REPOSITORY_DRIVER: ${requested}. Expected supabase or mysql.`);
  }
  return { driver: "mysql", mysql: parseMysqlConnection(source) };
}