# syntax=docker/dockerfile:1.7
# ============================================
# Stage 1: Install ALL dependencies (monorepo)
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app
ARG NPM_TOKEN

# Copy manifests first (best for layer caching when deps don't change)
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/identity/package.json ./apps/identity/package.json
COPY apps/portal/package.json ./apps/portal/package.json

# Configure npm for faster installs
RUN echo "prefer-offline=true" >> /etc/npmrc && \
    echo "no-audit=true" >> /etc/npmrc && \
    echo "fund=false" >> /etc/npmrc

# Cache node_modules across builds (layers are invalidated only when package files change)
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.npm-cache,id=npm-cache \
    npm ci --ignore-scripts

# ============================================
# Stage 2: Build web app
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_TELEMETRY_DISABLED=1

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY package.json package-lock.json ./
COPY apps/web ./apps/web

# Pre-build optimizations: tree-shake, dead-code elimination
# tsc check is skipped during Docker build (run locally)
RUN --mount=type=cache,target=/app/apps/web/.next/cache,id=web-next-cache \
    --mount=type=cache,target=/root/.npm \
    cd apps/web && \
    npm run build -- --no-lint

# ============================================
# Stage 3: Minimal production runner
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S qts && adduser -S qts -G qts

# Copy only what's needed for production
COPY --from=builder --chown=qts:qts /app/apps/web/.next/standalone ./
COPY --from=builder --chown=qts:qts /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=qts:qts /app/apps/web/public ./apps/web/public 2>/dev/null || true

USER qts
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "apps/web/server.js"]
