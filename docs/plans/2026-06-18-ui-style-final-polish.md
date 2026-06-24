---
title: "界面样式复查与移动端收口"
type: sprint
status: done
created: "2026-06-18"
updated: "2026-06-18"
parent: "docs/plans/2026-06-18-home-motion-ui.md"
checkpoints: 1
tasks_total: 4
tasks_completed: 4
tags: [sprint, ui, qa, mobile]
aliases: ["样式复查", "ui-final-polish"]

invariants:
  - "首页 hero 文案在 390px 移动端不得产生横向滚动或裁切"
  - "展示级文字不得使用负 letter-spacing"
  - "主 CTA 在暗色 hero 上必须有明确可读对比"
  - "移动端 CTA 组可换行，但默认 action padding 不得把按钮无谓挤散"

invariant_tests:
  - .vitepress/theme/home-style-regression.test.mts
  - .vitepress/theme/reduced-motion.test.mts
  - .vitepress/theme/diagram-zoom.test.mts
---

# 界面样式复查与移动端收口

## Phase 1: 复查结论

今天新增的 Aurora Glass / Frontier Dark / Home Motion 整体方向成立：暗色基底、玻璃卡、滚动动效、hover lift 和 hero 动效已经把站点从默认文档感拉到产品化展示感。

这轮继续复查时发现 3 个仍值得补的细节：

1. 首页移动端 hero 标题与 tagline 在普通 Chrome CLI 截图中出现右侧裁切风险。
2. 暗色 hero 的 CTA 文案对比偏弱，看起来像 disabled。
3. 展示标题存在负 letter-spacing，不符合当前前端约束，也会放大 CJK 混排的移动端风险。

## Phase 2: 实施

已补：

- `.VPHero .action .VPButton.brand` 增加明确渐变背景与白色文字，暗色 hero 主 CTA 不再像禁用态。
- `.VPHero .action .VPButton.alt` 和暗色 alt 状态增加明确文字颜色与半透明底色。
- hero/name/text/doc h1/h2 的负 letter-spacing 收敛为 `0`。
- 390px 移动端 hero 标题、tagline 增加 `calc(100vw - 48px)` 宽度约束、`overflow-wrap:anywhere`、`white-space:normal` 与断行兜底。
- 移动端 `.VPHero .action` 去掉默认 padding，三个 CTA 在 390px 宽度下能保持同一行。
- 新增 `.vitepress/theme/home-style-regression.test.mts`，锁住移动端 hero 宽度、断行、CTA padding 和负字距回归。

## Phase 3: 验证

命令验证：

- `npx tsx --test .vitepress/theme/home-style-regression.test.mts .vitepress/theme/reduced-motion.test.mts .vitepress/theme/diagram-zoom.test.mts` 通过。
- `npx tsc --noEmit` 通过。
- `git diff --check` 通过，仅有 Windows LF/CRLF 提示。
- `pnpm site:build` 通过，仅有既有 chunk size warning。

视觉验证：

- CDP 真实移动端 viewport：`innerWidth=390`，`docScrollWidth=390`，`bodyScrollWidth=390`。
- `.VPHero .text`：`width=342px`，`right=366`，两行显示，无裁切。
- `.VPHero .tagline`：`width=342px`，`right=366`，自然换行。
- 三个 CTA：同一行，最右 `right=345.625`，未越界。

## Phase 4: 后续可选优化

可后续单独做，不阻塞本轮：

- 把散落的大圆角继续迁移到 `--radius-*` token，降低主题维护成本。
- 拆分大 chunk 或调 `manualChunks`，处理 VitePress 构建的体积提示。
- 对 news / notion / capstone 专题页做一次同样的 CDP 移动端量测，找是否还有局部横向滚动。

