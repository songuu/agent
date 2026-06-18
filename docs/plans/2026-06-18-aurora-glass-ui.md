---
title: "Aurora Glass UI 升级"
type: sprint
status: completed
created: "2026-06-18"
updated: "2026-06-18"
checkpoints: 0
tasks_total: 6
tasks_completed: 6
tags: [sprint, ui, design-system, vitepress]
aliases: ["极光玻璃 UI"]
mode: "--auto + caveman + ultracode"

invariants:
  - "新增 transform/位移/drift 动画必须同步进 @media (prefers-reduced-motion: reduce) 关停列表"
  - "backdrop-filter/filter/transform 不得加到 position:fixed 覆盖层(.diagram-zoom-overlay/.selection-chat-drawer/.selection-chat-popover)的祖先元素（否则 containing block 漂移）"
  - "diagram-zoom 测量路径(.diagram-zoom-surface/.diagram-zoom-content)不得被祖先 filter/backdrop-filter 污染"
  - "浅色模式玻璃面板对比度可读（border + alpha 兜底）"
  - "site:build 通过 + dist 可 grep 到新 token/类"

invariant_tests:
  - ".vitepress/theme/reduced-motion.test.mts"
  - ".vitepress/theme/diagram-zoom.test.mts"

deferred: []
deadcode_until: []
---

# Aurora Glass UI 升级

## Phase 1: 需求分析（Think · CEO 视角）

**Scope**：把整站 VitePress UI 升级为「极光玻璃 Aurora Glass」设计语言——前沿 AI 产品观感，必须美观。统一作用于：
1. 设计 token 层（aurora 调色板 + 玻璃面 + 阴影/圆角刻度 + 暗/浅双主题）
2. 全站氛围背景（aurora mesh 渐变光晕，fixed 层）+ 玻璃导航栏 + focus 环
3. 首页 hero + feature 卡（玻璃卡 + frosted 按钮）
4. 自定义交互组件统一玻璃化（frontier 文章库 / notion 卡 / 术语表 / 面试题 / demo-runner / selection-chat / concept-visual / diagram-zoom）

**Non-scope**：不改信息架构/导航结构/文案；不改任何业务逻辑/数据流/TS 行为；不引入 Vue 组件（保持 vanilla TS + DefaultTheme）；不改 mermaid 图本身配色逻辑。

**Success**：
- 暗色惊艳、浅色克制可读；玻璃质感（半透明 + 模糊 + 描边高光 + 光晕阴影）贯穿全站
- 现有交互组件零功能回归；fixed 覆盖层仍锚定视口；diagram-zoom 定位不漂移
- reduced-motion 下所有 aurora/位移动画静止
- typecheck + site:build 全绿，dist 可验

**Risks**：见 frontmatter invariants（containing-block 漂移、测量污染、reduced-motion 镜像、浅色对比度）。

## Phase 2: 技术方案（Plan · 架构师视角）

### 入场扫描 - Invariants 继承
| 子系统 | 既有 invariant | 本 sprint 如何保持 |
|--------|----------------|--------------------|
| diagram-zoom | 测量前归零 transform；祖先不得污染 getBoundingClientRect | 玻璃/光晕只加在卡片与 toolbar/overlay-panel 自身，不加在 surface/content 祖先链 |
| reduced-motion | 加位移动画必须镜像关停 | 新 aurora drift keyframe 同步进 reduce 块 |
| fixed 覆盖层 | drawer/overlay/popover append 到 body，锚定视口 | 不给其祖先加 backdrop-filter/transform/filter |

### 入场扫描 - 集成路径
纯表现层（CSS-only），无新建 API/持久化/跨层链路。aurora 背景用 `body`/`:root` 级 fixed 伪元素（z-index:-1，在 canvas 之上、内容之下），SSR 安全、无 JS。

### 技术选型
- 现代 CSS：`color-mix()`（已用）、`oklch()`（@supports 兜底）、`backdrop-filter`（@supports 兜底）、`:has()`（已用）、分层 radial-gradient mesh。
- 新增 token：`--aurora-*`（光晕色）、`--glass-bg/-border/-blur/-shadow/-highlight`、`--elev-1/2/3`、`--radius-*`。`.dark` 覆盖提升饱和。
- 不改 HTML 结构：复用现有 class，组件容器换用 glass token 即继承。

### 任务拆解
| # | Task | 风险 | 验证 |
|---|------|------|------|
| T1 | 设计 token 层（aurora/glass/elevation/radii + .dark + aurora keyframe） | L2 | build |
| T2 | 全站 aurora 背景 + 玻璃导航 + focus 环 + 滚动条/选区 | L2 | build + containing-block 自查 |
| T3 | 首页 hero + feature 卡 + 按钮玻璃化 | L2 | build |
| T4 | 自定义组件统一玻璃化（frontier/notion/术语/面试/demo/selection-chat/concept/diagram-toolbar） | L2 | build + 逐组件类名核对 |
| T5 | reduced-motion 镜像补全 + 浅色对比度 pass + fixed/测量回归自查 | L3 | reduced-motion.test + diagram-zoom.test |
| T6 | Review workflow（design/a11y/reduced-motion/containing-block/build 多视角对抗）+ 修 P0/P1 | — | workflow + build + grep dist |

## Phase 3: 变更日志

全部改动落在单文件 `.vitepress/theme/custom.css`（无 TS/HTML 结构改动，无业务逻辑改动）。

