# 07 — Deployment Architecture

> Đối tượng: DevOps, Backend. Server `103.75.185.136:24700`, path `/opt/qtsss`, project Compose `qtsss`.

## 1. Topology hiện tại

```
internet → Caddy :80/:443 (host)
   qtsgroup.vn, www.qtsgroup.vn
      /identity*  → 127.0.0.1:3001  (identity-prod)
      /*          → 127.0.0.1:3000  (web-prod)
   portal.qtsgroup.vn → 127.0.0.1:5174 (portal-prod)   [DNS chưa có]
   api.qtsgroup.vn    → 127.0.0.1:8000 (api)           [DNS chưa có]
   sso.qtsgroup.vn    → 127.0.0.1:8081 (keycloak)
   db :5433 (dev only, prod bị reset), redis :6379 (dev only)
```

## 2. Topology đích (sau phase 1)

```
internet → Caddy :80/:443
   www.qtsgroup.vn          → 308 → qtsgroup.vn (CANONICAL, hiện cả hai trả 200)
   qtsgroup.vn
      /api/*      → 127.0.0.1:3000 (web-prod rewrite → api:8000)
      /cms-media/*→ 127.0.0.1:3000 (web-prod rewrite → cms:8001)
      /identity/* → 127.0.0.1:3001
      /stats      → 127.0.0.1:8004 (plausible)
      /*          → 127.0.0.1:3000
   sso.qtsgroup.vn         → 127.0.0.1:8081
   api.qtsgroup.vn         → 127.0.0.1:8000  (chỉ khi DNS có; /admin và /api/docs bị chặn)
   staging.qtsgroup.vn     → 127.0.0.1:3100  (web-staging, compose project qtsss-staging)
internal: db(2 schema), cms-db, redis, keycloak, plausible-db
```

## 3. P0 — sửa lead form (làm ngay, trước mọi thứ khác)

**Nguyên nhân gốc:** `apps/web/Dockerfile` builder stage không có `ARG NEXT_PUBLIC_API_URL`, còn `docker-compose.yml:134` chỉ truyền như **runtime** env. `NEXT_PUBLIC_*` bị inline lúc build → bundle chứa `http://localhost:8000` (đã xác minh trong chunk `/contact`).

**Sửa (AD-05) — bỏ hẳn biến, dùng rewrite:**

1. `apps/web/next.config.ts`:
   ```ts
   async rewrites() {
     const api = process.env.API_INTERNAL_ORIGIN ?? "http://api:8000";
     const cms = process.env.CMS_INTERNAL_ORIGIN ?? "http://cms:8001";
     return [
       { source: "/api/:path*", destination: `${api}/api/:path*` },
       { source: "/cms-api/:path*", destination: `${cms}/api/:path*` },
     ];
   }
   ```
2. `apps/web/components/marketing/ContactForm.tsx`: fetch `"/api/v1/leads/consultation/"`.
3. `docker-compose.yml` `web-prod`: thay `environment` bằng `API_INTERNAL_ORIGIN: http://api:8000`, thêm `CMS_INTERNAL_ORIGIN: http://cms:8001`.
4. `DEPLOYMENT.md`: xóa `NEXT_PUBLIC_API_URL` khỏi `.env.production` template.
5. Verify: `curl -sS -X POST https://qtsgroup.vn/api/v1/leads/consultation/ -H 'content-type: application/json' -d '...'` trả 201/400, **không** 404/mixed-content.

Không dùng build arg làm fix: build arg vẫn nướng lúc build, và làm image không portable giữa staging/prod.

## 4. Service mới

| Service | Image | Port host | Ghi chú |
|---|---|---|---|
| `cms` | build `apps/cms` | `127.0.0.1:8001` | gunicorn 2 workers, migrate + collectstatic |
| `plausible-db` | `postgres:16-alpine` | none | DB riêng cho Plausible |
| `plausible` | `ghcr.io/plausible/community-edition` | `127.0.0.1:8004` | profile `prod` |

Memory budget: web 150MB + api ~400MB + keycloak ~1.2GB + postgres ~200MB + cms ~350MB + plausible ~250MB. Phải kiểm tra RAM VPS trước khi bật `plausible` — nếu dưới 4GB, hoãn Plausible và dùng Caddy access log + Plausible Cloud free tier.

## 5. Caddy hardening

```caddy
# 1. www → apex, 308 permanent (hiện cả hai trả 200 → duplicate content)
www.qtsgroup.vn {
    redir https://qtsgroup.vn{uri} permanent
}

qtsgroup.vn {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Frame-Options "SAMEORIGIN"
        -Server
        Content-Security-Policy "default-src 'self'; img-src 'self' data: https://qtsgroup.vn; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://plausible.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
        Permissions-Policy "geolocation=(), microphone=(), camera=(), interest-cohort=()"
        Cross-Origin-Opener-Policy "same-origin"
        Cross-Origin-Resource-Policy "same-site"
    }
    @media path /cms-media/* /_next/static/*
    header @media Cache-Control "public, max-age=31536000, immutable"
    @html path /*
    header @html Cache-Control "public, max-age=60, stale-while-revalidate=300"

    handle /identity* { reverse_proxy 127.0.0.1:3001 }
    handle /stats*    { reverse_proxy 127.0.0.1:8004 }
    handle /api/v1/leads/* {
        rate_limit { zone leads_zone 5r/m burst 3 }   # caddy-ratelimit plugin, hoặc chuyển vào Django throttle
        reverse_proxy 127.0.0.1:3000
    }
    handle { reverse_proxy 127.0.0.1:3000 }

    log { output file /var/log/caddy/qtsgroup.log; format json }
}

api.qtsgroup.vn {
    # chặn admin và docs ra public
    @blocked path /admin/* /api/docs/* /api/schema/*
    respond @blocked 404
    header { X-Frame-Options "DENY"; -Server; ... }
    reverse_proxy 127.0.0.1:8000
}
```

