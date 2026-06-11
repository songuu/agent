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
