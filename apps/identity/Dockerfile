# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/identity/package.json ./apps/identity/package.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/identity ./apps/identity
# Mount persistent cache so Next.js .next/cache survives between builds.
RUN --mount=type=cache,target=/app/apps/identity/.next/cache,id=identity-next-cache \
    npm run build --workspace=@qts/identity

# standalone build output: .next/standalone + .next/static + public
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN addgroup -S qts && adduser -S qts -G qts

# Standalone bundle
COPY --from=builder --chown=qts:qts /app/apps/identity/.next/standalone ./
# Static assets
COPY --from=builder --chown=qts:qts /app/apps/identity/.next/static ./apps/identity/.next/static
# Public assets
COPY --from=builder --chown=qts:qts /app/apps/identity/public ./apps/identity/public

USER qts
EXPOSE 3001
CMD ["node", "apps/identity/server.js"]
