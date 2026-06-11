const MIN_SCALE = 0.45;
const MAX_SCALE = 3;
const SCALE_STEP = 0.18;
const MAX_RENDER_ATTEMPTS = 30;
const INITIAL_FIT_PADDING = 28;
const MIN_SURFACE_HEIGHT = 138;
// 画布更高：密集思维导图（概念图谱 TB 布局）需要纵向空间，否则被压扁成糊。
const MAX_SURFACE_HEIGHT = 460;
// 小图放大上限提高：截图中 7 节点流程图原本卡在 135%、文字偏小，现可放到 180%。
const INITIAL_MAX_SCALE = 1.8;
// 宽图首屏可读下限提高到 100%：宽流程图开屏即原尺寸（横向可拖），不再被缩小读不清。
const READABLE_INITIAL_SCALE = 1.0;

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
  toolbar.append(zoomOutButton, resetButton, zoomInButton);

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

  const apply = () => {
    diagram.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    resetButton.textContent = `${Math.round(state.scale * 100)}%`;
  };

  const fitToSurface = (contentRect?: DOMRectReadOnly) => {
    fitDiagramToSurface(surface, diagram, state, contentRect);
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
    hasUserTransform = true;
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

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      const contentRect = entries[0]?.contentRect;
      if (!contentRect || hasUserTransform) return;
      fitToSurface(contentRect);
    });
    resizeObserver.observe(surface);
  }

  window.requestAnimationFrame(() => fitToSurface());
}

function normalizeDiagramSvgSize(diagram: HTMLElement): void {
  const svg = diagram.querySelector<SVGSVGElement>("svg");
  const viewBox = svg?.viewBox.baseVal;
  if (!svg || !viewBox || viewBox.width <= 0 || viewBox.height <= 0) return;

  svg.style.width = `${Math.ceil(viewBox.width)}px`;
  svg.style.height = `${Math.ceil(viewBox.height)}px`;
  svg.style.maxWidth = "none";
}

function fitDiagramToSurface(
  surface: HTMLElement,
  diagram: HTMLElement,
  state: ZoomState,
  contentRect?: DOMRectReadOnly,
): void {
  const surfaceWidth = contentRect?.width ?? surface.clientWidth;
  const bounds = getDiagramBounds(diagram);
  if (surfaceWidth <= 0 || bounds.width <= 0 || bounds.height <= 0) {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    return;
  }

  const fit = calculateDiagramFit({ surfaceWidth, bounds });
  surface.style.height = `${Math.round(fit.surfaceHeight)}px`;
  state.scale = fit.scale;
  state.x = fit.x;
  state.y = fit.y;
}

export function calculateDiagramFit(input: DiagramFitInput): DiagramFitResult {
  const availableWidth = Math.max(1, input.surfaceWidth - INITIAL_FIT_PADDING * 2);
  const widthScale = availableWidth / input.bounds.width;
  const fitScale = clamp(widthScale, MIN_SCALE, INITIAL_MAX_SCALE);
  const scale = widthScale < READABLE_INITIAL_SCALE ? READABLE_INITIAL_SCALE : fitScale;
  const preferredHeight = input.bounds.height * scale + INITIAL_FIT_PADDING * 2;
  const surfaceHeight = clamp(preferredHeight, MIN_SURFACE_HEIGHT, MAX_SURFACE_HEIGHT);

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
