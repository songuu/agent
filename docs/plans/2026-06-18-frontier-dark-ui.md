---
title: "前沿暗色优化（基底下沉 + 噪点 + 展示排版 + spotlight）"
type: sprint
status: completed
created: "2026-06-18"
updated: "2026-06-18"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, ui, design-system, vitepress, dark-mode]
aliases: ["前沿暗色 UI", "frontier dark"]
mode: "--auto + caveman + ultracode"
parent: "docs/plans/2026-06-18-aurora-glass-ui.md"

invariants:
  - "新增 transform/位移/drift 动画必须同步进 @media (prefers-reduced-motion: reduce) 关停列表"
  - "backdrop-filter/filter/transform 不得加到 position:fixed 覆盖层(.diagram-zoom-overlay/.selection-chat-drawer/.selection-chat-popover)的祖先元素；噪点 SVG 内部 filter 不算 DOM 祖先 filter，安全"
  - "diagram-zoom 测量路径(.diagram-zoom-surface/.diagram-zoom-content)不得被祖先 filter/backdrop-filter 污染；本 sprint 不碰 diagram-zoom CSS 区段"
  - "暗色基底下沉后所有文本仍达 WCAG AA（基底变深→对比只增不减，但需复核 text-2/muted 与玻璃软底叠加）"
  - "浅色模式保持克制（仅暗色下沉基底；噪点浅色 opacity≤0.025）"
  - "site:build 通过 + dist 可 grep 到新 token/层"

invariant_tests:
  - ".vitepress/theme/reduced-motion.test.mts"
  - ".vitepress/theme/diagram-zoom.test.mts"

deferred:
  - sprint: "下一轮"
    item: "全站 ~37 处零散圆角全量迁移到 --radius-* token（验证者评 1-2px 不可感）"
    deadline: "2026-08-01"
    reason: "低收益，非前沿暗色 scope"
  - sprint: "下一轮"
    item: "concept amber --concept-accent-2 作文本在浅色 ~3.2:1（pre-existing，非本/上 sprint 引入）"
    deadline: "2026-08-01"
    reason: "pre-existing a11y 债，需单独评估是否改 amber 色值"
deadcode_until: []
---

# 前沿暗色优化

> 续 [[2026-06-18-aurora-glass-ui]]。参考 darkmodedesign.com 收录的前沿暗色站
> （alike / ponder / qount / revone / seamless / forrm / ycode / backgrounds.supply / poly-block 等）。
> 这些站多为 Framer/JS SPA，逐站抓 CSS 无 ROI；按其确立的**模式语言**接地，而非逐站复刻。

## Phase 1: 需求分析（Think · CEO 视角）

**Scope**：在已落地的 Aurora Glass 基础上，补齐 2026 前沿暗色站的四项标志性观感，让「暗色尤其惊艳」更进一步：
1. **冷调近黑基底下沉**（仅 `.dark`）——VitePress 默认 #1b1b1f 灰黑 → 冷近黑 scale，极光 mesh / 玻璃面对比更强。
2. **胶片噪点纹理**——全站极淡静态颗粒，消塑料感、给渐变加质地（前沿站普遍做法）。
3. **展示级排版**——hero / h1 / h2 紧字距 + hero 标题暗色辉光（CJK 正文不收紧）。
4. **spotlight-lite 卡片**——feature 卡顶部居中径向辉光 hover 绽放（纯 CSS，无 JS 光标跟踪）。

**Non-scope**：不改信息架构/导航/文案；不改业务逻辑/数据流/TS；不引入 Vue；不碰 diagram-zoom CSS 区段；不改浅色基底色（仅暗色下沉）；不做 JS 光标 spotlight（需 JS，越界）。

**Success**：
- 暗色更惊艳（深基底 + 噪点 + 辉光），浅色仍克制可读
- 零功能回归；fixed 覆盖层仍锚视口；diagram-zoom 定位不漂移
- 深基底下全文本仍达 AA
- reduced-motion 下无新增动效违例；site:build 全绿、dist 可验

**Risks**：见 frontmatter invariants（深基底对比度复核、噪点层与 fixed 覆盖层 containing-block、CJK 字距、diagram-zoom 区段不碰）。

## Phase 2: 技术方案（Plan · 架构师视角）

