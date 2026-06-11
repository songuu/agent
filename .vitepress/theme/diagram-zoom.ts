const MIN_SCALE = 0.45;
const MAX_SCALE = 3;
const SCALE_STEP = 0.18;
const MAX_RENDER_ATTEMPTS = 30;
const INITIAL_FIT_PADDING = 28;
const MIN_SURFACE_HEIGHT = 160;
// 画布更高：宽图按宽度 contain 后纵向有余量也能装下整图，密集思维导图（概念图谱 TB
// 布局）同样需要这块纵向预算，否则被压扁成糊。
const MAX_SURFACE_HEIGHT = 520;
// 小图放大上限：7 节点流程图原本卡在 135%、文字偏小，现可放到 180%。
const INITIAL_MAX_SCALE = 1.8;
// contain 下限：首屏优先「整图可见」，按宽高两轴拟合；只有超宽图缩到这个下限以下才
// 改为横向溢出（再小文字成糊），用户可用工具栏放大看细节。
const MIN_CONTAIN_SCALE = 0.5;
// 全屏弹层：盒子很大，下限放到 MIN_SCALE（优先「整图都装下」），上限 2.5 让小图也能铺满。
const OVERLAY_MIN_SCALE = MIN_SCALE;
const OVERLAY_MAX_SCALE = 2.5;
const SVG_BOUNDS_PADDING = 8;

interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

interface DiagramBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramFitInput {
  surfaceWidth: number;
  bounds: DiagramBounds;
  // 纵向预算上限。默认 MAX_SURFACE_HEIGHT；DOM 侧按视口高度收窄，避免面板在小屏吃掉整页。
  maxSurfaceHeight?: number;
}

export interface DiagramFitResult extends ZoomState {
  surfaceHeight: number;
}

const initializedDiagrams = new WeakSet<HTMLElement>();
const pendingDiagrams = new WeakMap<HTMLElement, number>();

if (typeof window !== "undefined") {
  installZoomableDiagrams();
}

