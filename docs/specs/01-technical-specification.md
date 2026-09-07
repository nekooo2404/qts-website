# 01 — Technical Specification

> Đối tượng: toàn đội. Tài liệu này là hợp đồng kỹ thuật — mọi quyết định khác phải tuân thủ.

## 1. Bối cảnh & mục tiêu

Website hiện tại (`qtsgroup.vn`) là 17 route Next.js tĩnh, nội dung hardcode trong TSX, không CMS, không pipeline nội dung, form liên hệ trỏ nhầm `localhost:8000`, không SEO metadata, không analytics. Mục tiêu chuyển thành website enterprise đạt chuẩn quốc tế có khả năng tự vận hành nội dung, thu lead, đo lường và mở rộng trong 5 năm.

## 2. Phạm vi

**Trong phạm vi:** marketing site, CMS, API lead/CRM nội bộ, SEO, analytics, hạ tầng.
**Ngoài phạm vi:** Portal (`portal.qtsgroup.vn`), Identity Center (`/identity`), Keycloak — chỉ chạm khi tài liệu 07 nêu rõ.

## 3. Ràng buộc cứng

- VPS duy nhất `103.75.185.136:24700`, Caddy là ingress duy nhất 80/443, mọi service bind `127.0.0.1`.
- DB PostgreSQL 16 single instance, volume `qts_postgres` — cấm `down -v`.
- Gunicorn 2 workers (giới hạn RAM VPS).
- Không có CI/CD — deploy qua `deploy.sh` thủ công.
- DNS phụ thuộc iNET chậm — hạn chế tạo record mới.

## 4. Yêu cầu chức năng (FR)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-01 | CMS headless quản lý toàn bộ trang marketing | Editor tạo/sửa/xuất bản không cần dev |
| FR-02 | Workflow duyệt bài (draft→review→publish) | Có role Editor/Reviewer/Admin, lịch sử revision |
| FR-03 | Đa ngôn ngữ vi (mặc định) + en | Mỗi entry có bản dịch, hreflang, slug riêng |
| FR-04 | Form liên hệ hoạt động | Gửi được từ `qtsgroup.vn`, lưu DB, gửi email, không spam |
| FR-05 | CRM nội bộ quản lý lead | List/filter/status/assign, audit log |
| FR-06 | Tài nguyên (resources) có phân loại, tag, tìm kiếm | Không hardcode trong TSX |
| FR-07 | SEO tự động | robots, sitemap, canonical, OG, JSON-LD, hreflang |
| FR-08 | Analytics + consent | Đo pageview, conversion, tôn trọng DNT/GDPR-lite |
| FR-09 | DAM (quản lý ảnh/tài liệu) | Upload, resize, alt text, phân quyền |

## 5. Yêu cầu phi chức năng (NFR) — có số đo

| ID | Chỉ số | Mục tiêu | Đo bằng |
|---|---|---|---|
| NFR-01 | LCP p75 | ≤ 2.5s | CrUX / RUM |
| NFR-02 | CLS p75 | ≤ 0.1 | CrUX |
| NFR-03 | INP p75 | ≤ 200ms | CrUX |
| NFR-04 | Accessibility | ≥ 98 Lighthouse, WCAG 2.2 AA | Lighthouse + axe |
| NFR-05 | Lead delivery | ≤ 60s từ submit đến email/DB | Log timestamp |
| NFR-06 | Uptime marketing | 99.9% | Caddy + uptime check |
| NFR-07 | Build time | < 3 phút | `time docker build` |
| NFR-08 | Secrets | Không hardcode, qua env 0600 | Review |

## 6. Giả định (do thiếu dữ liệu)

- Chưa có số liệu traffic/conversion thực — giả định 5k visit/tháng giai đoạn đầu.
- Chưa có CRM ngoài — dùng CRM nội bộ, adapter webhook để nối HubSpot sau.
- Chưa có yêu cầu SSO cho editor ngoài Keycloak.

## 7. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| CMS làm nặng DB chính | DB riêng `qts_cms` + container riêng |
| Editor làm sập site | Preview + draft token, publish có review |
| Spam form | Honeypot + proof-of-work + rate limit |
| Mất volume DB | Cấm `down -v`, backup nightly 02:17 |

## 8. Tiêu chuẩn Definition of Done

Xem `README.md` mục 8 — áp dụng cho mọi task.
