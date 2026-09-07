# 06 — CMS Architecture

> Đối tượng: Backend, Frontend, SEO, Marketing.

## 1. Lựa chọn sản phẩm

**Wagtail 6.x** — Django app chạy container riêng `cms`, DB riêng `qts_cms`.

| Tiêu chí | Wagtail | Strapi/Directus (loại) | Lý do loại |
|---|---|---|---|
| Stack hiện tại | Django + Postgres đã có | Node.js stack mới | Thêm runtime, thêm vận hành |
| RBAC/workflow | Có sẵn, mature | Có nhưng khác mô hình | Tận dụng pattern `identity` |
| i18n | `wagtail-localize` | Plugin | Wagtail-localize ổn định hơn |
| DAM | `wagtailimages` + `wagtaildocs` | Tự build | Đỡ viết lại |
| Vận hành 5 năm | Python team maintain được | Cần JS team riêng | Một team một ngôn ngữ backend |

Không chọn headless SaaS (Contentful/Sanity) — phụ thuộc vendor, chi phí, DNS.

## 2. Topology

```
cms:8001 (internal)  ←→  db:5432/qts_cms  (volume cms_postgres)
  ↑ admin /cms/ (qua Caddy, IP allow hoặc VPN)
  ↓ public read /cms-api/v1/* (qua Next.js rewrite, không public trực tiếp)
  ↓ webhook → api:8000/api/v1/webhooks/cms-publish/ (HMAC)
```

- `cms` là project Django **tách biệt** khỏi `apps/api` — không share code, không share DB.
- Code ở `apps/cms/` (mới), Dockerfile `apps/cms/Dockerfile` (python:3.12-slim, gunicorn 2 workers).

## 3. Content model

### 3.1 Page types (Wagtail Page subclass)

| Page | URL pattern | Blocks cho phép |
|---|---|---|
| HomePage | `/[locale]/` | Hero, FeatureGrid, Testimonial, CTA, LogoWall |
| SolutionPage | `/[locale]/solutions/[slug]` | Hero, FeatureGrid, RichText, CTA, FAQ |
| IndustryPage | `/[locale]/industries/[slug]` | Hero, StatGrid, Testimonial, CTA |
| PlatformPage | `/[locale]/platform/[slug]` | Hero, FeatureGrid, Image, CTA |
| ResourceIndex | `/[locale]/resources` | Listing (query Category/Tag) |
| ResourcePage | `/[locale]/resources/[slug]` | RichText, Image, FAQ, CTA, Download |
| CompanyPage | `/[locale]/company` | Timeline, TeamGrid, RichText |
| LegalPage | `/[locale]/legal/[slug]` | RichText |

Mỗi Page có `seo_title`, `seo_description`, `og_image`, `canonical_override`, `noindex`.

### 3.2 Taxonomy

- `Category` (tree, 1 cấp): Solutions / Industries / Platform / Resources / Company.
- `Tag` (flat): AI, ERP, Cloud...
- `Author` (name, avatar, role).

### 3.3 Blocks (StreamField)

`Hero | FeatureGrid | StatGrid | Testimonial | LogoWall | RichText | Image | FAQ | CTA | Download | Timeline | TeamGrid`

Mỗi block có zod schema tương ứng ở frontend (05 mục 3). Thêm block mới = thêm schema + component, không sửa CMS core.

## 4. Workflow

```
draft → review (Editor gửi) → approved (Reviewer duyệt) → publish → archive
         ↘ rejected → draft
```

- Role: `cms_editor` (tạo/sửa), `cms_reviewer` (duyệt), `cms_admin` (mọi quyền + settings).
- Revision: Wagtail tự lưu, có compare + revert.
- Schedule publish: Wagtail `go_live_at` / `expire_at`.

## 5. Localization

- `wagtail-localize` — `vi` là source, `en` là translation.
- Mỗi Page có `locale`, `translation_key` — URL `/vi/...` và `/en/...`, `hreflang` tự sinh.
- Fallback: nếu `en` chưa dịch, trả `vi` + header `Content-Language: vi` để frontend hiện banner "Chưa có bản tiếng Anh".

## 6. DAM

- `wagtailimages`: upload, focal point, renditions (400/800/1200/1920), alt text bắt buộc.
- `wagtaildocs`: PDF case study, whitepaper.
- Lưu trên volume `cms_media` (`/app/media`), serve qua Caddy `/cms-media/` với cache 1 năm + immutable.

## 7. Preview & ISR

- Preview: Wagtail preview với `draft_token` (signed, TTL 10 phút) → Next.js route `/api/preview?token=...` set cookie preview và render draft.
- Publish webhook: Wagtail `post_publish` signal → POST `api:8000/webhooks/cms-publish` (HMAC) → `api` gọi `revalidateTag("cms:pages")` tới Next.js (hoặc Next tự revalidate theo `revalidate: 60`).

## 8. Auth cho editor

- Editor đăng nhập qua Keycloak SSO (OIDC) — reuse `sso.qtsgroup.vn`, group `cms-editors` map vào `cms_editor`.
- Fallback local admin cho bootstrap.

## 9. Seed & migration

- `apps/cms/fixtures/initial.json` — Category, Page skeleton, workflow.
- Không import content cũ (đang hardcode trong TSX) — editor nhập lại qua CMS, frontend song song đọc CMS với fallback TSX trong 1 sprint.