Lưu ý: plugin `rate_limit` cần build Caddy custom (`xcaddy`). Nếu không muốn build custom, rate limit đặt ở Django DRF throttle (04 mục 3.1) — ưu tiên cách này.

Xóa `X-Powered-By: Next.js`: `poweredByHeader: false` trong `next.config.ts` (gốc rễ), không cần Caddy `-Server` hack.

## 6. Bảo mật Django còn thiếu (P1)

| Vấn đề | Vị trí | Sửa |
|---|---|---|
| `AUTH_PASSWORD_VALIDATORS = []` | `settings.py:74` | Bật 4 validator mặc định |
| Không `DEFAULT_THROTTLE_CLASSES` | `REST_FRAMEWORK` | `AnonRateThrottle 60/m`, `UserRateThrottle 1000/d` |
| Không `EMAIL_BACKEND` | `settings.py` | SMTP + `DEFAULT_FROM_EMAIL=no-reply@qtsgroup.vn` |
| `/admin/` public | `config/urls.py` | Chặn ở Caddy + IP allowlist |
| `/api/docs/`, `/api/schema/` public | `config/urls.py` | Chỉ khi DEBUG, hoặc chặn Caddy |
| `/api/v1/core/overview/` trả số liệu bịa `$5.8M / 45 clients` | `core/urls.py` | **Xóa endpoint** |
| Không `SECURE_HSTS_PRELOAD` khi prod | `settings.py` | Thêm, khớp Caddy header |

## 7. CI/CD

Không có CI → thêm GitHub Actions, 3 job:

```
ci:      lint (eslint next/core-web-vitals + ruff) → typecheck → test (pytest, vitest) → build
deploy-staging:  on merge to main → rsync /opt/qtsss-staging → compose up -d
deploy-prod:     on tag v* → ./deploy.sh (giữ nguyên 8 gate) → verify curl → smoke test Playwright
```

Gate bắt buộc trước prod:
1. `docker compose config --quiet` hợp lệ.
2. Backup thành công (đã có trong `deploy.sh`).
3. `migrate --check` sạch (đã có).
4. Playwright 5 luồng pass trên staging.
5. `curl -fsS https://qtsgroup.vn/api/v1/leads/consultation/` với payload hợp lệ trả 400 (thiếu consent) — chứng tỏ endpoint sống.

## 8. Staging

- Compose project riêng `qtsss-staging`, DB riêng, port `3100` — không dùng chung volume với prod.
- Caddy `staging.qtsgroup.vn` → `127.0.0.1:3100`, basic auth hoặc IP allowlist.
- Nếu RAM VPS không đủ: staging chạy trên máy dev qua Cloudflare Tunnel, không chiếm RAM server.

## 9. Secrets

- `.env.production` mode `0600`, owner root, không commit (đã đúng).
- Thêm: `CMS_SECRET_KEY`, `CMS_DB_PASSWORD`, `CMS_WEBHOOK_SECRET`, `PLAUSIBLE_SECRET_KEY_BASE`, `SMTP_*`.
- Không log secret; `deploy.sh` không `echo` nội dung env.

## 10. Backup / restore / rollback

- Mở rộng `scripts/backup.sh` để dump **cả hai** database: `qts` và `qts_cms`, cùng `cms_media` volume (tar).
- Giữ cron `17 2 * * *`, `KEEP=14`.
- Rollback: như `DEPLOYMENT.md` mục Rollback. **Cấm `docker compose down -v`** — ghi vào `deploy.sh` guard và README.
- RTO mục tiêu 30 phút, RPO 24 giờ (tăng RPO bằng cách thêm backup 12:00).

## 11. Observability

| Loại | Công cụ | Alert |
|---|---|---|
| Uptime | cron + `curl` tới 5 endpoint, ghi `/var/log/qts-uptime.log` | 3 lần fail liên tiếp → email |
| Lead delivery | Django signal ghi `LeadActivity` + log | Không có lead mới trong 24h → email (giai đoạn đầu) |
| Error web | Plausible + `web-vitals` gửi `/api/v1/rum/` | INP/LCP vượt ngưỡng |
| Log | Caddy JSON + docker logs → `journald` | — |
| Metrics container | `docker stats` snapshot mỗi 5 phút vào file | RAM > 90% |

Không thêm Prometheus/Grafana ở phase 1 — quá nặng cho VPS này.

## 12. DNS prerequisite

`portal.qtsgroup.vn` và `api.qtsgroup.vn` **chưa có record** — iNET trả NXDOMAIN. Đây là việc của nhà cung cấp, không phải propagation. Mọi verification công khai cho 2 host này bị chặn tới khi record tồn tại. Server side đã sẵn sàng.
