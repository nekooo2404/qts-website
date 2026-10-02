# QTS Enterprise Identity Gateway UX Specification

Nguồn kiến trúc: tài liệu "Báo cáo giải pháp thiết kế hệ thống đăng nhập tập trung cho hệ sinh thái Microservices Web nội bộ sử dụng Ory Kratos / Hydra".

Ghi chú phạm vi: tài liệu DOCX được dùng làm nguồn kiến trúc. Các yêu cầu triển khai đến từ chủ task hiện tại. UI không thay đổi boundary Ory Kratos, Ory Hydra hoặc ownership dữ liệu.

## PHẦN 1: Phân tích UX dựa trên kiến trúc

### Vai trò sản phẩm

Login Portal là Enterprise Identity Gateway, không phải màn login của một app riêng lẻ. Nó là điểm vào chung cho Portal, ERP, CRM, HRM, Document Management, Workflow System, Dashboard và các microservices nội bộ.

### Boundary cần thể hiện trong UI

- Ory Kratos: quản lý identity, credential, password, MFA, authentication flow.
- Ory Hydra: OAuth2/OIDC authorization layer, login challenge, consent challenge, application redirect.
- Business apps: không quản lý mật khẩu, chỉ nhận token hoặc session hợp lệ.
- Identity Sync Service: đồng bộ profile, tenant, vai trò và quyền theo event-driven architecture.
- Microservices: verify JWT RS256 local bằng public key cache, không gọi SSO cho mỗi nghiệp vụ.

### Nguyên tắc UX

1. Security > Convenience: copy, trạng thái và hành động ưu tiên an toàn phiên.
2. Consistency > Creativity: mọi flow dùng cùng tone, cùng component, cùng nhịp tương tác.
3. Architecture > Visual Effect: UI giải thích Kratos/Hydra/redirect bằng ngôn ngữ người dùng hiểu.
4. No user enumeration: lỗi credential luôn generic.
5. No false persistence: frontend không hứa ghi nhớ thiết bị hoặc tạo session nếu backend chưa bật.

## PHẦN 2: Wireframe

### Login Screen

```text
┌──────────────────────────────────────────────────────────────────────┐
│ QTS Identity Gateway                                 Service online   │
├───────────────────────────────┬──────────────────────────────────────┤
│ Đăng nhập hệ sinh thái         │ [Card] Đăng nhập hệ sinh thái        │
│ doanh nghiệp                   │                                      │
│                                │ [ Đăng nhập SSO              > ]     │
│ Apps: ERP CRM HRM DMS          │ [ Tài khoản nội bộ           > ]     │
│ Workflow Dashboard             │ [ Tài khoản khác             > ]     │
│                                │                                      │
│ Luồng xác thực trung tâm       │ SSO / Local form state               │
│ 1 Login Portal                 │ Security notice                      │
│ 2 Ory Hydra                    │ Account support links                │
│ 3 Ory Kratos                   │                                      │
│ 4 Application Redirect         │                                      │
└───────────────────────────────┴──────────────────────────────────────┘
```

### SSO Redirect Screen

```text
[Bạn đang xác thực thông qua hệ thống Identity trung tâm]
Enterprise Identity Service
Authentication Provider:
- OIDC Authorization Code Flow
- Secure Token Exchange
- Encrypted Session Boundary

[Continue SSO provider button when Kratos exposes oidc group]
Fallback: use internal account when no external provider is configured.
```

### Local Login Screen

```text
[Email hoặc tên đăng nhập]
[Mật khẩu]
[ ] Ghi nhớ thiết bị này
[Đăng nhập tài khoản nội bộ]

Notice: Local Login vẫn đi qua Identity Platform.
```

### MFA Screen

```text
[Mã xác thực 6 số]
[Xác nhận MFA]

Secondary:
[Dùng mã dự phòng]
```

### Error Screen

```text
Invalid credential:
Thông tin đăng nhập chưa đúng. Vui lòng kiểm tra lại.

Session expired:
Phiên đăng nhập đã hết hạn vì lý do bảo mật.
[Đăng nhập lại]

SSO unavailable:
Identity Service đang bảo trì hoặc không phản hồi.
Correlation ID
Timestamp
Support Information

Permission denied:
Bạn chưa được cấp quyền truy cập chức năng này.
```

## PHẦN 3: UI High Fidelity

### Layout

- Desktop 1920x1080: two-column gateway layout, left architecture context, right auth card.
- Laptop 1366x768: compact spacing, same two-column structure.
- Tablet: single column, architecture panel above auth card.
- Mobile: header, auth card first usable without horizontal scroll, system details remain stacked.

### Visual system

- Primary: deep enterprise navy for authoritative CTA and active auth mode.
- Secondary: slate surfaces for neutral enterprise system states.
- Success: restrained emerald for service online and completed security capabilities.
- Warning: amber for expired session and recoverable attention.
- Error: red for unavailable service and invalid form states.
- Background: light slate in light mode, near-navy slate in dark mode.

