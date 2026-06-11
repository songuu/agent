---
title: "Course visual polish for Mermaid and concept SVG blocks"
date: 2026-06-10
tags: [solution, frontend, visual-qa, vitepress]
related_instincts: []
aliases: ["Mermaid tiny diagram fix", "concept visual SVG overflow fix"]
---

# Course Visual Polish For Mermaid And Concept SVG Blocks

## Problem

Course pages showed two visual regressions after style changes: Mermaid diagrams rendered tiny in a large empty zoom panel, and generated concept SVG labels clipped inside the art card.

## Root Cause

The Mermaid zoom wrapper used a fixed `min-height` and initially fit against the whole SVG surface. Mermaid can emit a large `viewBox` with whitespace around a compact graph, so fitting the `viewBox` forced the visible graph down to the minimum zoom while leaving a large empty panel. Even after switching to visible bounds, wide graphs were still unreadable when the first render tried to show the complete graph. The final culprit was SVG pre-scaling: VitePress/global SVG rules could clamp the rendered `<svg>` to container width before the zoom transform ran, so the transform only enlarged an already-shrunk drawing. The concept SVG renderer used single-line `<text>` labels with ellipsis truncation, so long labels such as `Return tool result` could not fit inside fixed nodes.

## Solution

- Add initial fit logic in `.vitepress/theme/diagram-zoom.ts`: restore the Mermaid SVG to native `viewBox` pixel size, force `max-width: none` inside the zoom wrapper, measure visible SVG bounds with `getBBox()`, fall back to `viewBox` or rendered rect, compute a fit scale with padding, offset by bbox `x/y`, keep wide graphs at a readable initial floor (`0.9`), align overflowed graphs to the left/top reading start, reset to that readable fit, and refit on `ResizeObserver` until the user manually pans or zooms.
- Change `.vitepress/theme/custom.css` so `.diagram-zoom-surface` has responsive bounded height and no large fixed padding.
- Change `knowledge-graph/data/visuals.ts` so SVG labels render as `<tspan>` lines instead of truncated text.
- Add regression coverage in `.vitepress/theme/diagram-zoom.test.mts` and `knowledge-graph/data/visuals.test.mts`.

## Prevention

Visual cards that contain generated diagrams need tests for behavior-level invariants: compact Mermaid graphs should fit above 100% instead of clamping to the minimum zoom, wide graphs should start readable instead of showing a tiny overview, and generated concept SVG labels should render as non-truncated multi-line text.

## Related

- [[session-2026-06-10]] — production visual QA session
