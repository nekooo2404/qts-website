# QTS HRM Design System

<!-- impeccable:design-schema 1 -->

## Record

- **Product:** QTS HRM
- **Status:** derived from the shipped React/CSS artifact on 2026-09-12
- **Primary evidence:** `src/styles.css`, `src/App.tsx`, `src/design-system/components.tsx`, `src/design-system/charts.tsx`, and the desktop/mobile review rasters
- **World:** a daylight, desktop-first QTS operations workspace: soft blue-gray canvas, inset white work surfaces, one QTS-blue product accent, compact operational data, and explicit fixture/security boundaries.
- **Build over brief:** the artifact retains the direction's 240px inset navigation, 56px toolbar, white layered surfaces, blue operational emphasis, and four-weight KPI command header. It uses semantic success, warning, and danger colors in addition to QTS Blue for statuses.

## Foundations

### Color

| Role | CSS token / value | Shipped use |
|---|---|---|
| Product action | `--qts-blue: #2563eb` | primary buttons, active navigation, chart series, focus, selected controls |
| Product hover | `--qts-blue-hover: #1d4ed8` | primary-button hover, active text, active chart bar |
| Product subtle | `--qts-blue-subtle: #eff6ff` | active navigation, primary KPI, avatars, selected states |
| Product ink | `--qts-blue-ink: #1e40af` | primary KPI value, agenda time, security emphasis |
| Success | `--success: #16a34a`; `--success-subtle: #f0fdf4` | positive badges, status dots, completion timeline |
| Warning | `--warning: #f59e0b`; `--warning-subtle: #fffbeb` | fixture notice, pending status, operational attention |
| Danger | `--danger: #dc2626`; `--danger-subtle: #fef2f2` | errors, destructive controls, incomplete/failed status |
| Canvas | `--bg: #eef1f6` | application canvas under a low-opacity QTS-blue radial wash |
| Surfaces | `--card: #fff`; `--surface-muted: #f8fafc` | resting cards and muted controls/list hover states |
| Borders | `--border: #e2e8f0`; `--border-soft: #edf1f7`; `--border-strong: #cbd5e1` | card, shell, control, and table separation |
| Text | `--text: #0f172a`; `--text-secondary: #475569`; `--text-muted: #64748b` | ordered content hierarchy |

QTS Blue is the only product-brand accent. Green, amber, and red communicate system state; they do not identify product areas or replace the primary action color.

### Typography

- **Family:** `Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Arial, sans-serif`; Inter 400/500/600/700 is loaded by `index.html`.
- **Numerals:** tabular numerals are global; KPI, chart, agenda-time, and payroll values preserve numeric alignment.
- **Display:** command greeting is `clamp(27px, 3vw, 34px)` at `1.08` with `-.045em`; launcher heading reaches `36px`.
- **Page title:** `24px/32px`, `-.035em`; mobile page title is `22px/28px`.
- **Section title:** `16px/22px`; chart heading is `15px/21px`; employee spotlight is `18px/23px`.
- **Body:** primary explanatory copy is `14px/20px`; navigation and tables use `13px`; controls use `12px`.
- **Utility:** labels, metadata, badges, table headers, and supporting lines are predominantly `10–11px`; icons are Heroicons and follow the adjacent control hierarchy.

### Shape, depth, and motion

| Role | CSS token / value | Rule |
|---|---|---|
| Inner | `--radius-inner: 10px` | badges, small icons, compact controls |
| Control | `--radius-control: 12px` | buttons, inputs, nav items, notices |
| Container | `--radius-container: 16px` | cards, header, filters, popovers, modals |
| Command surface | `--radius-large: 24px` | sidebar and employee spotlight |
| Resting cards | `1px` border, no resting shadow | hierarchy comes from canvas contrast and borders |
| Raised chrome | `--shadow-raised` | sidebar, auth card, profile header, application-card hover |
| Floating layer | `--shadow-pop` or `--shadow-sheet` | menus, audit toast, modal, mobile navigation |
| Motion | `--dur-fast: 140ms`; `--dur: 220ms`; `--dur-slow: 380ms` | brief color, border, transform, and popover transitions using the two shipped cubic-bezier curves |

Blur is reserved for translucent shell chrome and popovers (`blur(18px) saturate(1.15)`); it is not applied to content cards. Reduced-motion mode collapses transitions and skeleton motion.

### Spacing

The artifact does not expose spacing custom properties. Its reusable layout rhythm is evidenced by the following values:

- Shell inset: `16px`; sidebar width: `240px`; shell column gap: `16px`.
- Workspace content padding: `24px` desktop, `22px` at compact desktop, and `17px 4px 0` on mobile.
- Repeated grid gaps: `12px` for KPI/employee grids and `14px` for paired content regions; dashboard lower regions use `14px`.
- Card padding: `18px` normally, `17px` on charts/stat tiles, `20px` on command trend and employee spotlight, and `14px` on mobile.
- Controls: standard button height `34px`, compact button height `30px`, header/icon controls `36px`, navigation rows `38px` minimum.

## Layout rules

### Application shell

