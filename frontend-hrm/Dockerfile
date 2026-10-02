FROM node:22-alpine AS deps
WORKDIR /app
ENV NPM_CONFIG_JOBS=1
COPY package.json package-lock.json ./
COPY frontend-hrm/package.json ./frontend-hrm/package.json
COPY packages/oidc-client/package.json ./packages/oidc-client/package.json
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=512" \
    NPM_CONFIG_JOBS=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend-hrm ./frontend-hrm
COPY packages/oidc-client ./packages/oidc-client
ARG VITE_IDENTITY_ISSUER
ARG VITE_API_ISSUER
ARG VITE_HRM_OIDC_CLIENT_ID
ARG VITE_IDENTITY_WEB_ORIGIN
ARG VITE_HRM_OIDC_REDIRECT_URI
ARG VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI
ARG VITE_ALLOW_INSECURE_LOCAL_OIDC
ARG VITE_ALLOW_BROWSER_TOKEN_STORAGE
ARG VITE_OIDC_SESSION_PERSISTENCE
RUN npm run build --workspace=@qts/hrm

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
ARG VITE_ALLOW_INSECURE_LOCAL_OIDC
COPY frontend-hrm/nginx.conf /etc/nginx/conf.d/default.conf
RUN if [ "$VITE_ALLOW_INSECURE_LOCAL_OIDC" = "true" ]; then \
      sed -i "s|connect-src 'self' |connect-src 'self' http://localhost:3001 http://127.0.0.1:3001 http://localhost:4444 http://127.0.0.1:4444 http://localhost:8084 http://127.0.0.1:8084 http://localhost:18084 http://127.0.0.1:18084 |g" /etc/nginx/conf.d/default.conf; \
    fi
COPY --from=builder --chown=101:101 /app/frontend-hrm/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