function installZoomableDiagrams(): void {
  scanMermaidDiagrams();
  const observer = new MutationObserver(() => scanMermaidDiagrams());
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanMermaidDiagrams(): void {
  document.querySelectorAll<HTMLElement>(".vp-doc .mermaid").forEach((diagram) => {
    if (initializedDiagrams.has(diagram)) return;
    if (!diagram.querySelector("svg")) {
      scheduleDiagramRetry(diagram);
      return;
    }
    initializedDiagrams.add(diagram);
    upgradeMermaidDiagram(diagram);
  });
}

function scheduleDiagramRetry(diagram: HTMLElement): void {
  const attempts = pendingDiagrams.get(diagram) ?? 0;
  if (attempts >= MAX_RENDER_ATTEMPTS) return;
  pendingDiagrams.set(diagram, attempts + 1);
  window.setTimeout(() => {
    if (initializedDiagrams.has(diagram) || !diagram.isConnected) return;
    if (!diagram.querySelector("svg")) {
      scheduleDiagramRetry(diagram);
      return;
    }
    initializedDiagrams.add(diagram);
    upgradeMermaidDiagram(diagram);
  }, 120);
}

function upgradeMermaidDiagram(diagram: HTMLElement): void {
  const viewport = document.createElement("div");
  viewport.className = "diagram-zoom-viewport";
  viewport.setAttribute("tabindex", "0");
  viewport.setAttribute("role", "group");
  viewport.setAttribute("aria-label", "可缩放流程图或思维导图");

  const surface = document.createElement("div");
  surface.className = "diagram-zoom-surface";

  const toolbar = document.createElement("div");
  toolbar.className = "diagram-zoom-toolbar";
  toolbar.setAttribute("aria-label", "图表缩放控制");

  const zoomOutButton = createZoomButton("−", "缩小");
  const resetButton = createZoomButton("100%", "重置缩放");
  const zoomInButton = createZoomButton("+", "放大");
  const expandButton = createZoomButton("⤢", "全屏查看");
  expandButton.classList.add("diagram-zoom-expand");
  expandButton.addEventListener("click", () => openDiagramOverlay(diagram));
  toolbar.append(zoomOutButton, resetButton, zoomInButton, expandButton);

  const parent = diagram.parentElement;
  if (!parent) return;
  parent.insertBefore(viewport, diagram);
  viewport.append(toolbar, surface);
  surface.append(diagram);
  diagram.classList.add("diagram-zoom-content");
  normalizeDiagramSvgSize(diagram);

  const state: ZoomState = { scale: 1, x: 0, y: 0 };
  let dragStart: { pointerId: number; clientX: number; clientY: number; x: number; y: number } | undefined;
  let hasUserTransform = false;
  // 最近一次测得的（未变换）内容边界，供 apply() 实时判定是否溢出、刷新「可拖动看更多」提示。
  let lastBounds: DiagramBounds | undefined;

  const apply = () => {
    diagram.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    resetButton.textContent = `${Math.round(state.scale * 100)}%`;
    updateOverflowAffordance(surface, state, lastBounds);
  };

  const fitToSurface = (contentRect?: DOMRectReadOnly) => {
    lastBounds = fitDiagramToSurface(surface, diagram, state, contentRect);
    apply();
  };

  const zoomBy = (delta: number, origin?: { x: number; y: number }) => {
    const nextScale = clamp(state.scale + delta, MIN_SCALE, MAX_SCALE);
    if (nextScale === state.scale) return;

    if (origin) {
      const scaleRatio = nextScale / state.scale;
      state.x = origin.x - (origin.x - state.x) * scaleRatio;
      state.y = origin.y - (origin.y - state.y) * scaleRatio;
    }
    state.scale = nextScale;
    hasUserTransform = true;
    apply();
  };

  zoomOutButton.addEventListener("click", () => zoomBy(-SCALE_STEP));
  zoomInButton.addEventListener("click", () => zoomBy(SCALE_STEP));
  resetButton.addEventListener("click", () => {
    hasUserTransform = false;
    fitToSurface();
  });

  surface.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = surface.getBoundingClientRect();
    zoomBy(event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, { passive: false });

  surface.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStart = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: state.x,
      y: state.y,
    };
    // 不在按下时就锁定 hasUserTransform：单纯点击（无拖动）不应永久关停自动 fit，
    // 否则之后窗口/容器变窄不会重新 fit，又退回「位置不对、右侧被裁」。仅在真正产生位移后锁定。
    surface.setPointerCapture(event.pointerId);
    surface.classList.add("is-dragging");
  });

  surface.addEventListener("pointermove", (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    const nextX = dragStart.x + event.clientX - dragStart.clientX;
    const nextY = dragStart.y + event.clientY - dragStart.clientY;
    if (nextX !== state.x || nextY !== state.y) hasUserTransform = true;
    state.x = nextX;
    state.y = nextY;
    apply();
  });

  const stopDrag = (event: PointerEvent) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStart = undefined;
    surface.releasePointerCapture(event.pointerId);
    surface.classList.remove("is-dragging");
  };
  surface.addEventListener("pointerup", stopDrag);
  surface.addEventListener("pointercancel", stopDrag);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      const contentRect = entries[0]?.contentRect;
      if (!contentRect || hasUserTransform) return;
      fitToSurface(contentRect);
    });
    resizeObserver.observe(surface);
  }

  window.requestAnimationFrame(() => fitToSurface());

  // 字体晚加载会改变 Mermaid 文本测量 → 首屏 fit 用的是换字体前的 bbox。字体就绪后补一次 fit，
  // 修正首次冷加载（未缓存字体）下的初始缩放/居中偏差；用户已交互过则尊重其视图、不打断。
  document.fonts?.ready.then(() => {
    if (!hasUserTransform) fitToSurface();
  }).catch(() => undefined);
}

