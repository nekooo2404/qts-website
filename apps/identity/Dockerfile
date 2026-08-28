FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/identity/package.json ./apps/identity/package.json
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/identity ./apps/identity
RUN npm run build --workspace=@qts/identity

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S qts && adduser -S qts -G qts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/identity/package.json ./apps/identity/package.json
COPY --from=builder /app/apps/identity/.next ./apps/identity/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/identity/node_modules ./apps/identity/node_modules
USER qts
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace=@qts/identity"]
