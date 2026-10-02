# QTS Portal Design System

<!-- impeccable:design-schema 1 -->

## Record

- **Product:** Cổng thông tin QTS
- **Status:** derived from the shipped React/CSS artifact on 2026-09-13
- **Primary evidence:** `src/styles.css`, `src/PortalApp.tsx`, `index.html`, and the portal desktop/mobile review rasters
- **World:** a daylight enterprise portal shell: soft blue-gray canvas, white translucent chrome and cards, QTS Blue as the product action accent, compact Vietnamese operational surfaces, and explicit empty-data and identity boundaries.
- **Build over brief:** the shipped portal is a module switchboard and presentation shell rather than a populated operating system. It preserves the inset navigation, sticky topbar, KPI/dashboard compositions, module views, access matrix, OIDC entry states, and mobile collapse visible in the artifact.

## Foundations

### Color

| Role | CSS token / value | Shipped use |
|---|---|---|
| Product action | `--qts-blue: #2563eb` | primary buttons, active navigation, icons, focus outlines, access toggles, logo mark |
| Product hover | `--qts-blue-hover: #1d4ed8` | active navigation text, hovered primary actions and command items |
| Product subtle | `--qts-blue-subtle: #eff6ff` | selected navigation, KPI emphasis, avatars, module icons, access states |
| Product ink | `--qts-blue-ink: #1e40af` | emphasized KPI and identity values |
| Success | `--success: #16a34a`; `--success-subtle: #f0fdf4` | positive access summary and available-state treatments |
| Warning | `--warning: #f59e0b`; `--warning-subtle: #fffbeb` | warning state tokens and semantic notice treatments |
| Danger | `--danger: #dc2626`; `--danger-subtle: #fef2f2` | sign-out/error treatments and login errors |
| Canvas | `--bg: #eef1f6` | full application background with low-opacity blue radial washes |
| Soft surface | `--bg-soft: #f5f7fb` | declared soft canvas token |
| Surfaces | `--card: #fff`; `--surface-muted: #f8fafc` | cards, controls, muted panels, empty states, table headers |
| Borders | `--border: #e2e8f0`; `--border-soft: #edf1f7`; `--border-strong: #cbd5e1` | card, shell, row, control, and input separation |
| Text | `--text: #0f172a`; `--text-secondary: #475569`; `--text-muted: #64748b` | primary, explanatory, and metadata hierarchy |

QTS Blue is the sole product-brand accent. Green, amber, and red communicate state or error; they do not identify modules. The portal uses white, blue-gray, and semantic state colors rather than a multi-brand module palette.

### Typography

- **Family:** `Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Arial, sans-serif`; Inter weights 400/500/600/700 are loaded by `styles.css` through Google Fonts.
- **Numerals:** `font-variant-numeric: tabular-nums` is global.
- **Page title:** `24px/32px`, `-.035em`; mobile `22px/28px`.
- **Login title:** `25px`, mobile `23px`; access-denied title `22px`.
- **Section title:** `16px/22px`; mobile panel heading `15px`.
- **Body:** page descriptions `14px/20px`; navigation and tables `13px`; compact controls `11–12px`.
- **Utility:** labels, table headers, badges, profile metadata, and empty states are predominantly `10–12px`; headings use balance/pretty wrapping where declared.
- **Iconography:** Heroicons outline components are used for navigation, actions, identity, and status; the logo mark and waffle launcher are CSS-built marks, not glyph icon substitutes.

### Shape, depth, and motion

| Role | CSS token / value | Rule |
|---|---|---|
| Inner | `--radius-inner: 10px` | badges, small icons, inputs, compact surfaces |
| Control | `--radius-control: 12px` | buttons, navigation rows, filters, notices, access toggles |
| Container | `--radius-container: 16px` | topbar, cards, panels, login card, menus, command modal |
| Large shell | `--radius-large: 24px` | sidebar and empty-state profile rail |
| Resting card | `1px` border, no resting shadow | content panels use surface contrast and borders |
| Raised chrome | `--shadow-raised` | sidebar, login card, empty profile rail |
| Floating layer | `--shadow-pop` | command palette, waffle panel, profile menu, tooltip-like surfaces |
| Motion | `150ms`, `250ms`, `350ms`, `400ms`; `cubic-bezier(0.22, 1, 0.36, 1)` | brief hover/active transitions and Framer Motion enter/exit states |

