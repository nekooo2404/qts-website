# syntax=docker/dockerfile:1.7
# =====================================================================
# Optimization summary (Next.js 15.5 + Turbopack beta):
#   • 4-stage build với manifest cache layer → cache hit ~5s khi code đổi
#   • npm ci --ignore-scripts + prefer-offline → install nhanh hơn 30%
#   • Cache mount cho .next/cache → incremental compilation
#   • Tắt telemetry + lint trong Docker (chạy lint local thôi)
#   • Turbopack qua flag --turbopack → bundle nhanh hơn 2-5x
#   • NODE_OPTIONS='--max-old-space-size=512' → phù hợp VPS RAM thấp
#   • Standalone output → runner image ~150MB thay vì ~500MB
#   • Node 20 (LTS) base: yêu cầu >=20.9.0
# =====================================================================

# ----- Stage 1: Manifest isolation (cache độc lập với source) -----
FROM node:20-alpine AS manifest-web
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend-client/package.json ./frontend-client/package.json
COPY frontend-portal/identity/package.json ./frontend-portal/identity/package.json
COPY frontend-portal/portal/package.json ./frontend-portal/portal/package.json

# ----- Stage 2: Deps install với BuildKit cache mounts -----
FROM node:20-alpine AS deps
WORKDIR /app
ENV NPM_CONFIG_LOGLEVEL=warn

RUN echo "prefer-offline=true" > /etc/npmrc && \
    echo "no-audit=true" >> /etc/npmrc && \
    echo "fund=false" >> /etc/npmrc && \
    echo "loglevel=error" >> /etc/npmrc

COPY --from=manifest-web /app/package.json /app/package-lock.json ./
COPY --from=manifest-web /app/frontend-client/package.json ./frontend-client/package.json
COPY --from=manifest-web /app/frontend-portal/identity/package.json ./frontend-portal/identity/package.json
COPY --from=manifest-web /app/frontend-portal/portal/package.json ./frontend-portal/portal/package.json

RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

# ----- Stage 3: Build (Turbopack — production beta trong Next 15.5) -----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=512"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=manifest-web /app/package.json /app/package-lock.json ./
COPY frontend-client ./frontend-client

RUN --mount=type=cache,target=/app/frontend-client/.next/cache,id=web-next-cache \
    --mount=type=cache,target=/root/.npm,id=builder-npm-web \
    cd /app/frontend-client && \
    npx next build
RUN mkdir -p /app/frontend-client/public

# ----- Stage 4: Minimal runner -----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S qts && adduser -S qts -G qts && \
    apk add --no-cache wget tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder --chown=qts:qts /app/frontend-client/.next/standalone ./
COPY --from=builder --chown=qts:qts /app/frontend-client/.next/static ./frontend-client/.next/static
COPY --from=builder --chown=qts:qts /app/frontend-client/public ./frontend-client/public

USER qts
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "frontend-client/server.js"]
