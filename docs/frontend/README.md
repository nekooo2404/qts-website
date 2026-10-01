# QTS frontend architecture

## Runtime ownership

| Surface | Folder | Responsibility |
| --- | --- | --- |
| Public landing | `frontend-client` | Marketing pages, resources and consultation form |
| Portal launcher | `frontend-portal/portal` | Authenticated app launcher and business workspace |
| Identity UI | `frontend-portal/identity` | Login, logout, account security and MFA screens |
| HRM | `frontend-hrm` | HR operations, navigation and HR-specific workflows |
| Shared app chrome | `packages/app-chrome` | Search, app switcher, notifications, profile and common header behavior |
| Shared OIDC client | `packages/oidc-client` | PKCE, discovery, token verification and session lifecycle |

Application screens stay in their owning frontend. Shared packages contain only
behavior that is genuinely reused by at least two applications.

## Brand source of truth

The approved QTS logo is `frontend-client/public/images/brand/qts-logo.webp`.
Portal and HRM consume byte-identical copies at:

- `frontend-portal/portal/public/images/brand/qts-logo.webp`
- `frontend-hrm/public/images/brand/qts-logo.webp`

When the logo changes, update the landing asset first, copy it to both app
public folders, and verify all three SHA-256 hashes match before release.

## Navigation contract

- Landing uses the floating `.nav-inner` surface.
- Portal uses `@qts/app-chrome` for the shared floating header.
- HRM keeps its operational header and shared interaction patterns, while
  retaining its role-aware controls and app switcher.
- New business apps must use `@qts/app-chrome` instead of creating a new header.
- App switching is one click from the header; the current app is marked with
  `aria-current="page"`.

## Performance guardrails

- Build web, portal and HRM independently; do not run parallel builds on the
  1 GB production VPS.
- Keep images optimized and use `next/image` on the landing where applicable.
- Keep long operational lists virtualizable or paginated; do not add polling
  tighter than the existing 30-second consultation refresh.
- Prefer CSS transitions and existing motion tokens. Respect
  `prefers-reduced-motion`.
- Before release, run:

```powershell
npm run lint
npm run typecheck
npm run build:web
npm run build:portal
npm run build:hrm
npm run test:landing -- --reporter=line
npm run test:portal -- --reporter=line
```
