# 04 — API Architecture

> Đối tượng: Backend, Frontend. Mọi URL trong tài liệu này là đường dẫn tương đối qua Next.js rewrite — không dùng `NEXT_PUBLIC_API_URL`.

## 1. Tổng quan

```
Browser  →  https://qtsgroup.vn/api/*  →  Next.js rewrite  →  http://api:8000/api/*
                                    ↘  /cms-api/*         →  http://cms:8000/api/*
```

Lý do: `NEXT_PUBLIC_*` bị nướng lúc `next build`. Hotfix P0 bỏ hoàn toàn pattern này (AD-05). Frontend chỉ gọi `/api/...` và `/cms-api/...`.

## 2. Versioning

- API marketing/lead: `/api/v1/...` (giữ nguyên cho tương thích).
- API CMS public: `/cms-api/v1/...` (do Wagtail headless serve, không lẫn với Django `api`).
- Không tạo `/api/v2` nếu chưa break contract — YAGNI.

## 3. Endpoints

### 3.1 Lead / CRM (Django `api`, DB `qts`)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/v1/leads/consultation/` | public, throttle | Tạo lead (P0 fix) |
| GET | `/api/v1/leads/` | staff + `leads.view_lead` | List/filter lead |
| PATCH | `/api/v1/leads/{id}/` | staff + `leads.change_lead` | Đổi status/assign |
| GET | `/api/v1/leads/{id}/activities/` | staff | Lịch sử lead |
| GET | `/api/v1/health/` | public | Health check |

**POST /consultation — contract:**

Request:
```json
{
  "name": "Nguyen Van A",
  "email": "a@congty.vn",
  "company": "CTY A",
  "phone": "0901234567",
  "message": "... 20-2000 ký tự ...",
  "locale": "vi",
  "consent": true,
  "source_url": "https://qtsgroup.vn/vi/solutions",
  "utm_source": "google",
  "idempotency_key": "uuid-v4 client tạo"
}
```

Validation: `consent==true` bắt buộc, `email` format, `message` length, honeypot field `website` phải rỗng, proof-of-work header `X-PoW-Token` (hoặc Turnstile nếu PoW fail).

Response 201:
```json
{ "id": "uuid", "status": "new", "created_at": "2026-09-08T..." }
```

Dedupe: `idempotency_key` unique — POST lại cùng key trả 200 với record cũ, không tạo mới.

Throttle: `AnonRateThrottle` 5 req/phút/IP + 20 req/giờ/IP cho endpoint này (DRF `DEFAULT_THROTTLE_CLASSES`).

### 3.2 Content public (Wagtail `cms`, DB `qts_cms`)

| Method | Path | Cache | Mô tả |
|--------|------|-------|-------|
| GET | `/cms-api/v1/pages/?type=home&locale=vi` | CDN 60s, SWR 300s | Page + blocks |
| GET | `/cms-api/v1/pages/{slug}/?locale=vi` | CDN 60s | Chi tiết page |
| GET | `/cms-api/v1/categories/` | CDN 300s | Danh mục |
| GET | `/cms-api/v1/search/?q=&locale=vi` | no-cache | Tìm kiếm |

Trả về JSON đã validate bằng `zod` ở frontend (05). Có `ETag` + `Last-Modified`.

### 3.3 Webhook nội bộ

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/v1/webhooks/cms-publish/` | HMAC `CMS_WEBHOOK_SECRET` | Wagtail gọi khi publish → trigger ISR revalidate |

## 4. Envelope & lỗi

Thành công: `{ "data": <payload>, "meta": { "locale": "vi" } }`
Lỗi: `{ "error": { "code": "validation_error", "message": "...", "fields": { "email": ["..."] } } }`
HTTP: 400 validation, 401 auth, 403 permission, 404 not found, 409 idempotency conflict, 429 throttle, 500 internal (không lộ stack).

## 5. CORS / CSRF

- Marketing public API: `AllowAny` chỉ cho `POST /consultation`, các endpoint khác `IsAuthenticated`.
- `CORS_ALLOWED_ORIGINS` = `https://qtsgroup.vn, https://www.qtsgroup.vn` (không wildcard).
- CSRF: không cần cho JSON API public; admin API dùng session + CSRF.

## 6. OpenAPI

- `drf-spectacular` giữ nguyên nhưng **không public** `/api/docs/` — chỉ serve khi `DJANGO_DEBUG=true` hoặc qua `127.0.0.1`.
- Caddy block `/api/docs` ra ngoài (07).

## 7. SEO liên quan API

- Sitemap/robots do Next.js tự sinh từ CMS data, không phải endpoint API.
- Mỗi page trả về `seo_title`, `seo_description`, `og_image`, `canonical`, `hreflang` để Next.js render `<head>` (02/05).

## 8. P0 hotfix — thứ tự sửa

1. Backend: thêm throttle + honeypot + idempotency + consent validation cho `POST /consultation`.
2. Frontend: đổi `ContactForm.tsx` fetch từ ``${NEXT_PUBLIC_API_URL}/api/v1/leads/consultation/`` sang `/api/v1/leads/consultation/` + thêm field `consent` + `idempotency_key`.
3. Next config: thêm `rewrites()` `/api/:path*` → `http://api:8000/api/:path*` và `/cms-api/:path*` → `http://cms:8000/api/:path*`.
4. Xóa `NEXT_PUBLIC_API_URL` khỏi `docker-compose.yml` env (không còn dùng).