// 全屏弹层：克隆图表 SVG，放进覆盖全视口的遮罩里 contain-fit 到最大，自带独立 zoom/pan。
// 完全隔离于内联缩放（不共享状态、不竞态）；模态短生命周期，无需 RO/字体补 fit/溢出提示。
function openDiagramOverlay(sourceDiagram: HTMLElement): void {
  const sourceSvg = sourceDiagram.querySelector<SVGSVGElement>("svg");
  if (!sourceSvg) return;

  const previouslyFocused = document.activeElement as HTMLElement | null;
  const previousBodyOverflow = document.body.style.overflow;

  const overlay = document.createElement("div");
  overlay.className = "diagram-zoom-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "图表全屏查看");

  const panel = document.createElement("div");
  panel.className = "diagram-zoom-overlay-panel";

  const toolbar = document.createElement("div");
  toolbar.className = "diagram-zoom-toolbar";
  toolbar.setAttribute("aria-label", "图表缩放控制");
  const zoomOutButton = createZoomButton("−", "缩小");
  const resetButton = createZoomButton("100%", "重置缩放");
  const zoomInButton = createZoomButton("+", "放大");
  const closeButton = createZoomButton("✕", "关闭全屏");
  closeButton.classList.add("diagram-zoom-close");
  toolbar.append(zoomOutButton, resetButton, zoomInButton, closeButton);

  const surface = document.createElement("div");
  surface.className = "diagram-zoom-surface diagram-zoom-overlay-surface";

  const content = document.createElement("div");
  content.className = "diagram-zoom-content";
  // 深克隆 SVG 不改 id：原图仍在 DOM 且排在前面，克隆体的 url(#id)/marker 按「文档顺序首个匹配」
  // 解析到原图的 defs（箭头/渐变正常渲染）。模态短生命周期、原图不会被移除，故安全；不引入易漏的
  // id 重写（漏改一处反而会让箭头消失，比现状更糟）。
  content.append(sourceSvg.cloneNode(true));
  surface.append(content);
  panel.append(toolbar, surface);
  overlay.append(panel);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  normalizeDiagramSvgSize(content);

  const state: ZoomState = { scale: 1, x: 0, y: 0 };
  let dragStart: { pointerId: number; clientX: number; clientY: number; x: number; y: number } | undefined;

  const apply = () => {
    content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    resetButton.textContent = `${Math.round(state.scale * 100)}%`;
  };

  const fit = () => {
    const previousTransform = content.style.transform;
    content.style.transform = "none";
    const bounds = getDiagramBounds(content);
    content.style.transform = previousTransform;
    if (!(surface.clientWidth > 0) || !(surface.clientHeight > 0) || !(bounds.width > 0) || !(bounds.height > 0)) {
      state.scale = 1;
      state.x = 0;
      state.y = 0;
      apply();
      return;
    }
    const fitted = calculateContainedFit({
      surfaceWidth: surface.clientWidth,
      surfaceHeight: surface.clientHeight,
      bounds,
      minScale: OVERLAY_MIN_SCALE,
      maxScale: OVERLAY_MAX_SCALE,
    });
    state.scale = fitted.scale;
    state.x = fitted.x;
    state.y = fitted.y;
    apply();
  };

  const zoomBy = (delta: number, origin?: { x: number; y: number }) => {
    const nextScale = clamp(state.scale + delta, MIN_SCALE, MAX_SCALE);
    if (nextScale === state.scale) return;
    if (origin) {
      const scaleRatio = nextScale / state.scale;
      state.x = origin.x - (origin.x - state.x) * scaleRatio;
      state.y = origin.y - (origin.y - state.y) * scaleRatio;
    }
    state.scale = nextScale;
    apply();
  };

  const focusables = [zoomOutButton, resetButton, zoomInButton, closeButton];
  const onResize = () => fit();
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    // 焦点陷阱：aria-modal 模态下 Tab 不能跑到被遮罩盖住的背景元素上。
    if (event.key !== "Tab") return;
    const active = document.activeElement as HTMLButtonElement | null;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!active || !focusables.includes(active)) {
      event.preventDefault();
      first.focus();
    }
  };
  const close = () => {
    if (!overlay.isConnected) return;
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = previousBodyOverflow;
    overlay.remove();
    previouslyFocused?.focus?.();
  };

  zoomOutButton.addEventListener("click", () => zoomBy(-SCALE_STEP));
  zoomInButton.addEventListener("click", () => zoomBy(SCALE_STEP));
  resetButton.addEventListener("click", () => fit());
  closeButton.addEventListener("click", close);
  // 点击遮罩空白处（非面板）关闭。
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  surface.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = surface.getBoundingClientRect();
    zoomBy(event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, { passive: false });

  surface.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStart = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: state.x, y: state.y };
    surface.setPointerCapture(event.pointerId);
    surface.classList.add("is-dragging");
  });
  surface.addEventListener("pointermove", (event) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    state.x = dragStart.x + event.clientX - dragStart.clientX;
    state.y = dragStart.y + event.clientY - dragStart.clientY;
    apply();
  });
  const stopDrag = (event: PointerEvent) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStart = undefined;
    surface.releasePointerCapture(event.pointerId);
    surface.classList.remove("is-dragging");
  };
  surface.addEventListener("pointerup", stopDrag);
  surface.addEventListener("pointercancel", stopDrag);

  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKeydown);
  closeButton.focus();
  window.requestAnimationFrame(fit);
}

