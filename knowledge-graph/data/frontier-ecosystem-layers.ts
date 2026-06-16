import type { FrontierEcosystemLayer } from "./graph";

export interface FrontierEcosystemLayerDefinition {
  id: FrontierEcosystemLayer;
  label: string;
  description: string;
}

export const FRONTIER_ECOSYSTEM_LAYERS: FrontierEcosystemLayerDefinition[] = [
  { id: "foundation", label: "基础综述", description: "综述、taxonomy、系统边界与概念地图" },
  { id: "model-platform", label: "模型与托管平台", description: "模型 API、托管工具、平台级 agent primitives" },
  { id: "protocol", label: "协议与互操作", description: "MCP、A2A、身份、生命周期与生态标准" },
  { id: "runtime", label: "编排 Runtime", description: "图、workflow、多 agent、human-in-the-loop runtime" },
  { id: "product-ui", label: "产品与交互", description: "Operator、deep research、coding agent、GUI/浏览器 agent" },
  { id: "data-memory", label: "数据与记忆", description: "文件检索、长期记忆、上下文工程与知识接入" },
  { id: "evaluation", label: "评测与基准", description: "Web/OS/tool/coding/research agent benchmark 与 eval 方法" },
  { id: "security-governance", label: "安全与治理", description: "授权、prompt injection、secret、审计与风险缓解" },
];