### Typography

- Family: system sans stack for enterprise reliability and fast load.
- Heading: 32-48px depending on viewport, tight tracking.
- Body: 14-16px, line height 1.6.
- Button: 14px semibold, min height 44px.
- Metadata: 12px, never used as the only status signal.

### Interaction

- Auth mode selector behaves like tabs.
- SSO and local login remain separate mental models.
- Submit shows secure session progress:
  - Đang tạo phiên bảo mật
  - Đang cấp quyền truy cập ứng dụng
  - Đang đồng bộ Identity
- Escape/click handling stays inside Kratos flow ownership.
- Dark/light mode uses `data-theme` on `<html>` and persists in localStorage.

## PHẦN 4: Developer Design Specification

### Component structure

```text
LoginPortal
├── BrandHeader
│   └── ThemeToggle
├── GatewayArchitecturePanel
├── AuthenticationSelector
├── SsoBrowserFlow
├── KratosFlowForm
├── SecureSessionProgress
├── SecurityNotice
├── SessionExpiredState
├── ServiceUnavailableState
├── PermissionDeniedState
└── Footer
```

### Component props

| Component | Props | Purpose |
|---|---|---|
| `SignInForm` | `kind`, `emailFlowsEnabled` | Entry point for login, settings, recovery, verification |
| `AuthenticationSelector` | `mode`, `onMode`, `onRestart` | Switch SSO, local login, account switch |
| `SsoBrowserFlow` | `hasOidcGroup` | Explain Hydra/Kratos SSO and render provider fallback |
| `SessionExpiredState` | `kind` | Restart expired Ory flow |
| `ServiceUnavailableState` | `support`, `message` | Show outage details without leaking internals |
| `GatewayArchitecturePanel` | `busy` | Show login sequence and active session creation |

### State

- `flow`: current Ory Kratos flow from `/kratos/self-service/{kind}/flows`.
- `mode`: `sso | local | alternate`.
- `busy`: submit in progress.
- `error`: generic localized error.
- `trustDevice`: UI-only pending backend trusted-device support.
- `support`: client support context with correlation id and timestamp.

### API interaction

- Start browser flow:
  - `GET /kratos/self-service/{kind}/browser`
- Load flow:
  - `GET /kratos/self-service/{kind}/flows?id=...`
- Submit flow:
  - `POST flow.ui.action`
  - `Content-Type: application/x-www-form-urlencoded`
  - `credentials: same-origin`
- Redirect:
  - `redirect_browser_to` from Kratos or `flow.return_to`
- Constraints:
  - UI only accepts same-origin Identity paths.
  - No token is stored in frontend state.
  - App session should be delivered through secure HttpOnly cookie by backend.

### Security headers and session expectations

- HttpOnly cookie for session.
- CSRF protection on non-idempotent API calls.
- CSP with nonce for identity pages.
- `Cache-Control: no-store` for auth pages and API.
- `X-Frame-Options` or CSP `frame-ancestors` to prevent clickjacking.
- `Referrer-Policy: same-origin`.

## PHẦN 5: Prompt cho AI Design Tool

```text
Design a production-ready Enterprise Identity Gateway for a microservices ecosystem using Ory Kratos and Ory Hydra.

Context:
- This is not an app-specific login screen.
- It is the shared gateway for ERP, CRM, HRM, Document Management, Workflow System, Dashboard and internal microservices.
- Kratos owns identity, credential and authentication flow.
- Hydra owns OAuth2/OIDC authorization, challenge and redirect.
- Business apps do not store passwords.
- Access tokens are short-lived JWT RS256.
- Refresh is handled by secure session.
- User profile and app entitlements are synchronized through an Identity Sync Service.

Visual direction:
- Enterprise, modern, security-first, minimal, professional, high availability platform.
- Avoid social app, gaming, excessive animation, excessive color.
- Light and dark mode.
- Strong hierarchy, restrained navy/slate palette, clear security language.

Required screens:
1. Initial Login Page with QTS Identity Gateway brand and choices:
   - Đăng nhập SSO
   - Đăng nhập tài khoản nội bộ
   - Đăng nhập bằng tài khoản khác
2. SSO flow state showing:
   - Enterprise Identity Service
   - OIDC Authorization Code Flow
   - Secure Token Exchange
   - Encrypted Session Boundary
3. Local Login:
   - Username or email
   - Password
   - Remember Device
   - Forgot Password
   - MFA future-ready area
4. Loading state:
   - Đang tạo phiên bảo mật
   - Đang cấp quyền truy cập ứng dụng
   - Đang đồng bộ Identity
5. Error states:
   - Invalid credential with generic message
   - Session expired
   - SSO unavailable with Correlation ID, Timestamp, Support Information
   - Permission denied without exposing role names

Output:
- Responsive desktop, laptop, tablet, mobile layouts.
- WCAG 2.2 accessible controls.
- Componentized React/Next.js App Router structure.
- TailwindCSS and shadcn-style owned components.
```
