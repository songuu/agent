// blocks→markdown 转换：包装 notion-to-md，暴露图片重托管 hook。
//
// notion-to-md 内部递归取子 block 并分页（传 pageId 即可），输出 GFM markdown。
// 图片默认会生成指向 Notion 临时 S3 URL 的 ![]()，1 小时后过期——所以这里暴露
// setCustomTransformer("image") 的注入口，由 assets.ts 把图片重托管成稳定 URL 再回写 markdown。

import { NotionToMarkdown } from "notion-to-md";
import type { Client } from "@notionhq/client";

/**
 * 图片 block 转换器：返回 markdown 串（如 `![alt](stableUrl)`）覆盖默认输出，
 * 返回 false 则回退 notion-to-md 默认渲染（会留下会过期的 URL，故生产路径必须提供）。
 * 参数用 unknown：notion-to-md 的 CustomTransformer 接受宽 block 联合类型，
 * 这里在实现内部自行窄化（见 assets.ts），避免深路径导入其内部类型。
 */
export type NotionImageTransformer = (block: unknown) => Promise<string | false>;

export interface ConvertOptions {
  readonly imageTransformer?: NotionImageTransformer;
}

/** 构造一个 NotionToMarkdown，按需挂上图片重托管 transformer。 */
export function createConverter(
  client: Client,
  options: ConvertOptions = {},
): NotionToMarkdown {
  const n2m = new NotionToMarkdown({ notionClient: client });
  if (options.imageTransformer) {
    n2m.setCustomTransformer("image", options.imageTransformer);
  }
  return n2m;
}

/** 取整页 blocks 并拼成 markdown 全文；空页返回空串。 */
export async function convertPageToMarkdown(
  converter: NotionToMarkdown,
  pageId: string,
): Promise<string> {
  const blocks = await converter.pageToMarkdown(pageId);
  const md = converter.toMarkdownString(blocks);
  return md.parent ?? "";
}
