export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertEvent {
  id: string;
  service: string;
  severity: AlertSeverity;
  metric: string;
  value: number;
  threshold: number;
  minutes: number;
}

export interface LogLine {
  service: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface RunbookStep {
  id: string;
  title: string;
  command: string;
  risk: "safe" | "needs-approval";
}

export interface Runbook {
  id: string;
  symptom: string;
  diagnosisHints: string[];
  steps: RunbookStep[];
}

export interface IncidentScenario {
  id: string;
  title: string;
  alerts: AlertEvent[];
  logs: LogLine[];
  runbooks: Runbook[];
}

export const CHECKOUT_INCIDENT: IncidentScenario = {
  id: "checkout-db-pool",
  title: "支付链路 5xx 激增",
  alerts: [
    {
      id: "a-001",
      service: "checkout-api",
      severity: "critical",
      metric: "5xx_rate",
      value: 0.19,
      threshold: 0.03,
      minutes: 12,
    },
    {
      id: "a-002",
      service: "checkout-api",
      severity: "critical",
      metric: "p95_latency_ms",
      value: 4200,
      threshold: 900,
      minutes: 10,
    },
    {
      id: "a-003",
      service: "payment-worker",
      severity: "warning",
      metric: "queue_depth",
      value: 1840,
      threshold: 300,
      minutes: 8,
    },
  ],
  logs: [
    { service: "checkout-api", level: "error", message: "SequelizeConnectionAcquireTimeoutError: database connection pool exhausted" },
    { service: "checkout-api", level: "error", message: "POST /checkout failed after retry: connection timeout" },
    { service: "payment-worker", level: "warn", message: "retry queue growing while checkout-api returns 503" },
    { service: "checkout-api", level: "info", message: "deploy sha 7f3c2 rolled out 18 minutes ago" },
    { service: "checkout-api", level: "warn", message: "pool max=10 while traffic is 3.4x baseline" },
  ],
  runbooks: [
    {
      id: "rb-db-pool",
      symptom: "database connection pool exhausted",
      diagnosisHints: ["pool exhausted", "connection timeout", "p95 latency", "queue growing"],
      steps: [
        { id: "db-1", title: "拉取数据库连接池与慢查询指标", command: "query metrics db_pool_active slow_queries", risk: "safe" },
        { id: "db-2", title: "临时提升 checkout-api 副本并打开连接池限流", command: "scale checkout-api +2; enable pool backpressure", risk: "needs-approval" },
        { id: "db-3", title: "暂停非关键批处理写入，保护支付链路", command: "pause payment-reconciliation-batch", risk: "needs-approval" },
      ],
    },
    {
      id: "rb-cache",
      symptom: "cache miss storm",
      diagnosisHints: ["cache miss", "redis", "stampede"],
      steps: [
        { id: "cache-1", title: "检查缓存命中率与热点 key", command: "query metrics redis_hit_rate hot_keys", risk: "safe" },
      ],
    },
  ],
};