function normalizeDiagramSvgSize(diagram: HTMLElement): void {
  const svg = diagram.querySelector<SVGSVGElement>("svg");
  const viewBox = svg?.viewBox.baseVal;
  if (!svg || !viewBox || viewBox.width <= 0 || viewBox.height <= 0) return;

  const bounds = expandSvgViewBoxToVisibleBounds(svg, viewBox) ?? {
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height,
  };

  svg.style.width = `${Math.ceil(bounds.width)}px`;
  svg.style.height = `${Math.ceil(bounds.height)}px`;
  svg.style.maxWidth = "none";
  svg.style.overflow = "hidden";
}

function expandSvgViewBoxToVisibleBounds(
  svg: SVGSVGElement,
  viewBox: SVGAnimatedRect["baseVal"],
): DiagramBounds | undefined {
  try {
    const box = svg.getBBox();
    if (!box || box.width <= 0 || box.height <= 0) return undefined;

    const minX = Math.min(viewBox.x, box.x) - SVG_BOUNDS_PADDING;
    const minY = Math.min(viewBox.y, box.y) - SVG_BOUNDS_PADDING;
    const maxX = Math.max(viewBox.x + viewBox.width, box.x + box.width) + SVG_BOUNDS_PADDING;
    const maxY = Math.max(viewBox.y + viewBox.height, box.y + box.height) + SVG_BOUNDS_PADDING;
    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    const viewBoxValue = [
      roundSvgNumber(bounds.x),
      roundSvgNumber(bounds.y),
      roundSvgNumber(bounds.width),
      roundSvgNumber(bounds.height),
    ].join(" ");
    svg.setAttribute("viewBox", viewBoxValue);
    return bounds;
  } catch {
    // Mermaid may finish SVG insertion before layout exposes a bbox; viewBox fallback still renders.
    return undefined;
  }
}

function roundSvgNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function fitDiagramToSurface(
  surface: HTMLElement,
  diagram: HTMLElement,
  state: ZoomState,
  contentRect?: DOMRectReadOnly,
): DiagramBounds | undefined {
  const surfaceWidth = contentRect?.width ?? surface.clientWidth;
  // 测量前把 transform 归零再读边界。getDiagramBounds 经由 getBoundingClientRect
  // 推导像素尺度，会被当前 CSS transform 污染；fit 又会改 surface.style.height 触发
  // ResizeObserver 重新进入本函数，若带着上一轮 scale 测量就会逐轮复合放大、定位漂移。
  const previousTransform = diagram.style.transform;
  diagram.style.transform = "none";
  const bounds = getDiagramBounds(diagram);
  diagram.style.transform = previousTransform;

  // 用否定式比较，让 NaN 也走兜底分支（NaN <= 0 为 false，会漏过普通 <= 判断 → scale(NaN)）。
  if (!(surfaceWidth > 0) || !(bounds.width > 0) || !(bounds.height > 0)) {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    return undefined;
  }

  const fit = calculateDiagramFit({ surfaceWidth, bounds, maxSurfaceHeight: viewportSurfaceHeightCap() });
  // 仅在高度真正变化时写回，避免无谓地再触发一次 ResizeObserver。
  const nextHeight = `${Math.round(fit.surfaceHeight)}px`;
  if (surface.style.height !== nextHeight) {
    surface.style.height = nextHeight;
  }
  state.scale = fit.scale;
  state.x = fit.x;
  state.y = fit.y;
  return bounds;
}

// 右/下边缘「前方还有内容被裁」时加渐隐提示，告诉用户「可拖动看更多」，避免静默裁切。
// 按当前平移量判定（不是只看总尺寸是否超框）：拖到尽头即关闭，绝不误报「这边还有」。
// pointer-events 透明，不影响拖动。起始端（左/上）不另设提示——少给线索胜过给错线索。
function updateOverflowAffordance(
  surface: HTMLElement,
  state: ZoomState,
  bounds: DiagramBounds | undefined,
): void {
  if (!bounds) {
    surface.classList.remove("has-overflow-x", "has-overflow-y");
    return;
  }
  const rightHidden = state.x + (bounds.x + bounds.width) * state.scale - surface.clientWidth > 1;
  const bottomHidden = state.y + (bounds.y + bounds.height) * state.scale - surface.clientHeight > 1;
  surface.classList.toggle("has-overflow-x", rightHidden);
  surface.classList.toggle("has-overflow-y", bottomHidden);
}

export function calculateDiagramFit(input: DiagramFitInput): DiagramFitResult {
  const maxSurfaceHeight = clamp(
    input.maxSurfaceHeight ?? MAX_SURFACE_HEIGHT,
    MIN_SURFACE_HEIGHT,
    MAX_SURFACE_HEIGHT,
  );
  const availableWidth = Math.max(1, input.surfaceWidth - INITIAL_FIT_PADDING * 2);
  // 纵向预算用（视口收窄后的）最高画布算，让「按宽度缩放后纵向也装得下」成为可能。
  const availableHeight = Math.max(1, maxSurfaceHeight - INITIAL_FIT_PADDING * 2);

  const widthScale = availableWidth / input.bounds.width;
  const heightScale = availableHeight / input.bounds.height;
  // 首屏「尽可能多显示内容」= 同时拟合宽高（contain），整图可见、不裁切。
  // 下限 MIN_CONTAIN_SCALE：超宽图缩到下限以下宁可横向溢出（可拖）也不缩成糊；
  // 上限 INITIAL_MAX_SCALE：小图适度放大但不过度。
  const containScale = Math.min(widthScale, heightScale);
  const scale = clamp(containScale, MIN_CONTAIN_SCALE, INITIAL_MAX_SCALE);

  // 画布按缩放后内容高度自适应（夹在 MIN/maxSurfaceHeight 间），短宽图不留大片空白、高图给足纵向。
  const preferredHeight = input.bounds.height * scale + INITIAL_FIT_PADDING * 2;
  const surfaceHeight = clamp(preferredHeight, MIN_SURFACE_HEIGHT, maxSurfaceHeight);

  return {
    scale,
    surfaceHeight,
    x: calculateAxisOffset(input.surfaceWidth, input.bounds.x, input.bounds.width, scale),
    y: calculateAxisOffset(surfaceHeight, input.bounds.y, input.bounds.height, scale),
  };
}