### 入场扫描 - Invariants 继承（承自 aurora-glass-ui sprint）
| 子系统 | 既有 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| fixed 覆盖层 | drawer/overlay/popover append 到 body，锚视口；祖先不得加 filter/transform | 噪点放 `body::after` 伪元素（伪元素 filter 不存在，用 background-image；SVG 内部 turbulence 不是 DOM 祖先 filter）；不给 body/html 加 CSS filter |
| diagram-zoom | 测量前归零 transform；祖先不得污染 getBoundingClientRect | 本 sprint 完全不碰 diagram-zoom CSS；噪点在内容之下，不入其祖先链 filter |
| reduced-motion | 加位移/drift 动画必须镜像关停 | 噪点静态（无 animation）；spotlight 仅 hover 过渡（透明度/transform，非 animation），不新增 keyframe |
| 浅色对比度 | border + alpha 兜底可读 | 仅暗色下沉基底；噪点浅色 opacity≤0.025 |
| 品牌色作小字 | 用 --brand-text 深色 token | 不新增品牌色小字场景 |

### 入场扫描 - 集成路径
纯表现层（CSS-only，单文件 `.vitepress/theme/custom.css`），无新建 API/持久化/跨层链路。无 ❌ 断点。

### 入场扫描 - 债务清单
| 来源 | 议题 | 本 sprint 决策 | deadline |
|------|------|----------------|----------|
| aurora-glass sprint | ~37 处零散圆角迁移 token | ⏭ 推迟（低收益，见 frontmatter deferred） | 2026-08-01 |
| pre-existing | concept amber 作文本浅色 ~3.2:1 | ⏭ 推迟（需单独评估色值） | 2026-08-01 |

### 技术选型
- 近黑 scale：仅覆盖 `.dark` 的 `--vp-c-bg/-bg-alt/-bg-soft/-bg-elv/-bg-mute`，组件自动继承（多数组件已引用这些 token）。
- 噪点：内联 SVG `feTurbulence` data-URI 作 `body::after` background-image，静态重复 120px tile，暗 opacity 0.05 / 浅 0.022。
- 排版：`letter-spacing` 负值仅施于 hero/h1/h2 展示文本；hero 标题 `.dark` 下 `drop-shadow` 辉光。
- spotlight：`.VPFeature` 自身 `background-image` 顶部居中 radial，hover 提升 brand 浓度（gradient 同结构可过渡），无伪元素堆叠、自动随 border-radius 裁切。

### 任务拆解
| # | Task | 风险 | 验证 |
|---|------|------|------|
| T1 | 暗色基底下沉（冷近黑 `--vp-c-bg*` scale，仅 .dark） | L2 | build + 深基底文本对比度自查 |
| T2 | 胶片噪点纹理层（body::after 静态 SVG turbulence，暗强浅弱） | L2 | build + containing-block 自查（SVG 内 filter 不污染 DOM 祖先） |
| T3 | 展示级排版（hero/h1/h2 紧字距 + hero 暗色辉光） | L1 | build + CJK 不过紧自查 |
| T4 | spotlight-lite feature 卡（顶部 radial hover 绽放） | L2 | build + reduced-motion 自查（无新 keyframe） |
| T5 | 不变量回归 + 深基底对比度 pass + build + dist grep | L2 | reduced-motion.test + diagram-zoom.test + grep |
| T6 | 多视角对抗复核 workflow（design/a11y-contrast/containing-block/reduced-motion/perf）+ 修 P0/P1 | — | workflow + build + grep dist |

## Phase 3: 变更日志

全部改动落在单文件 `.vitepress/theme/custom.css`（无 TS/HTML/逻辑改动）。**注意：本仓库存在并行会话**（同时改 interview-clinic 分页 + news-collector），与本 sprint 正交（我改 token/hero/feature/背景区段，它改尾部组件区）；用唯一字符串锚点 Edit，每次失败即重读，互不覆盖。

- **T1 暗色基底下沉**：新增 `.dark` 块覆盖 `--vp-c-bg:#0a0c12 / -bg-alt:#06070d / -bg-soft:#10131c / -bg-elv:#151823 / -bg-mute:#1b1f2b`（冷调近黑，保持单调递增 lightness 序，层间对比关系不变 → 既有「卡on软底」分离仍成立）。仅 `.dark`，浅色不动。
- **T2 胶片噪点**：`body::after` fixed inset:0 z-index:-1 pointer-events:none，内联 SVG `feTurbulence`(fractalNoise baseFrequency .85 numOctaves 2) data-URI 作 background-image，120px tile 重复；浅 opacity .022 / 暗 .05。静态无 animation。SVG 内部 filter ≠ DOM 祖先 CSS filter，不改 body containing block。
- **T3 展示排版**：`.VPHero .name/.text` letter-spacing -0.02em、`.vp-doc h1` -0.015em、`.vp-doc h2` -0.01em（CJK 正文不收紧）；`.dark .VPHero .name .clip` drop-shadow 28px brand 30% 辉光（仅暗色，作用 hero 文本自身）。
- **T4 spotlight-lite**：`.VPFeature` 改 `background`→`background-color`（保留径向层不被 shorthand 清掉）+ `background-image` 顶部居中 radial(静止 brand 0% 全透明)；hover 提升 brand 16% 绽放（同结构 2 色标 gradient 可过渡）+ transition 增 background-image。无新 keyframe。

