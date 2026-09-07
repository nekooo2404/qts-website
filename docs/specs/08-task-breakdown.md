# 08 — Development Task Breakdown

> Đối tượng: PM + toàn đội. Mỗi task có ID, phụ thuộc, tiêu chí chấp nhận, ước lượng. Ước lượng = ideal days (1 dev tập trung).

## Quy ước

- P0: hotfix lead form — làm ngay, không đợi sprint.
- Sprint 0: 2 tuần — nền tảng (token, rewrite, CMS skeleton, CI).
- Sprint 1-4: mỗi sprint 2 tuần.
- DoD chung: xem `README.md` mục 8.

---

## P0 — Hotfix (1-2 ngày, trước Sprint 0)

| ID | Task | Role | Dep | Ước lượng | Chấp nhận |
|---|---|---|---|---|---|
| P0-01 | Thêm `rewrites()` `/api`, `/cms-api` trong `next.config.ts`, đổi `ContactForm` sang `/api/...`, xóa `NEXT_PUBLIC_API_URL` khỏi compose/env/docs | Frontend | — | 0.5d | `curl POST /api/v1/leads/consultation/` qua `qtsgroup.vn` trả 201; bundle không còn `localhost:8000` |
| P0-02 | Thêm throttle + honeypot + consent + idempotency cho `POST /consultation` (04 mục 3.1) | Backend | — | 0.5d | 5 req/m/IP bị 429, honeypot rỗng bắt buộc, `consent=false` → 400 |
| P0-03 | Caddy `www→apex 308` + `poweredByHeader:false` + chặn `/admin`,`/api/docs` (07 mục 5-6) | DevOps | P0-01 | 0.5d | `curl -I https://www.qtsgroup.vn` → 308, không `X-Powered-By` |
| P0-04 | Xóa `core/overview` endpoint bịa số liệu | Backend | — | 0.1d | `/api/v1/core/overview` → 404 |
| P0-05 | Smoke test P0 trên prod (verify curl + 1 submit thật) | DevOps+QA | P0-01..04 | 0.2d | Lead xuất hiện trong DB/admin |

---

## Sprint 0 — Nền tảng (2 tuần)

### Frontend

| ID | Task | Dep | d | Chấp nhận |
|---|---|---|---|---|
| FE-01 | Token hóa `tailwind.config.ts` + gọn `globals.css` + lint cấm hex/inline style | — | 2d | 0 hex ngoài config, `globals.css` < 80 dòng |
| FE-02 | `next/font/local` Be Vietnam Pro + Inter, xóa `Segoe UI` stack | FE-01 | 0.5d | Lighthouse không FOIT, `vietnamese` subset |
| FE-03 | Bật `next/image` (xóa `unoptimized`), `remotePatterns` cms-media | — | 0.5d | Ảnh qua `/_next/image`, không 404 |
| FE-04 | Xóa `QtsSite.tsx`, gọn `MarketingShell` (bỏ AnimatePresence block) | — | 0.5d | Không import chết, route chuyển không block paint |
| FE-05 | Sửa `SiteHeader`/`ContactForm` a11y (focus ring, target 44, consent checkbox) | FE-01 | 1d | axe 0 violation, target ≥24 |

### Backend

| ID | Task | Dep | d | Chấp nhận |
|---|---|---|---|---|
| BE-01 | Mở rộng `Lead` + `LeadActivity` (03 mục 2), migration, admin list/filter | P0-02 | 1.5d | Admin thấy lead, đổi status, có activity log |
| BE-02 | `AUTH_PASSWORD_VALIDATORS` + `DEFAULT_THROTTLE_CLASSES` + `EMAIL_BACKEND` (07 mục 6) | — | 0.5d | Settings prod có đủ 3 |
| BE-03 | Khởi tạo `apps/cms` Wagtail skeleton + DB `qts_cms` + compose service `cms` | — | 2d | `cms:8001/admin` đăng nhập được, Page CRUD được |
| BE-04 | Webhook `cms-publish` HMAC + `revalidateTag` (04 mục 3.3, 06 mục 7) | BE-03 | 1d | Publish trong Wagtail → Next revalidate trong 60s |

### UI Designer

| ID | Task | Dep | d | Chấp nhận |
|---|---|---|---|---|
| UI-01 | Audit toàn site, chốt token bảng màu/type/scale (02 mục 2) | — | 2d | Figma token file, duyệt bởi PM |
| UI-02 | Thiết kế lại `Button/Input/Card/MegaMenu` với đủ trạng thái | UI-01 | 2d | Figma component đủ 7 trạng thái/mỗi |
| UI-03 | Template Home + Contact (desktop/mobile) theo token mới | UI-01 | 2d | Figma page, dev có thể implement 1-1 |

### SEO

| ID | Task | Dep | d | Chấp nhận |
|---|---|---|---|---|
| SEO-01 | `robots.ts` + `sitemap.ts` động từ CMS + `generateMetadata` canonical/OG/hreflang | BE-03 | 1d | `/robots.txt` và `/sitemap.xml` trả 200, valid |
| SEO-02 | JSON-LD `Organization` + `BreadcrumbList` (05 mục 7) | SEO-01 | 0.5d | Rich Results Test pass |

### DevOps

| ID | Task | Dep | d | Chấp nhận |
|---|---|---|---|---|
| OPS-01 | GitHub Actions CI: lint→typecheck→test→build | — | 1d | PR chạy CI, fail block merge |
| OPS-02 | Staging `qtsss-staging` + Caddy `staging.qtsgroup.vn` | — | 1d | `staging.qtsgroup.vn` trả 200, DB riêng |
| OPS-03 | Mở rộng `backup.sh` cho `qts_cms` + `cms_media` (07 mục 10) | — | 0.5d | Backup nightly có 2 dump + tar media |