- **T1 设计 token 层**：新增 `--aurora-1..4`（rgb + oklch @supports 兜底）、`--glass-bg/-bg-strong/-border/-hairline/-highlight/-blur/-blur-strong`、`--elev-1..3` + `--glow-brand`、`--radius-sm..xl/pill`；`.dark` 提升极光饱和度与玻璃底色；新增 `.glass-surface` 工具类（@supports 切换强/弱底色）。hero name/image 渐变升级为蓝→青→紫三段极光。
- **T2 全站氛围 + 导航**：`body::before` fixed z-index:-1 四点 radial-gradient 极光 mesh + `auroraDrift` 缓慢漂移；暗色叠暗角景深。`--vp-nav-bg-color` 改半透明 + `.VPNavBar/.VPLocalNav` backdrop-filter 玻璃导航。`:where(...)` 零特异性统一 focus 环、`::selection`、细滚动条。
- **T3 首页**：`.VPFeature` 玻璃卡（半透明+模糊+顶高光+悬浮辉光 translateY(-6px)），icon 渐变；hero brand/alt 按钮辉光 + alt 玻璃化。
- **T4 自定义组件玻璃化**：frontier 文章库外壳 + 卡片悬浮辉光；notion 卡（玻璃+辉光+translateY(-4px)）；术语表/面试题/demo-runner 容器玻璃化；selection-chat 抽屉(强模糊)/弹窗玻璃化；concept 画框玻璃化；diagram-zoom 工具栏玻璃化、overlay 遮罩 frost、panel 玻璃（**panel 不加 backdrop-filter**，避免与缩放几何交互）。
- **T5 不变量回归**：`auroraDrift` 镜像进 `@media (prefers-reduced-motion: reduce)`（`body::before { animation: none }`）；fixed 覆盖层 append 目标自查（全部 body 级，containing-block 安全）；diagram-zoom 测量路径未被祖先 filter 污染。

**验证**：
- `reduced-motion.test.mts` ✓ / `diagram-zoom.test.mts` ✓（精确 CSS 断言全保留）
- `pnpm site:build` ✓ build complete 39.47s
- dist grep：`--glass-bg`×19 / `--elev-3`×6 / `--radius-lg`×7 / `--aurora-3`×6 / `auroraDrift`×2 / `oklch`×9 / `backdrop-filter`×38 → 全部进 bundle

## Phase 4: 审查结果

多视角对抗复核 workflow（5 镜头并行 → 每条 P0/P1 对抗式核验）：confirmed 9 / rejected 1。

**关键结论：0 个 P0。containing-block 镜头 0 finding、reduced-motion 镜头 0 finding** → 最高危的 fixed 覆盖层锚定 / 减动镜像无回归（自查 + 对抗复核双印证）。

**真 P1（5，已修）：**
| ID | 问题 | 修复 |
|----|------|------|
| F4 | demo-runner badge 深文字在暗玻璃卡 ~2.3-2.8:1 | `.dark` 覆盖 ok/warn/bad → `#34d399/#fbbf24/#f87171`（≥5.4:1） |
| F5 | concept teal accent 暗色作文本 ~3.1:1 | 新增 `.dark .concept-visual` 提亮三强调色 |
| F6 | 日历选中格白字配 brand 蓝 暗/浅均 <4.5:1 | 选中底 `color-mix(accent 70%, #000)` → 白字 ≥5:1 |
| F7 | brand 作小字配 brand-soft 浅色 ~3.2:1（layer-tab/interview/glossary/notion badge） | 新增 `--brand-text`（浅 `#0b5cc4`/暗沿用亮品牌），5 处文本切换 |
| F9 | notion-card 逐项 backdrop-filter ×12-30 叠动画极光 → 逐帧重绘 jank（本 sprint 引入） | notion-card + concept-visual-art 去 backdrop-filter，保留半透明底+描边+高光 |

**降级 P2（cohesion，已做低风险高价值项）：**
- F8 注释 over-promise color-mix 兜底 → 改为「oklch guard，color-mix 视为基线」
- F1 死 token `--radius-xl` 删除；`--radius-sm` 通过 stat 面板接入
- F2 frontier 内嵌面板圆角 8px → 同心刻度（壳 16 / 面板 12 / stat 8）
- F3 hero/stat/status/calendar 改 `--glass-bg-soft` 轻玻璃 → 极光透出形成景深（timeline 阅读卡保持高不透明可读）

**拒绝（1）：** VPLocalNav 无 backdrop-filter 兜底 → 误报（VitePress 用独立 `--vp-local-nav-bg-color` 默认不透明，override 已 @supports gate，未支持时回落基线不透明底）。

**已记 deferred P2（低收益，未做）：** 全站 ~37 处零散圆角全量迁移到 token（验证者评「1-2px 不可感」）；concept amber 作文本在**浅色**~3.2:1（pre-existing，非本 sprint 引入）。

**最终验证：** reduced-motion.test ✓ / diagram-zoom.test ✓ / `pnpm site:build` ✓(46.5s) / dist grep：`--brand-text`×7、`--glass-bg-soft`×6、`#34d399`/`#5eead4` present、`--radius-xl`×0。

## Phase 5: 复利记录

status → completed。沉淀 3 条玻璃化 UI 经验入 memory（见 MEMORY.md）：
1. 玻璃化与 fixed 覆盖层的 containing-block 冲突（backdrop-filter/transform 不上 body-appended overlay 的祖先链）——扩展自 [[dom-transform-pollutes-measurement]]。
2. 逐项 backdrop-filter × 动画背景 = 逐帧重绘 jank；多实例元素用半透明底替代实时模糊。
3. 品牌强调色 ≠ 小字文本色（`#1e80ff` 浅色 ~3.6:1 不达 AA），需独立 `--brand-text` 深色 token。

**复利信号：** 本 sprint 的「设计系统单人内聚实现 + Phase 4 多视角对抗复核」组合有效——复核精准揪出 5 条对比度/性能 P1（含我自己引入的 notion 卡 jank），且确认 0 个 containing-block/减动回归。对纯 CSS 表现层 sprint，这是高 ROI 的 gate 配置。
