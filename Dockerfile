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
# The browser receives only the same-origin Content API path; database URLs
# and credentials are never Docker build arguments.
ARG NEXT_PUBLIC_CONTENT_API_BASE_URL=""
ENV VITEPRESS_BASE=${VITEPRESS_BASE}
ENV DEMO_RUNNER_CLIENT_ENABLED=${DEMO_RUNNER_CLIENT_ENABLED}
ENV DEMO_RUNNER_BASE_URL=${DEMO_RUNNER_BASE_URL}
ENV NEXT_PUBLIC_CONTENT_API_BASE_URL=${NEXT_PUBLIC_CONTENT_API_BASE_URL}
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