- Desktop is an inset two-column shell: sticky `240px` sidebar and flexible workspace, each inside a `16px` outer frame.
- The sidebar is viewport-height minus `32px`, `24px` rounded, white at `92%` opacity, bordered softly, and elevated. Its navigation is scrollable; support stays pinned at the bottom.
- The sticky toolbar is `56px`, rounded `16px`, white at `88%` opacity, and houses search, app launcher, notification, and profile controls.
- Main content is capped at `1440px`, centered, and padded `24px`. A persistent yellow fixture banner precedes every in-app screen.

### Command center

- The command heading pairs a greeting and operational sentence with a right-aligned date on desktop; it stacks on mobile.
- Metrics are intentionally uneven: the first metric occupies `1.45fr`; remaining metrics use equal columns. The primary headcount KPI carries blue-subtle background and blue-ink value.
- The trend and agenda form a `1.4fr / .75fr` pair. The employee spotlight and queue below use `1.05fr / .95fr`.
- Cards communicate task destination through click/hover states, not decorative elevation. The trend chart has one blue series, blue-tinted area, hover crosshair/tooltip, and a native `<details>` table fallback.

### Information and data views

- Page headers use breadcrumb, title, optional description, then actions; action groups remain compact and horizontally scrollable on mobile.
- Tables live inside horizontal scrolling card regions, with sentence-case sticky headers and `690px` minimum table width by default.
- Employee records offer three-column desktop card grids or a data table. Avatars are blue-subtle rounded-square identity tiles with initials, not photographic profiles.
- Security information is surfaced as bordered blue-tinted notes, explicit locks, masked fields, audit feedback, and access-denied states. UI gates indicate intent only; the build's own copy states that API policy remains authoritative.

## Components

### Buttons and icon controls

- `Button` has `primary`, `secondary`, `ghost`, and `danger` variants, with `sm` and default sizes.
- Primary is blue fill with white text; secondary is white with strong border; ghost stays transparent; danger is red fill.
- Buttons use 12px semibold text, `34px` minimum height, 12px corner radius, and a `translateY(1px)` active state. Disabled controls use `#f1f5f9` and `#94a3b8`.
- Icon controls are `36px` squares; inline action icons are `28px` squares. Every reusable icon control receives an accessible label and title in code.

### Cards, badges, status, and avatars

- `Card` is the default content boundary: white surface, `1px` border, 16px radius, 18px padding, and no resting shadow.
- `Badge` is a 10px semibold, 20px-minimum pill-like label with 10px radius. Tones are neutral, blue, success, warning, danger, and info.
- Status combines label-bearing badges and, in lists, an 8px semantic dot; color is never the only status signal.
- Avatars use a 30% rounded-square treatment: `28px`, `36px`, or `64px`, with QTS-blue-subtle ground and blue-ink initials.

### Navigation, search, and overlays

- Active navigation uses blue-subtle fill, blue hover ink, semibold label, and blue icon. Navigation headings are the only shell-level uppercase grouping markers.
- Global search is a command modal with keyboard cursor state, `Escape` close, grouped results, and a focused input.
- Menus, drawers, and modal dialogs use white floating surfaces, 16px rounding, border separation, backdrop, and named close controls. Drawer shadow is directional from the right.
- Z-index roles are explicit: table/step `1`, tooltip `2`, header `15`, sidebar `20`, command palette `70`, overlays `80`, toast `100`, and skip link `200`.

### Forms, tables, charts, and workflow

- Inputs/selects are 36px minimum, white, strongly bordered, 10px rounded, and use QTS-blue caret/focus treatment. Selects use CSS-drawn chevrons.
- Filter bars are white 16px containers; labels are 10px semibold; filters preserve native date, number, select, textarea, and file inputs.
- Tables keep data at 13px, headers at 11px semibold with `0.04em` tracking, and fine `1px` row dividers.
- Charts are bespoke SVG line/column charts: a single QTS-blue data series, pale blue area for lines, local hover tooltip, and accessible tabular fallback. No pie, rainbow, or dual-axis treatment appears in the build.
- Workflow renders named queue states, numbered timeline steps, status badges, and explicit approve/reject controls. Sensitive actions report audit feedback in a floating toast.

## Responsive and accessibility rules

- At `1023px` and below, the sidebar becomes a `64px` icon rail; four-stat grids become two columns.
- At `767px` and below, the sidebar is removed, the shell becomes a 10px inset single column, content prioritizes two-column KPIs where possible, and a fixed elevated bottom navigation exposes essential destinations.
- At `430px` and below, dashboard operation/stat/payroll grids reduce to a single column. Tables retain horizontal scroll rather than compressing data columns beyond their defined widths.
- Focusable controls receive a 2px QTS-blue visible outline with 2px offset. The shell includes a high-z-index skip link, icon controls use names, dialogs close with Escape, and charts expose a native data table.
- Status is named with text/badges in addition to color; motion respects `prefers-reduced-motion`.

## Not canonized

The launcher contains a green/warning `.eyebrow` status line, and several operational supporting labels render at 9–10px. Neither is a future system rule: the first is a shipped fixture/SSO-status exception rather than a page kicker, and the latter is below a durable legibility standard despite appearing in the artifact.