---

## Sprint 1 — CMS content & i18n (2 tuần)

| ID | Task | Role | Dep | d | Chấp nhận |
|---|---|---|---|---|---|
| S1-01 | Page types + blocks StreamField (06 mục 3) | BE | BE-03 | 3d | Tạo được mọi Page type trong admin |
| S1-02 | `wagtail-localize` vi/en + hreflang | BE | S1-01 | 1d | Mỗi Page có bản vi+en, URL `/vi/...`, `/en/...` |
| S1-03 | DAM renditions + alt bắt buộc | BE | S1-01 | 0.5d | Upload ảnh có 4 rendition, thiếu alt không save |
| S1-04 | Workflow draft→review→publish + role mapping Keycloak | BE | S1-01 | 1d | Editor gửi review, Reviewer duyệt mới publish |
| S1-05 | `lib/cms.ts` fetch + zod + `BlockRenderer` (05 mục 3) | FE | S1-01 | 2d | Page render từ CMS JSON, zod fail không crash |
| S1-06 | `[locale]` routing + `lang` attr + locale switcher | FE | S1-02,S1-05 | 1d | `/vi` và `/en` đều 200, switch giữ slug |
| S1-07 | Nhập content thật cho Home/Solutions/Company (thay hardcode) | FE+UI | S1-05 | 2d | Không còn stat/logo/testimonial fake |
| S1-08 | Preview draft token (06 mục 7) | BE+FE | S1-01 | 1d | `/api/preview?token=...` hiện draft |

---

## Sprint 2 — Lead CRM & trust (2 tuần)

| ID | Task | Role | Dep | d | Chấp nhận |
|---|---|---|---|---|---|
| S2-01 | Lead admin: filter/status/assign/search + CSV export | BE | BE-01 | 2d | Staff filter theo status, assign owner, export CSV |
| S2-02 | Email notify khi lead mới (SMTP) + template | BE | BE-02 | 1d | Submit → email tới `sales@qtsgroup.vn` trong 60s |
| S2-03 | Proof-of-work / Turnstile cho form (04 mục 3.1) | BE+FE | P0-02 | 1d | Bot không PoW bị 400 |
| S2-04 | Trust center: legal entity, VAT, địa chỉ, jurisdiction trong footer/CMS | UI+FE | — | 1d | Footer có thông tin pháp lý thật, không `hello@qts.com` |
| S2-05 | Resource listing: category/tag/search từ CMS | FE | S1-05 | 2d | `/resources` filter được, không hardcode `catalog.ts` |
| S2-06 | Plausible self-hosted (nếu RAM đủ) hoặc Cloud free | OPS | — | 1d | `qtsgroup.vn/stats` hoặc Plausible Cloud ghi pageview |

---

## Sprint 3 — Polish & performance (2 tuần)

| ID | Task | Role | Dep | d | Chấp nhận |
|---|---|---|---|---|---|
| S3-01 | Audit a11y toàn site (axe + keyboard + screen reader) | FE+UI | FE-05 | 2d | Lighthouse A11y ≥98, 0 axe violation |
| S3-02 | Motion audit: gate `prefers-reduced-motion` toàn site | FE | FE-04 | 1d | `reduce` tắt mọi loop/marquee/toast |
| S3-03 | Image optimization: `next/image` sizes, priority LCP, lazy below-fold | FE | FE-03 | 1d | LCP image `priority`, còn lại `loading=lazy` |
| S3-04 | SEO: redirect map, 404/500 page, internal linking | SEO+FE | SEO-01 | 1d | Mọi old URL có 301, 404 có search |
| S3-05 | RUM endpoint `/api/v1/rum/` + dashboard web-vitals | BE+FE | S2-06 | 1d | LCP/CLS/INP ghi DB, xem được p75 |

---

## Sprint 4 — Hardening & handover (2 tuần)

| ID | Task | Role | Dep | d | Chấp nhận |
|---|---|---|---|---|---|
| S4-01 | Security review: dependency audit, header scan, OWASP checklist | BE+OPS | BE-02 | 1d | `npm audit` 0 high, header scan pass |
| S4-02 | Playwright 5 luồng + CI gate | FE | — | 1.5d | CI fail nếu E2E fail |
| S4-03 | Docs: CMS editor guide + runbook vận hành | BE+OPS | — | 1d | Marketing tự publish được sau 30 phút đọc |
| S4-04 | Load test lead endpoint (k6 100 rps) | BE+OPS | P0-02 | 0.5d | p95 < 300ms, không 5xx |
| S4-05 | Handover + backlog phase 2 (CRM ngoài, search nâng cao) | PM | — | 0.5d | Backlog groomed, owner rõ |

---

## Tổng hợp ước lượng (ideal days, chưa tính buffer)

| Role | Tổng |
|---|---|
| Frontend | ~14d |
| Backend | ~14d |
| UI designer | ~6d |
| SEO | ~2.5d |
| DevOps | ~5d |
| **Cộng** | **~41.5d** |

Với team 1 FE + 1 BE + 0.5 UI + 0.25 SEO + 0.25 DevOps, cần **~8-10 tuần** (Sprint 0-4) + P0 2 ngày. Thêm 30% buffer cho review/QA → **~12 tuần** tới handover.

## Dependency graph (rút gọn)

```
P0-01 → FE-05, OPS-01
BE-03 → S1-01 → S1-02, S1-03, S1-04, S1-05 → S1-06, S1-07
P0-02 → BE-01 → S2-01
FE-01 → FE-02, FE-05 → S3-01
SEO-01 → SEO-02, S3-04
```

## Definition of Done nhắc lại

Mọi task phải thỏa 8 điểm ở `README.md` mục 8 trước khi merge. Không có ngoại lệ cho P0.
