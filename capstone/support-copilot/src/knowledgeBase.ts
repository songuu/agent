/**
 * 客服知识库（离线 RAG 检索）。
 *
 * 用 BM25 词法检索做「可溯源问答」的最小实现：把内置 FAQ 装进倒排索引，按问题检索 top-k，
 * 答案永远带「引用编号 → 文档来源」。选 BM25 而非向量是为了**离线确定、零 key 可回归**
 * （teaching demo 的 payoff 必须由构造保证）。真实项目把 retrieve() 换成向量/混合检索即可，
 * 上层「带引用作答」的契约一行不用动。
 */
import { BM25Index, type Bm25Hit } from "../../../src/shared/rag/bm25";

/** 一条知识库文档。 */
export interface KbDoc {
  id: string;
  /** 面向用户展示的来源标题（出现在「参考来源」里）。 */
  source: string;
  text: string;
}

/** 一次命中（检索片段 + 分数 + 引用序号）。 */
export interface KbHit {
  doc: KbDoc;
  score: number;
  /** 从 1 开始的引用编号，用于答案里的 [n] 标注。 */
  citation: number;
}

/** 内置 FAQ 语料：电商客服域，覆盖退款 / 物流 / 账户 / 发票四类高频问题。 */
export const SUPPORT_KB: readonly KbDoc[] = [
  { id: "kb-refund-window", source: "退款政策 · 7 天无理由", text: "签收后 7 天内可申请无理由退款，商品需保持完好。生鲜、定制类目不支持无理由退款。" },
  { id: "kb-refund-eta", source: "退款政策 · 到账时效", text: "退款审核通过后，原路退回，一般 1 到 3 个工作日到账，具体以银行或支付渠道为准。" },
  { id: "kb-refund-partial", source: "退款政策 · 部分退款", text: "已使用部分优惠或赠品的订单，退款金额按实付比例计算，赠品需一并退回或折价扣除。" },
  { id: "kb-shipping-eta", source: "物流 · 配送时效", text: "标准快递通常 2 到 4 天送达，偏远地区顺延。下单后可在订单详情查看物流单号与轨迹。" },
  { id: "kb-shipping-lost", source: "物流 · 包裹丢失", text: "若物流轨迹超过 5 天无更新，可联系客服发起丢件核查，核实后按补发或退款处理。" },
  { id: "kb-account-reset", source: "账户 · 密码重置", text: "忘记密码可在登录页点击找回密码，通过注册手机号或邮箱接收验证码后重设。" },
  { id: "kb-invoice", source: "发票 · 开具规则", text: "支持开具电子普通发票与增值税专用发票，订单完成后 30 天内可在发票中心申请。" },
];

/** 用 FAQ 语料建一个离线检索器。 */
export function buildKnowledgeBase(docs: readonly KbDoc[] = SUPPORT_KB): KnowledgeBase {
  return new KnowledgeBase(docs);
}

/**
 * 知识库检索器：BM25 索引 + 文档表。
 * retrieve() 返回带引用编号的命中，便于答案做 [n] 标注与「参考来源」清单。
 */
export class KnowledgeBase {
  private readonly index = new BM25Index();
  private readonly byId: ReadonlyMap<string, KbDoc>;

  constructor(private readonly docs: readonly KbDoc[]) {
    this.byId = new Map(docs.map((doc) => [doc.id, doc]));
    this.index.add(docs.map((doc) => ({ id: doc.id, text: `${doc.source} ${doc.text}` })));
  }

  /** 按 query 检索 top-k；分数 ≤ 0 的命中视为不相关被剔除（用于触发「拒答」）。 */
  retrieve(query: string, k = 3): KbHit[] {
    const hits: Bm25Hit[] = this.index.search(query, k);
    return hits
      .filter((hit) => hit.score > 0)
      .map((hit, i) => {
        const doc = this.byId.get(hit.id);
        if (!doc) throw new Error(`检索命中未知文档 id: ${hit.id}`);
        return { doc, score: hit.score, citation: i + 1 };
      });
  }
}