**验证**：
- `reduced-motion.test.mts` ✓（0.34s）/ `diagram-zoom.test.mts` ✓（0.48s，精确 CSS 断言全保留，本 sprint 未碰其区段）
- `pnpm site:build` ✓ build complete 22.29s
- dist grep：feTurbulence×2 / #0a0c12×1 / #06070d×1 / drop-shadow×47 / 130%×11 → 全部进 bundle

## Phase 4: 审查结果

后台 workflow（5 镜头并行 → 每条 finding 对抗式核验，27 agents / 1.49M tok / 10.7min）：
**total 22 findings → confirmed 0 / rejected 22。P0=P1=P2=0。**

| 镜头 | findings | 结论 |
|------|----------|------|
| containing-block | 7 | 全 NOT-A-DEFECT。body::after 不改 body containing block；**SVG 内部 feTurbulence/filter ≠ 作用于 DOM 祖先的 CSS filter**；drop-shadow 非任何 fixed 覆盖层祖先；root/body/html 无 filter/transform/backdrop-filter。fixed 覆盖层锚定**双印证无回归**（自查 + 对抗复核）。 |
| reduced-motion | 2 | 无新 animation/keyframe；VPFeature:hover translateY 系既有 transition（非本次新增），纯 hover transition 无需镜像。 |
| a11y-contrast | 3 | T1 单调递增 lightness 序保住层间对比；半透明软底叠近黑的次级文字仍 ≥AA；唯一 sub-AA（text-3/muted ~3.2:1）经 git HEAD 比对系 **pre-existing**（非 T1 引入/放大）。 |
| perf | 5 | T2 噪点（静态单层重复位图）+ T4 spotlight（单卡 hover 一次性 background-image 重绘）均可接受；T1 纯改色零成本。 |
| design-aesthetic | 5 | D1 代码块面分离（pre-existing 且本就不可感，token-on-bg 对比反升）/ D2 chip「翻转」（前提经亮度计算证伪）/ D3 timeline 透明描边（渲染不可达死态 + pre-existing）/ D4 hero 光晕色相（主观，finding 自降级）/ D5 分层（主观）。 |

**关键结论**：对抗核验做了真实 sRGB 亮度计算 + git HEAD 归属核查 + DOM 嵌套核查，把 22 条全部判掉——其中多条本就是镜头 agent 把「NOT-A-DEFECT 核验结论」当 finding 上报（prompt 形状副作用），verify 阶段正确过滤。最高危的 containing-block 不变量经独立复核确认 0 破坏。

**已记 deferred（pre-existing，非本 sprint 引入，见 frontmatter）**：text-3/muted 暗色 ~3.2:1；concept amber 作文本浅色 ~3.2:1；~37 处零散圆角迁移 token。

**最终验证**：reduced-motion.test ✓ / diagram-zoom.test ✓ / `pnpm site:build` ✓(22.29s) / dist grep：feTurbulence×2、#0a0c12×1、#06070d×1、drop-shadow×47、130%×11。

## Phase 5: 复利记录

status → completed。本 sprint 把 Aurora Glass 推进到 2026 前沿暗色观感，4 项改动（深基底/噪点/展示排版/spotlight）零 confirmed 缺陷。

沉淀（更新既有 memory `aurora-glass-ui-system.md`，不新建）：
1. **SVG 噪点 data-URI 内部的 feTurbulence/filter 不是作用于宿主元素的 CSS filter** → grain 放 `body::after { background-image: url(svg feTurbulence) }` 即便 body 内 append 了 fixed 覆盖层也 containing-block 安全。扩展玻璃化 pitfall #1。
2. **暗色基底下沉须保 bg/bg-alt/bg-soft/bg-elv/bg-mute 单调递增 lightness 序**——层间面分离靠 border/圆角 fill/shadow 而非 bg 间 ΔL*（默认主题相邻面 ΔL* 比 ~1.05 本就不可感），故压缩它不算回归；只要序不乱，「卡 on 软底」分离与文本对比都随基底变深只增不减。

**复利信号**：同一「单人内聚实现 + 5 镜头对抗复核」gate 在**续作 sprint** 上返回 0 confirmed（vs aurora-glass 首作 5 P1），佐证 token 化设计系统让增量改动低风险——所有新值走既有 token 通道、改动面可 grep 验证。对抗 verify 的「pre-existing 归属核查（git HEAD 比对）+ 真实亮度计算」是把审美/对比度 finding 去噪的关键，避免把 pre-existing 债算到本 sprint 头上。
