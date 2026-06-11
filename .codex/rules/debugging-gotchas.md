# Debugging Gotchas

## 2026-06-10 nginx proxy_pass prefix for demo runner

When the browser base URL is `/agent-build/api/demo-runner` and client code appends `/api/config`, nginx must match `/agent-build/api/demo-runner/api/` before rewriting to upstream `/api/`.

Wrong:

```nginx
location /agent-build/api/demo-runner/ {
    proxy_pass http://127.0.0.1:5174/api/;
}
```

This maps `/agent-build/api/demo-runner/api/config` to upstream `/api/api/config`.

Right:

```nginx
location /agent-build/api/demo-runner/api/ {
    proxy_pass http://127.0.0.1:5174/api/;
}
```

## 2026-06-10 PM2 release switch must verify cwd and script path

After deploying `/opt/agent-build/releases/<stamp>` and switching `/opt/agent-build/current`, `pm2 startOrReload ecosystem.config.cjs --only agent-build-runner --update-env` can keep the old `script path` and `exec cwd`.

Use delete/start for this runner, then verify:

```bash
cd /opt/agent-build/current
pm2 delete agent-build-runner >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --only agent-build-runner --update-env
pm2 save
pm2 describe agent-build-runner
```

The `script path` and `exec cwd` must both point at the new release.

## 2026-06-10 pnpm approve-builds on fresh production release

Fresh server installs can fail with:

```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.21.5, esbuild@0.28.0
```

Approve only the required build package and rerun install:

```bash
cd /opt/agent-build/releases/<stamp>
pnpm approve-builds esbuild
pnpm install --frozen-lockfile
```

## 2026-06-10 SSH here-string quoting with remote bash

When PowerShell wraps a multiline remote script as `ssh host "bash -lc '$remote'"`, any single quote inside `$remote` closes the remote shell string. Example: `grep -E 'status|script path'` breaks into separate remote commands.

Use double quotes inside the remote script, or skip grep and inspect raw `pm2 describe` output.

## 2026-06-10 diagram cards need fit logic, not fixed empty panels

Zoomable Mermaid panels should not rely on `scale: 1` plus fixed `min-height`. Small diagrams then sit in the corner with a large empty background.

Use visible SVG bounds from `svg.getBBox()` first, then fall back to `viewBox` or rendered rect. Mermaid can emit a large `viewBox` with whitespace around a compact graph; fitting the whole `viewBox` forces the graph down to the minimum zoom (for example 35%). Compute initial fit scale against the visible bbox, offset by bbox `x/y`, center the transformed content, and use `ResizeObserver` to refit before user interaction. Reset should return to fit, not a hard-coded `100%`.

Generated SVG concept visuals should wrap labels with `<tspan>` instead of truncating with ellipsis. Ellipsis hides the problem while still causing clipped or ambiguous labels in narrow cards.

If users report "initial diagram is still too small", do not keep optimizing full-diagram fit. For wide Mermaid graphs, readable initial scale should win over complete overview. Use a readable floor such as `0.9`, align overflowed content to the left/top reading start, and let pan/zoom handle the rest.

If a Mermaid diagram is still unreadable at 135% or higher, inspect the SVG element itself. VitePress/global SVG rules can clamp the rendered `<svg>` to container width before the zoom transform runs, so the transform is only enlarging an already-shrunk drawing. Inside the zoom wrapper, restore the SVG to native `viewBox` pixel size and set `max-width: none`; then apply pan/zoom to that native vector surface.

## 2026-06-11 diagram zoom: getBoundingClientRect is polluted by the element's own transform

Symptom: zoomable Mermaid diagram opens offset — empty top-left, content pushed bottom-right and clipped. Root cause is NOT the fit math: `getDiagramBounds` derives a pixel scale from `svg.getBoundingClientRect()`, which **includes the element's current CSS transform** (`getBBox()` does not). Once `fit()` has applied `scale(S)`, the next measurement is inflated by S; and because `fit()` writes `surface.style.height`, the `ResizeObserver` re-enters `fit()`, compounding the error each round (non-idempotent loop).

Fix (all three): (1) reset transform before measuring — `const prev = el.style.transform; el.style.transform = "none"; const b = getDiagramBounds(el); el.style.transform = prev;`. (2) Make `fit` idempotent and guard the write — `if (surface.style.height !== nextHeight) surface.style.height = nextHeight;` so RO stops re-firing. (3) Guard non-finite bounds with the negated form `if (!(surfaceWidth > 0) || !(bounds.width > 0))` — `NaN <= 0` is false and slips past a plain `<= 0`, producing `transform: scale(NaN)`.

Related same-feature traps: overflow "drag for more" hints must be keyed to the **current pan offset** (right/bottom edge still hidden), not to total-size-vs-frame, or the cue lies once you drag to the end. A bare `pointerdown` must not set `hasUserTransform` (a plain click then permanently disables resize re-fit → re-clips on a later narrow); only set it after a real pointermove delta. JS that writes inline `surface.style.height` overrides the mobile `@media` height cap — make the viewport height cap responsive (`innerWidth <= 640 -> 320`).

## 2026-06-11 reversal: complete-overview (contain) now wins over readable-100%-floor

The 2026-06-10 rule above ("for wide Mermaid graphs, readable initial scale should win over complete overview ... readable floor 0.9, align to reading start, let pan/zoom handle the rest") was **reversed** on user instruction "需要尽可能多的显示内容". Initial fit is now `contain` (`scale = clamp(min(widthScale, heightScale), 0.5, 1.8)`) so the whole diagram is visible and centered; the legibility floor (`MIN_CONTAIN_SCALE = 0.5`) only kicks in for diagrams too large to fit legibly, which then overflow + show a fade cue + pan. Detail legibility is served by the toolbar zoom and a new **fullscreen overlay** (⤢ button → clones the SVG into a viewport-covering modal, `calculateContainedFit` down to 0.45), not by opening the inline panel at 100%. Lesson: "complete vs legible" is a product call set by the user's current ask — don't hard-code one; offer contain-to-see-all + zoom/fullscreen-for-detail.
