# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG VITEPRESS_BASE=/agent-build/
ARG DEMO_RUNNER_CLIENT_ENABLED=1
ARG DEMO_RUNNER_BASE_URL=/agent-build/api/demo-runner
# These are browser-safe values only. service_role is never a Docker build arg.
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ARG SUPABASE_SCHEMA=public
ENV VITEPRESS_BASE=${VITEPRESS_BASE}
ENV DEMO_RUNNER_CLIENT_ENABLED=${DEMO_RUNNER_CLIENT_ENABLED}
ENV DEMO_RUNNER_BASE_URL=${DEMO_RUNNER_BASE_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SCHEMA=${SUPABASE_SCHEMA}
COPY . .
RUN pnpm run site:build

FROM nginx:1.27-alpine AS site
ENV AGENT_BUILD_BASE_PATH=/agent-build/
COPY deploy/nginx/agent-build.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/.vitepress/dist /usr/share/nginx/html

FROM node:22-bookworm-slim AS app-runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app /app
CMD ["pnpm", "run", "demo:server:prod"]
