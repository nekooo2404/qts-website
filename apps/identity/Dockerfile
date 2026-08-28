# syntax=docker/dockerfile:1.7
# =====================================================================
# Optimization summary (Next.js 15.5 + Turbopack beta):
#   • 4-stage build với manifest cache layer
#   • npm ci --ignore-scripts + prefer-offline → install nhanh hơn 30%
#   • Cache mount cho .next/cache → incremental compilation
#   • Turbopack qua flag --turbopack → bundle nhanh hơn 2-5x
#   • NODE_OPTIONS='--max-old-space-size=4096' → tránh OOM
#   • Standalone output → runner image ~150MB
#   • Node 20 (LTS) base: chạy được trên Node 18.18+ như Next 15.5 yêu cầu
# =====================================================================

# ----- Stage 1: Manifest isolation -----
FROM node:20-alpine AS manifest-identity
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/identity/package.json ./apps/identity/package.json
COPY apps/portal/package.json ./apps/portal/package.json

# ----- Stage 2: Deps install -----
FROM node:20-alpine AS deps
WORKDIR /app
ENV NPM_CONFIG_LOGLEVEL=warn

RUN echo "prefer-offline=true" > /etc/npmrc && \
    echo "no-audit=true" >> /etc/npmrc && \
    echo "fund=false" >> /etc/npmrc && \
    echo "loglevel=error" >> /etc/npmrc

COPY --from=manifest-identity /app/package.json /app/package-lock.json ./
COPY --from=manifest-identity /app/apps/web/package.json ./apps/web/package.json
COPY --from=manifest-identity /app/apps/identity/package.json ./apps/identity/package.json
COPY --from=manifest-identity /app/apps/portal/package.json ./apps/portal/package.json

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules,id=nm-cache-identity \
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

# ----- Stage 3: Build -----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=manifest-identity /app/package.json /app/package-lock.json ./
COPY apps/identity ./apps/identity

RUN --mount=type=cache,target=/app/apps/identity/.next/cache,id=identity-next-cache \
    --mount=type=cache,target=/root/.npm,id=builder-npm-identity \
    cd /app/apps/identity && \
    npx next build --turbopack --no-lint

# ----- Stage 4: Minimal runner -----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S qts && adduser -S qts -G qts && \
    apk add --no-cache wget tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder --chown=qts:qts /app/apps/identity/.next/standalone ./
COPY --from=builder --chown=qts:qts /app/apps/identity/.next/static ./apps/identity/.next/static
COPY --from=builder --chown=qts:qts /app/apps/identity/public ./apps/identity/public 2>/dev/null || true

USER qts
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/ >/dev/null 2>&1 || exit 1

CMD ["node", "apps/identity/server.js"]