export type LeadSignalType = "funding" | "hiring" | "tech-stack" | "pain" | "compliance";

export interface LeadSignal {
  type: LeadSignalType;
  text: string;
}

export interface LeadAccount {
  id: string;
  name: string;
  industry: "manufacturing" | "finance" | "education" | "retail";
  employees: number;
  region: string;
  signals: LeadSignal[];
  contactNote: string;
}

export const LEADS: LeadAccount[] = [
  {
    id: "lead-001",
    name: "北辰制造",
    industry: "manufacturing",
    employees: 1800,
    region: "华东",
    signals: [
      { type: "pain", text: "售后知识散落在 PDF、飞书和旧工单，客服平均响应 18 分钟。" },
      { type: "tech-stack", text: "已在内部使用 TypeScript、Postgres 和 Docker。" },
      { type: "hiring", text: "正在招聘 AI 应用工程师和知识库产品经理。" },
    ],
    contactNote: "公开招聘页留下 bd@beichen.example；不要在外呼话术里暴露私人手机号。",
  },
  {
    id: "lead-002",
    name: "海岭教育",
    industry: "education",
    employees: 420,
    region: "华南",
    signals: [
      { type: "pain", text: "老师反馈教案资料搜索慢，但数据规模较小。" },
      { type: "compliance", text: "涉及未成年人数据，需要严格权限隔离。" },
    ],
    contactNote: "校招页只有总机电话 13800001234。",
  },
  {
    id: "lead-003",
    name: "青石金融",
    industry: "finance",
    employees: 2600,
    region: "华北",
    signals: [
      { type: "compliance", text: "采购要求私有化部署与审计留痕。" },
      { type: "pain", text: "投研报告检索与引用核验成本高。" },
      { type: "funding", text: "新设智能投研专项预算。" },
    ],
    contactNote: "官网仅提供 contact@qingshi.example。",
  },
];