function calculateAxisOffset(containerSize: number, boundsStart: number, boundsSize: number, scale: number): number {
  const scaledSize = boundsSize * scale;
  const availableSize = Math.max(1, containerSize - INITIAL_FIT_PADDING * 2);
  const visibleStart = scaledSize <= availableSize ? (containerSize - scaledSize) / 2 : INITIAL_FIT_PADDING;
  return visibleStart - boundsStart * scale;
}

export interface ContainedFitInput {
  surfaceWidth: number;
  surfaceHeight: number;
  bounds: DiagramBounds;
  minScale: number;
  maxScale: number;
}

// 在「定宽高」的盒子里 contain（全屏弹层用）：盒子尺寸固定，只算缩放 + 居中偏移，不反算画布高度。
export function calculateContainedFit(input: ContainedFitInput): ZoomState {
  const availableWidth = Math.max(1, input.surfaceWidth - INITIAL_FIT_PADDING * 2);
  const availableHeight = Math.max(1, input.surfaceHeight - INITIAL_FIT_PADDING * 2);
  if (!(input.bounds.width > 0) || !(input.bounds.height > 0)) {
    return { scale: 1, x: 0, y: 0 };
  }
  const containScale = Math.min(availableWidth / input.bounds.width, availableHeight / input.bounds.height);
  const scale = clamp(containScale, input.minScale, input.maxScale);
  return {
    scale,
    x: calculateAxisOffset(input.surfaceWidth, input.bounds.x, input.bounds.width, scale),
    y: calculateAxisOffset(input.surfaceHeight, input.bounds.y, input.bounds.height, scale),
  };
}

function getDiagramBounds(diagram: HTMLElement): DiagramBounds {
  const svg = diagram.querySelector<SVGSVGElement>("svg");
  const svgRect = svg?.getBoundingClientRect();
  const viewBox = svg?.viewBox.baseVal;

  const visibleBounds = getVisibleSvgBounds(svg, svgRect, viewBox);
  if (visibleBounds) return visibleBounds;

  if (svgRect && svgRect.width > 0 && svgRect.height > 0) {
    return { x: 0, y: 0, width: svgRect.width, height: svgRect.height };
  }

  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
  }

  const rect = diagram.getBoundingClientRect();
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}

function getVisibleSvgBounds(
  svg: SVGSVGElement | null,
  svgRect: DOMRect | undefined,
  viewBox: SVGAnimatedRect["baseVal"] | undefined,
): DiagramBounds | undefined {
  if (!svg || !svgRect || !viewBox || viewBox.width <= 0 || viewBox.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return undefined;
  }

  try {
    const box = svg.getBBox();
    if (!box || box.width <= 0 || box.height <= 0) return undefined;

    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;
    return {
      x: (box.x - viewBox.x) * scaleX,
      y: (box.y - viewBox.y) * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY,
    };
  } catch {
    // Some browsers throw before SVG layout finishes; fall back to the element box.
    return undefined;
  }
}

function createZoomButton(text: string, label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "diagram-zoom-button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.title = label;
  return button;
}

// 面板纵向上限按视口收窄：小屏不让图表面板吃掉整页。桌面回到 MAX_SURFACE_HEIGHT。
// 窄视口（≤640px，与移动端 @media 断点一致）压到 320，和移动端 CSS 的 clamp(...,320px) 对齐，
// 否则 JS 写的内联高度会盖掉移动端 CSS 上限、面板在手机上吃掉整屏。
function viewportSurfaceHeightCap(): number {
  if (typeof window === "undefined" || !window.innerHeight) return MAX_SURFACE_HEIGHT;
  const ceiling = window.innerWidth && window.innerWidth <= 640 ? 320 : MAX_SURFACE_HEIGHT;
  return clamp(Math.round(window.innerHeight * 0.72), MIN_SURFACE_HEIGHT, ceiling);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
