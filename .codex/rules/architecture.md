# Architecture Notes

## 2026-06-10 production demo runner

- Production demo execution runs as a PM2 service named `agent-build-runner` from `/opt/agent-build/current`.
- `/opt/agent-build/current` is a full release, not only static files; nginx serves static content from `/opt/agent-build/current/.vitepress/dist/`.
- Browser runner calls same-origin `/agent-build/api/demo-runner/api/*`; nginx rewrites that prefix to the local runner `/api/*`.
- Public runner access is not allowed. Nginx protects the runner API with `dm_session`, and the runner still validates Host, Origin when present, and `X-Demo-Runner: 1`.
- The raw runner listens only on `127.0.0.1:5174`; do not expose it directly or bind it to `0.0.0.0`.

## 2026-06-10 runner streaming UX

- Runner protocol supports a first-class `thinking` frame in addition to `stdout`, `stderr`, `done`, and `exit`.
- Child demos may emit runner-only thinking frames through stderr lines prefixed with `__DEMO_RUNNER_FRAME__`; normal terminal runs are unaffected because emission is gated by `DEMO_RUNNER_FRAME_PROTOCOL=1`.
- The production runner sets `DEMO_RUNNER_FRAME_PROTOCOL=1` for child processes and decodes those protocol lines before proxying NDJSON to the browser.
- Browser terminal writes are buffered to animation-frame batches before calling xterm, reducing UI stalls when LLM streams many small chunks.
- Provider reasoning output is only surfaced when the upstream API exposes fields such as `reasoning_content`, `reasoning`, or Anthropic `thinking_delta`; do not fabricate hidden chain-of-thought.

## 2026-06-10 course visual learning aids

- Course-level visual aids stay data-driven. Do not hand-edit 26 lesson Markdown files for repeated UI blocks.
- `knowledge-graph/data/visuals.ts` owns conceptual visuals plus per-chapter highlights; `knowledge-graph/data/graph.ts` owns external article/reference metadata.
- VitePress injects visual aids at build time after the first Mermaid learning map, keeping README content portable while the web version gets animation, colored emphasis, and references.
- Visual images are generated as inline SVG from `visuals.ts`; do not add external image files for repeated course explainers.
- Mermaid zoom/pan behavior lives in `.vitepress/theme/diagram-zoom.ts`, separate from Markdown content and from demo-runner code.
- `knowledge-graph/data/visuals.test.mts` is the guardrail: every chapter must have a Mermaid flowchart or mindmap, a Codex-drawn visual module, core/warning highlights, and at least one external reference.

## 2026-06-11 chapter selection chat

- Chapter-level live interactions reuse the existing demo-runner service and nginx prefix. Do not add a second production chat service unless the runner security model is deliberately retired.
- Browser code for selection chat must stay vanilla TypeScript + DOM API through `.vitepress/theme/selection-chat.ts`; keep the project no-Vue invariant for custom code.
- `/api/selection-chat` must stay behind the same Host, Origin, `X-Demo-Runner`, and optional token gate as `/api/run`.
- Selection chat streams `thinking`, `text`, `done`, and `error` frames over NDJSON. The UI may show upstream-provided thinking, but must not invent hidden chain-of-thought.
- Runner-side chat code should not static-import `src/shared/llm/index.js` from the runner tsconfig boundary; use a narrow runtime import to avoid pulling shared source into NodeNext runner compilation.
