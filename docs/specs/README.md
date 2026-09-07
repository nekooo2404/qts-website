# QTS GROUP — BỘ TÀI LIỆU TRIỂN KHAI WEBSITE ENTERPRISE

Tài liệu này chuyển toàn bộ đề xuất trong Báo cáo Chuyển đổi Website Enterprise thành
đặc tả kỹ thuật có thể giao trực tiếp cho đội phát triển.

Ngày phát hành: 2026-09-08
Người chịu trách nhiệm: Lead Architect
Phạm vi: `qtsgroup.vn` (marketing), CMS, API, CRM lead, hạ tầng triển khai.
Ngoài phạm vi: Portal khách hàng (`portal.qtsgroup.vn`) và Identity Center (`/identity`)
— hai hệ thống này đã ổn định, chỉ nhận thay đổi được nêu rõ ở tài liệu 07.

## Danh mục

| # | Tài liệu | Đối tượng đọc chính |
| --- | --- | --- |
| 01 | [Technical Specification](01-technical-specification.md) | Toàn đội |
| 02 | [UX/UI Specification](02-ux-ui-specification.md) | UI designer, Frontend |
| 03 | [Database Design](03-database-design.md) | Backend |
| 04 | [API Architecture](04-api-architecture.md) | Backend, Frontend |
| 05 | [Frontend Component Architecture](05-frontend-component-architecture.md) | Frontend, UI designer |
| 06 | [CMS Architecture](06-cms-architecture.md) | Backend, Frontend, SEO, Marketing |
| 07 | [Deployment Architecture](07-deployment-architecture.md) | DevOps, Backend |
| 08 | [Development Task Breakdown](08-task-breakdown.md) | Toàn đội, PM |

## Quyết định kiến trúc đã chốt (không mở lại trong sprint 0)

| ID | Quyết định | Lý do một dòng |
| --- | --- | --- |
| AD-01 | Giữ Next.js 15 App Router + Tailwind, **không** đổi framework | Đội đã có 17 route hoạt động; chi phí đổi > lợi ích trong 365 ngày |
| AD-02 | Xoá `globals.css` như nguồn chân lý thiết kế, chuyển sang design token trong `tailwind.config.ts` | 292 giá trị hex hardcode, `theme.extend` rỗng |
| AD-03 | CMS = **Wagtail 6.x** (Django + PostgreSQL) chạy ở container riêng `cms` | Đã có Django/Postgres trong stack; có sẵn revision, workflow, localization, RBAC, DAM |
| AD-04 | `cms` là **project Django tách biệt** khỏi `apps/api`, dùng database riêng `qts_cms` | Tách blast radius: CMS không được phép chạm bảng identity/auth |
| AD-05 | Frontend gọi API bằng **đường dẫn tương đối** `/api/...` qua Next.js rewrite, không dùng `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_*` bị nướng lúc build; đây là nguyên nhân lead endpoint trỏ `localhost:8000` |
| AD-06 | Ngôn ngữ mặc định `vi`, bản dịch `en`; định tuyến `/[locale]/...` | Công ty `.vn` nhưng `<html lang="en">` toàn site |
| AD-07 | Font thương hiệu tự host **Be Vietnam Pro** + **Inter** qua `next/font/local` | `Segoe UI`/`Helvetica Neue` không tồn tại trên macOS/Android/Linux và thiếu bộ dấu tiếng Việt ổn định |
| AD-08 | Analytics = **Plausible self-hosted** tại `https://qtsgroup.vn/stats` | Không cookie banner bắt buộc, không phụ thuộc DNS mới, không rò dữ liệu cho bên thứ ba |
| AD-09 | CRM giai đoạn 1 = **mô hình CRM nội bộ trong Django** + adapter webhook ra ngoài | Chưa có dữ liệu khách hàng để biện minh cho Salesforce/HubSpot trả phí |
| AD-10 | Xoá `apps/web/components/QtsSite.tsx` | Code chết, chứa form chuyển đổi trùng lặp thứ hai |
| AD-11 | Ảnh bật `next/image` (bỏ `images.unoptimized`) | Đang tắt hoàn toàn tối ưu ảnh |
| AD-12 | Không thêm DNS record mới ngoài `staging.qtsgroup.vn` | Nhà cung cấp DNS (iNET) đang chậm; giảm phụ thuộc |

## Baseline đã đo (2026-09-07/08) — dùng làm mốc so sánh

Nguồn: Lighthouse 12 chạy bằng Edge headless, `--form-factor=mobile`,
`--throttling-method=simulate`, trên `https://qtsgroup.vn`.

| Chỉ số | Giá trị lab | Ghi chú |
| --- | --- | --- |
| Performance | 99/100 | Trang tĩnh, 0 `<img>`, 76 KB CSS — chưa phải trang enterprise thực |
| Accessibility | 89/100 | Điểm cần lên ≥ 98 |
| Best Practices | 96/100 | `X-Powered-By`, source map, console |
| SEO (lab) | 100/100 | **Vô nghĩa**: `robots.txt` và `sitemap.xml` đều 404, không canonical/OG/JSON-LD |
| FCP | 1.0 s | |
| LCP | 2.0 s | |
| TBT | 20 ms | |
| CLS | 0 | Header `position:fixed` co 76→58px vẫn gây shift khi cuộn |
| TTFB | 30 ms | `X-Nextjs-Cache: HIT` |
| First Load JS `/` | 174 kB | Shared 103 kB |
| CrUX field data | **không có** | PageSpeed API trả `HTTP 429 Quota exceeded` — chưa đo được người dùng thật |

Cảnh báo bắt buộc khi trích dẫn các số trên: đây là **lab trên một trang gần như rỗng về
nội dung và ảnh**. Khi thêm ảnh thật, video, CMS content và nhiều route động, Performance
sẽ giảm. Mục tiêu SLO ở tài liệu 01 được đặt dựa trên trạng thái sau khi có nội dung.

## Định nghĩa hoàn thành chung (áp dụng cho mọi task)

1. Code chạy được local bằng `npm run dev` / `docker compose up`.
2. `npm run lint` và `npm run typecheck` sạch ở workspace liên quan.
3. Có test: `pytest` cho backend, Vitest + Testing Library cho frontend logic,
   Playwright cho 5 luồng người dùng cốt lõi.
4. Không hardcode giá trị thiết kế — phải dùng token (tài liệu 02).
5. Không hardcode URL, domain, secret — phải qua env hoặc rewrite (AD-05).
6. Accessibility: đạt mọi tiêu chí trong tài liệu 02 mục 6 trước khi merge.
7. Trang mới phải có `metadata`, canonical, OG, JSON-LD (tài liệu 04 mục 7).
8. Được review bởi ít nhất 1 người ngoài vai trò tác giả.
