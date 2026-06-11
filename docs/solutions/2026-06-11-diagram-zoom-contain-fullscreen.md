---
title: "图表缩放：定位漂移修复 + contain 首屏 + 全屏弹层"
date: 2026-06-11
tags: [solution, diagram-zoom, vitepress, dom, no-vue]
related_instincts: [dom-transform-pollutes-measurement]
aliases: ["mermaid 图被裁", "图表位置不对", "diagram 全屏查看"]
---

# 图表缩放：定位漂移修复 + contain 首屏 + 全屏弹层

## Problem

课程页可缩放 Mermaid 图表（`.vitepress/theme/diagram-zoom.ts`）用户反馈两点：①「位置不对」——开屏左上一大片空白、内容挤到右下被裁；②「需要尽可能多的显示内容」——宽图开屏不全。硬约束：vanilla TS + DOM，**禁止 Vue**。

## Root Cause

1. **定位漂移**：`getDiagramBounds` 经 `svg.getBoundingClientRect()` 推导像素尺度，而该方法**把元素自身 CSS transform 算进去**（`getBBox()` 不会）。fit 一旦应用过 `scale(S)`，下一次测量被放大 S 倍；又因 fit 会写 `surface.style.height` → 触发 `ResizeObserver` 重新进入 fit，逐轮复合放大、定位漂移。非幂等循环。
2. **显示不全**：旧策略 `READABLE_INITIAL_SCALE`=0.9→1.0「宽图固定 100% 开屏、横向溢出靠拖」，与「尽可能多显示」直接冲突——宽图 100% 必然裁右侧。这条旧规则（见 debugging-gotchas 2026-06-10「readable initial scale should win」）本轮被**显式反转**为 contain。

## Solution

`.vitepress/theme/diagram-zoom.ts` + `custom.css` + `diagram-zoom.test.mts`：

- **测前归零 transform**：`const prev = el.style.transform; el.style.transform="none"; const b = getDiagramBounds(el); el.style.transform=prev;` 消污染。
- **幂等写回守门**：`if (surface.style.height !== nextHeight) surface.style.height = nextHeight;` 相同输入→相同输出，RO 第二次拿到同值不再 fire，收敛。
- **contain 首屏**：`scale = clamp(min(widthScale, heightScale), MIN_CONTAIN_SCALE=0.5, INITIAL_MAX_SCALE=1.8)`，整图可见、居中；面板高度自适应并按视口收窄（`viewportSurfaceHeightCap`，≤640px 压到 320 对齐移动端 @media）。
- **方向性溢出渐隐提示**（`has-overflow-x/y`）：按当前平移量判定「前方还有内容」，拖到尽头自动关、不谎报；pointer-events 透明不挡拖动。
- **全屏弹层**（替代不可行的 breakout）：工具栏「⤢ 全屏查看」→ 克隆 SVG 放进覆盖全视口的遮罩大面板，`calculateContainedFit` 在定宽高盒里 contain 到最大（下限 0.45、上限 2.5），独立 zoom/pan，Esc/遮罩/✕ 关闭，焦点陷阱 + 滚动锁 + 监听清理 + close 幂等守门。完全隔离于内联缩放，不竞态。
- **加固**：单纯点击不再永久锁 `hasUserTransform`（仅真正位移后锁，否则 resize 不再自动 fit）；NaN 用否定式比较 `!(w>0)` 走兜底（避免 `scale(NaN)`）；`document.fonts.ready` 后补一次 fit；新增 `transition` 镜像进 `prefers-reduced-motion`。

## Prevention

- 任何「测 DOM 几何来布局」的代码：先确认 `getBoundingClientRect` 是否被自身/祖先 transform 污染；要测「未变换尺寸」就先归零 transform 再测。fit 改尺寸又被 RO 回调重入时，务必让 fit 幂等。
- 视觉策略二选一（完整 vs 易读）由**用户当轮指令**定，别自己反复横跳；冲突时给「contain 看全 + zoom/全屏看细节」的组合，而不是单点取舍。
- 横向 breakout 在「正文列左贴侧栏、右贴固定 TOC」的 VitePress 布局里不可行（撞侧栏/TOC）；要「更大」用全屏弹层（仅动图表、零布局冲突），不要硬改列宽。
- 新增动画/`transition` 即使逃过 CSS-diff 守门也要镜像进 `prefers-reduced-motion`（见 [[reduced-motion-mirror-guard]]）。

## Verification

- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\diagram-zoom.test.mts`（含 contain/纵向溢出/纵向居中/`calculateContainedFit` 数值断言）
- `node node_modules\tsx\dist\cli.mjs .vitepress\theme\reduced-motion.test.mts`
- `pnpm typecheck` + 生产 `vitepress build`（base `/agent-build/`）
- 对抗式复核：contain workflow（3 视角逐条验真）+ UX 回归 + 弹层复核，confirmed findings 全部已修或显式记录原因
- 两次部署上线 https://songuu.top/agent-build（HTTPS 全 200、loop_scene=1；回滚备份 dist.bak.20260611162429 / 20260611164550）

## Related

- [[dom-transform-pollutes-measurement]] — 本能：测量被 transform 污染 + RO 重入复合的根因与三件套修法
- [[precommit-adversarial-review-catches-dom-races]] — DOM 单例/测量/竞态类提交前固定对抗式复核
- [[2026-06-10-course-visual-polish]] — 上一轮图表视觉打磨（被本轮 contain 策略反转）
