# Architecture Notes

## 2026-06-15 multi-cloud static-site deploy

- Static-site deploys should stay provider-profile driven over SSH (`aliyun`, `volcengine`, `tencent`, `custom`) instead of using cloud SDKs. Rationale: the deploy target is an already-provisioned Linux/Nginx VM, and avoiding AK/SK in scripts keeps the public repo safe.
- `scripts/deploy.ps1` remains the private, gitignored production entrypoint. It may contain real hosts and paths; public docs should not duplicate those values outside private runbooks.
- Keep one deploy flow across clouds: local gates, production base build, dist base self-check, tar/scp upload, remote stage extraction, old dist backup, atomic swap, then remote HTTP(S) verification.
- New cloud migrations should only need `-Provider`, `-DeployHost`, optional `-WebRoot`, `-Domain`, and `-BasePath` changes after the VM/Nginx/TLS prerequisites are prepared.

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

## 2026-06-11 diagram zoom: contain-fit + fullscreen overlay (no column breakout)

- Initial diagram view uses a `contain` fit (`calculateDiagramFit`: fit both axes, centered, legibility floor 0.5) — chosen over the earlier "open at 100% and overflow" policy after the user asked to maximize visible content. Detail reading is delegated to toolbar zoom/pan and the fullscreen overlay, not to a large inline default scale.
- "Make wide diagrams bigger" is solved by a **fullscreen overlay** (`openDiagramOverlay`: clone the SVG into a viewport-covering modal with isolated zoom/pan, `calculateContainedFit`), NOT by breaking the diagram out of the prose column. Rationale: VitePress 1.6.4 default layout puts the content column left-aligned against the sidebar (`.content { margin: 0 }` at ≥1280px) with the TOC `.aside` fixed immediately to its right — there is no safe horizontal whitespace beside the column, so any negative-margin breakout overlaps the sidebar or TOC. The overlay touches only the diagram and has zero layout-collision surface.
- The overlay is deliberately isolated from the inline zoom code (separate state, no shared `ResizeObserver`) to avoid DOM state races; it is a short-lived modal with explicit listener teardown, scroll lock, focus trap, and an idempotent `close()`.
- `calculateDiagramFit` (inline, auto-resizes panel height) and `calculateContainedFit` (overlay, fixed box) are both pure and unit-tested in `diagram-zoom.test.mts`; keep fit math pure/deterministic and keep DOM glue thin.

## 2026-06-17 Notion article full-text sync subsystem

- Notion articles get a **dedicated `notion_articles` table + dedicated VitePress `/notion` list & detail pages**, NOT merged into the existing frontier/news tables. Rationale: different lifecycle (full-text body + rehosted images + Notion-native publish state) and a different RLS surface; merging would entangle two schemas and two render paths.
- Default Notion sync scope is a **single configured folder/root page** (`kind:"folder"`, `rootPageId`) and recursive `child_page` traversal; do not search/sync the whole workspace. Database source remains optional compatibility, not the default product requirement.
- Backend lives in `news-collector/src/notion/` as a **sibling pipeline** to news collection — parallel, not entangled. It **mirrors the existing `collectOnce()` injectable pattern**: pure orchestration `syncNotion(deps)` takes all side effects as injected deps (Notion client, Supabase fetch, Storage uploader, clock), so cron (`notion:cron`) and manual CLI (`notion:sync`) share ONE entry function and the whole pipeline is offline-testable with fakes.
- Incremental sync is **stateless**: the watermark is `max(notion_last_edited_time)` read back from the table, query sorts `last_edited_time ascending`, filter uses `on_or_after` (inclusive). Boundary pages get re-fetched and absorbed by idempotent `on_conflict=notion_page_id` upsert. No local cursor file to corrupt.
- **Image rehosting is mandatory**: Notion S3 URLs expire ~1h, so every image is downloaded and uploaded to a Supabase Storage public bucket under a stable key `{pageId}/{blockId}-{srcHash}` (srcHash strips the querystring so re-syncs reuse the same object). A per-page manifest in `metadata.assets` lets later runs skip already-rehosted images. Storage uploads use the REST API with service_role.
- Security boundary (same model as the rest of the site): RLS lets anon read only `status = 'published'`; service_role does all writes; `NOTION_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` live only in `.env` and must never reach the front-end bundle (only the anon key may). DDL runs through SQL Editor or direct PG (`SUPABASE_DB_URL`), never PostgREST; for this sprint direct PG execution verified `notion_articles` exists with 19 columns and RLS enabled.
- Front-end stays **no-Vue**: `notion-markdown.ts` renders body markdown with markdown-it (`html:false` escapes raw HTML) + DOMPurify (client-only dynamic import, SSR-safe) for layered XSS defense; pure `notion-articles-filter.ts` is unit-tested offline and the list/detail DOM glue stays thin. The list page fetches only card columns (not `body_markdown`); detail fetches a single row by `?slug=`.
- Type safety for these out-of-include dirs is enforced by `tsconfig.notion.json` + `pnpm notion:typecheck` (see debugging-gotchas 2026-06-17), because the root `typecheck` does not cover `news-collector/` or `.vitepress/`.

## 2026-06-24 multi-cloud container migration layer

- Multi-cloud migration should use a container layer as the portability boundary, while keeping the existing SSH/static deploy as the rollback path until every public route has proven container parity.
- The current cloud stack is route-based: root home (`/`), `agent-build` (`/agent-build/` plus runner/news jobs), `aicrew` (`/aicrew/`), and `deploy-management` (`/pipeline/`, `/api/`, `/oapi/`, auth routes).
- `agent-build` owns the first implemented container slice: `Dockerfile` targets `site` and `app-runtime`, `deploy/compose/agent-build.compose.yml` runs site/runner/jobs, and `scripts/deploy-container.ps1` deploys via registry or SSH image transfer.
- Host Nginx remains the TLS/auth/route fan-out layer during migration. Compose services should bind to loopback host ports.
- Container cutover must be route-by-route: start container on a new local port, health check, switch Nginx, preserve PM2/static rollback until public HTTPS probes pass.