Translucent shell chrome and floating menus use `backdrop-filter: blur(18px) saturate(1.15)`; ordinary content cards do not. The command overlay adds a dark translucent backdrop and 3px blur. `prefers-reduced-motion: reduce` collapses transitions, animation duration, and smooth scrolling.

### Spacing

The artifact does not expose spacing custom properties. Reused layout values are:

- Shell inset `16px`; sidebar width `240px`; shell gap `16px`; sidebar height `calc(100dvh - 32px)`.
- Topbar minimum height `56px`; main content max width `1440px` and desktop padding `24px`.
- Common grid gaps `12px` for KPI/module columns and `14px` for paired dashboard regions.
- Panel padding `19px` in dashboard content, `18px` in generic panels, `14–15px` on mobile.
- Control height `36px`; navigation rows `38px` minimum; login input `40px` minimum.
- The base rhythm is approximately 8px, with repeated 4px/6px/8px/12px/14px/16px/18px/24px intervals.

## Layout rules

### Application shell

- Desktop is an inset two-column shell: sticky `240px` sidebar plus flexible workspace, with `16px` outer padding and gap.
- The sidebar is viewport-height minus `32px`, rounded `24px`, softly bordered, white at `92%` opacity, elevated, and internally split between scrollable navigation and a bottom-pinned profile.
- The topbar is sticky at `16px`, minimum `56px`, rounded `16px`, white at `88%` opacity, and contains breadcrumb, command trigger, app launcher, notification, and help/data controls.
- Main content is centered within a `1440px` cap. Page headings pair title/description with a desktop date-filter presentation control; the filter is hidden on mobile.
- When no module entitlement exists, the shell removes the normal sidebar and retains a compact profile rail so the access-denied state remains identifiable without presenting module navigation.

### Dashboard and module views

- Dashboard KPI layout is intentionally uneven: first card `1.4fr`, then four equal columns. At desktop the first KPI is blue-subtle; all values are em dashes with explicit “Chưa kết nối dữ liệu” copy.
- Dashboard content uses a `1.4fr / .8fr` chart/system pair, then a `1.05fr / .95fr` project/activity pair. The shipped artifact renders empty panels and an empty project table rather than invented metrics.
- Projects presents a permission-scoped overview table or a four-column Kanban presentation. CRM presents four pipeline stages and an empty account table. HR and Finance reuse KPI, table, and paired-panel compositions. Developer adds a terminal-style empty request log. Analytics presents a paired analysis/attention layout.
- Settings leads with a read-only access summary and module matrix, then three organization/authentication/identity-console support cards.
- Module navigation, command search, and the waffle launcher are filtered from `PortalEntitlements.modules`; the rendered page falls back to an allowed module when the current page is no longer entitled.

### Identity and authorization boundary

- Authentication is delegated to QTS Identity using the OIDC authorization-code flow with PKCE. The portal restores and refreshes the session, loads `/oauth/userinfo`, `/api/portal-entitlements` and `/api/launcher`, and exposes sign-in, authenticating, error, sign-out, and expired-session states.
- QTS Identity is the single source of truth for the person, roles and entitlements shared with QTS HRM. Neither SPA replicates or stores user data: both read the same subject claims, and the provider session cookie makes an already-authenticated browser pass silently to the other product.
- After a successful session, the portal lands on a two-product chooser before the shell. It can only present the Portal and HRM entries returned by `/api/launcher`; the current-product card opens the portal shell and the HRM card starts that SPA's same-tab PKCE handoff. The API filters the source list through `can_access_application`; the presentation filter never grants access — UI visibility is not authorization.
- The settings access matrix is presentation and entitlement UI only. It communicates the entitlements received from QTS Identity; it does not grant, revoke, persist, or enforce authorization.
- QTS Identity and the API remain authoritative for authentication, module access, management rights, data access, and protected operations. UI visibility is not authorization.
- Current controls, tables, cards, empty states, labels, and navigation do **not** assert persistence, approvals, exports, automation, or live AI analysis. The dashboard export icon, add/deploy buttons, date filter, Kanban mode, analysis ranges, and QTS Intelligence copy are presentation affordances in this shipped artifact until backed by real domain APIs and audited behavior.

## Components and states

### Navigation, commands, and menus

