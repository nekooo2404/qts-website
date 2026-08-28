# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
# Mount persistent cache so Next.js .next/cache survives between builds.
# When source is unchanged, subsequent builds reuse compiled pages → 5–15s.
RUN --mount=type=cache,target=/app/apps/web/.next/cache,id=web-next-cache \
    npm run build --workspace=@qts/web

# standalone build output: .next/standalone + .next/static + public
# Runner is minimal: only the standalone bundle + static assets + public.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S qts && adduser -S qts -G qts

# Standalone bundle (self-contained, no node_modules needed at runtime)
COPY --from=builder --chown=qts:qts /app/apps/web/.next/standalone ./
# Static assets (.next/static) — required for CSS/JS chunks
COPY --from=builder --chown=qts:qts /app/apps/web/.next/static ./apps/web/.next/static
# Public assets
COPY --from=builder --chown=qts:qts /app/apps/web/public ./apps/web/public

USER qts
EXPOSE 3000
# standalone entry: server.js at repo root (apps/web/.next/standalone/apps/web/server.js)
CMD ["node", "apps/web/server.js"]
