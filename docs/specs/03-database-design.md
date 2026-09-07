# 03 — Database Design

> Đối tượng: Backend. CMS dùng DB riêng `qts_cms`; CRM/lead ở DB chính `qts`.

## 1. Nguyên tắc

- Không tạo hệ RBAC thứ hai. CMS reuse `identity` (Tenant/Permission/Role) qua mapping, nhưng **không chung DB** — CMS có bảng role riêng đồng bộ qua seed.
- Mọi bảng có `id uuid PK`, `created_at`, `updated_at`, `created_by`.
- PII (email, phone) mã hóa at-rest nếu lưu dài hạn; log không ghi PII thô.

## 2. DB `qts` — mở rộng `leads` → CRM nội bộ

Hiện tại `leads_lead` chỉ có 4 field + `created_at`. Giữ bảng, thêm migration:

```python
# apps/leads/models.py — thêm field, không xóa cũ
class Lead(models.Model):
    # đã có: name, email, company, message, created_at
    locale = CharField(max_length=5, default="vi")
    phone = CharField(max_length=32, blank=True)
    consent = BooleanField(default=False)  # bắt buộc true khi submit
    source_url = URLField(blank=True)      # trang gửi form
    utm_source / utm_medium / utm_campaign = CharField(blank=True)
    status = CharField(choices=[new, contacted, qualified, won, lost, spam], default="new")
    owner = FK(User, null=True, on_delete=SET_NULL, related_name="owned_leads")
    assigned_at = DateTimeField(null=True)
    idempotency_key = CharField(max_length=64, unique=True)  # dedupe
    spam_score = SmallIntegerField(default=0)

class LeadActivity(models.Model):
    lead = FK(Lead, on_delete=CASCADE, related_name="activities")
    actor = FK(User, null=True, on_delete=SET_NULL)
    action = CharField(choices=[created, status_changed, assigned, noted, emailed])
    payload = JSONField(default=dict)
    created_at = DateTimeField(auto_now_add=True)

# Index
# - Lead(status, created_at), Lead(email), Lead(idempotency_key) unique
# - LeadActivity(lead, created_at)
```

Migration plan: `AddField` nullable/default → backfill `locale="vi"` → `AlterField` not null nơi cần. Không drop data.

## 3. DB `qts_cms` — Wagtail + content

Dùng Wagtail 6.x. Wagtail tự tạo ~30 bảng (`wagtailcore_page`, `wagtailimages_*`, `wagtaildocs_*`, revisions, workflow). Chỉ định nghĩa thêm:

| Model | Mục đích |
|---|---|
| `Category` | Phân loại resources (solutions/industries/...) |
| `Tag` | Tag tự do |
| `Author` | Tác giả bài viết |
| `Page` (Wagtail Page subclass) | `HomePage`, `SolutionPage`, `ResourcePage`, `CompanyPage`... mỗi loại là 1 Page type với StreamField blocks |
| `Block` | StreamField block types: Hero, FeatureGrid, Testimonial, CTA, RichText, Image, FAQ — map 1-1 sang frontend blocks (05) |

- Localization: `wagtail-localize` — mỗi Page có `locale`, `translation_key`, `hreflang`.
- DAM: `wagtailimages` + `wagtaildocs` — lưu trên volume `cms_media`, serve qua Caddy `/cms-media/`.
- Workflow: Wagtail workflow `draft → review → approved → publish`, gán cho role Editor/Reviewer.

## 4. Quan hệ & ERD (rút gọn)

```
Lead 1—* LeadActivity
Lead *—1 User(owner)
Page 1—* PageRevision (Wagtail)
Page *—* Category, *—* Tag, *—1 Author
Page 1—* Block (StreamField, không bảng riêng)
Image/Document *—1 User(uploaded_by)
```

## 5. Retention & PII

- Lead `spam` auto purge sau 90 ngày.
- Lead `lost` ẩn PII sau 365 ngày (hash email).
- CMS media giữ vĩnh viễn, có soft-delete.

## 6. Seed & sync

- `seed_cms_roles` tạo role `cms_editor`, `cms_reviewer`, `cms_admin` trong DB `qts_cms`, map với Keycloak group.
- Không FK cross-database.