- Active sidebar links use blue-subtle fill, blue-hover text, semibold weight, and blue icons. Section labels are uppercase, muted, and tracked; they are shell grouping labels, not page kickers.
- The command trigger is a muted-surface `36px` control with search icon and a `⌘ K` key hint. `Ctrl/Cmd + K` opens a focused command modal; Escape closes it and clicking the backdrop dismisses it. Results contain only allowed modules and show an explicit no-match empty state.
- The waffle launcher is a 3×3 CSS dot button with an anchored floating grid of allowed QTS modules plus an external QTS Mail link. Outside click and Escape close it.
- Profile menus expose the current identity and sign-out action; Escape closes the menu. The access-denied layout preserves this profile affordance even when no modules are available.

### Buttons, controls, and forms

- `.portal-button` is the primary action: blue fill, white text, `36px` minimum height, `12px` radius, semibold `12px` type, darker hover, and a `translateY(1px)` active state. Disabled buttons use pale blue fill and border.
- `.icon-action` is a `36px` square ghost control; hover adds muted surface/border and active state scales to `.94`. Named `aria-label` values are present on icon-only controls.
- Inputs are white, `40px` minimum, strongly bordered, `10px` radius, blue caret, and a blue border plus translucent ring on focus. The command input is a borderless `56px` modal header field.
- Badges are compact semantic labels with `10px` type, `20px` minimum height, and `10px` radius. Access rows use text beside visual toggle tracks; state is not communicated by color alone.

### Cards, tables, workflows, and empty states

- `.panel` is the default content boundary: white card, `1px` border, `16px` radius. KPI, chart, system, project, activity, access, setting, and denied cards specialize padding and minimum height without changing the surface language.
- Tables use `13px` body text, `11px` uppercase/tracked headers, fine row dividers, and empty content inside the table body. Data is not compressed into fabricated values.
- Kanban and CRM boards use horizontally scrollable four-column grids with muted column surfaces and white inner cards. They represent view modes and staging presentation, not persistence or workflow execution.
- Empty states use muted `12px` copy and explicit source/status wording such as “Chưa kết nối dữ liệu”, “Chưa có ... để hiển thị”, or “Chưa ghi nhận ...”. Access denial uses a centered lock icon, a clear title, and a request-access explanation.

## Responsive and accessibility rules

- At `1110px` and below, the KPI grid becomes three columns and hides KPI cards after the third.
- At `850px` and below, the sidebar becomes a `68px` icon rail; labels, section headings, counts, breadcrumb, and profile text are hidden. Dashboard paired regions become one column. The profile rail follows the same compact treatment.
- At `700px` and below, settings cards become one column and horizontally wide boards bleed to the viewport edge for scrolling.
- At `580px` and below, the shell becomes a single column with `10px` base outer padding plus device safe-area insets; the sidebar is hidden, topbar controls compact, the main content uses `17px 4px` padding plus safe-area bottom padding, KPIs become two columns with only the first two shown, and table columns are selectively hidden. Waffle and profile menus become fixed mobile overlays with notch and gesture-area clearance.
- Login and access-denied states remain centered and bounded on mobile; access matrices preserve a `460px` minimum width and scroll horizontally rather than destroying column meaning.
- Focusable buttons, inputs, links, and tab-indexed elements receive a visible `2px` QTS-blue outline with `2px` offset. Icon-only controls have accessible labels; menus expose `role`, `aria-label`, `aria-haspopup`, `aria-expanded`, or `role="menuitem"` as appropriate. Escape routes exist for command, waffle, and profile overlays.
- `html` is `lang="vi"`; body and controls inherit the Inter stack; disabled controls communicate disabled state through cursor and styling; reduced-motion support is explicit.

## Not canonized

- The desktop review raster shows a calm, sparse empty-data dashboard; its missing data is a fixture/integration boundary, not a rule that future portal surfaces should be empty.
- Export, add, deploy, date-range, Kanban, analysis-range, and notification/help controls are retained as presentation affordances because the source renders them, but they are not recorded as persistence, approval, export, automation, or live-analysis capabilities.
- The command key hint is rendered as `⌘ K` even though the handler supports both Meta and Ctrl; this is a shipped affordance detail, not a universal keyboard-platform rule.
- No hard offset shadows, decorative kickers/eyebrows, glyph icon system, or system display face is canonized. The portal's CSS-built logo and waffle dots are product marks, while operational icons use Heroicons.
