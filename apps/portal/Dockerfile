FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/portal/package.json ./apps/portal/package.json
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/portal ./apps/portal
ARG VITE_IDENTITY_ISSUER
ARG VITE_API_ISSUER
ARG VITE_PORTAL_OIDC_CLIENT_ID
ARG VITE_IDENTITY_WEB_ORIGIN
ARG VITE_PORTAL_OIDC_REDIRECT_URI
ARG VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI
RUN npm run build --workspace=@qts/portal

FROM nginx:1.27-alpine AS runner
COPY apps/portal/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/portal/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
