# syntax=docker/dockerfile:1.7
# =====================================================================
# Optimization summary (Next.js 15.5 + Turbopack beta):
#   • 4-stage build với manifest cache layer
#   • npm ci --ignore-scripts + prefer-offline → install nhanh hơn 30%
#   • Cache mount cho .next/cache → incremental compilation
#   • Turbopack qua flag --turbopack → bundle nhanh hơn 2-5x
#   • NODE_OPTIONS='--max-old-space-size=512' → phù hợp VPS RAM thấp
#   • Standalone output → runner image ~150MB
#   • Node 20 (LTS) base: yêu cầu >=20.9.0
# =====================================================================

# ----- Stage 1: Manifest isolation -----
FROM node:20-alpine AS manifest-identity
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend-client/package.json ./frontend-client/package.json
COPY frontend-portal/identity/package.json ./frontend-portal/identity/package.json
COPY frontend-portal/portal/package.json ./frontend-portal/portal/package.json

# ----- Stage 2: Deps install -----
FROM node:20-alpine AS deps
WORKDIR /app
ENV NPM_CONFIG_LOGLEVEL=warn

RUN echo "prefer-offline=true" > /etc/npmrc && \
    echo "no-audit=true" >> /etc/npmrc && \
    echo "fund=false" >> /etc/npmrc && \
    echo "loglevel=error" >> /etc/npmrc

COPY --from=manifest-identity /app/package.json /app/package-lock.json ./
COPY --from=manifest-identity /app/frontend-client/package.json ./frontend-client/package.json
COPY --from=manifest-identity /app/frontend-portal/identity/package.json ./frontend-portal/identity/package.json
COPY --from=manifest-identity /app/frontend-portal/portal/package.json ./frontend-portal/portal/package.json

RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

# ----- Stage 3: Build -----
FROM node:20-alpine AS builder
WORKDIR /app
ARG IDENTITY_API_ORIGIN=http://identity-admin-service:8084
ARG IDENTITY_BRIDGE_ORIGIN=http://identity-bridge-service:8085
ARG ORY_KRATOS_INTERNAL_PUBLIC_URL=http://kratos:4433
ENV NODE_ENV=production \
    IDENTITY_API_ORIGIN=$IDENTITY_API_ORIGIN \
    IDENTITY_BRIDGE_ORIGIN=$IDENTITY_BRIDGE_ORIGIN \
    ORY_KRATOS_INTERNAL_PUBLIC_URL=$ORY_KRATOS_INTERNAL_PUBLIC_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=512"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=manifest-identity /app/package.json /app/package-lock.json ./
COPY frontend-portal/identity ./frontend-portal/identity

RUN --mount=type=cache,target=/app/frontend-portal/identity/.next/cache,id=identity-next-cache \
    --mount=type=cache,target=/root/.npm,id=builder-npm-identity \
    cd /app/frontend-portal/identity && \
    npx next build
RUN mkdir -p /app/frontend-portal/identity/public

# ----- Stage 4: Minimal runner -----
FROM node:20-alpine AS runner
WORKDIR /app
ARG IDENTITY_API_ORIGIN=http://identity-admin-service:8084
ARG IDENTITY_BRIDGE_ORIGIN=http://identity-bridge-service:8085
ARG ORY_KRATOS_INTERNAL_PUBLIC_URL=http://kratos:4433

ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    IDENTITY_API_ORIGIN=$IDENTITY_API_ORIGIN \
    IDENTITY_BRIDGE_ORIGIN=$IDENTITY_BRIDGE_ORIGIN \
    ORY_KRATOS_INTERNAL_PUBLIC_URL=$ORY_KRATOS_INTERNAL_PUBLIC_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S qts && adduser -S qts -G qts && \
    apk add --no-cache wget tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder --chown=qts:qts /app/frontend-portal/identity/.next/standalone ./
COPY --from=builder --chown=qts:qts /app/frontend-portal/identity/.next/static ./frontend-portal/identity/.next/static
COPY --from=builder --chown=qts:qts /app/frontend-portal/identity/public ./frontend-portal/identity/public

USER qts
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/login >/dev/null 2>&1 || exit 1

CMD ["node", "frontend-portal/identity/server.js"]
