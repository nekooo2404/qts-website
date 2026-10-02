# QTS Design Contract — qtsgroup.vn (Task 2)

> Owner: UX Architect (T2) — token/layout foundation for @qts/web.
> Next consumer: T3 (proof/hero/bento/nav content). Do not duplicate this file in `docs/frontend/`; this is the single source through T6.

## 1. Tone & Visual Direction

- **B2B Vietnam enterprise, macOS/light editorial, calm/trustworthy.** Finder/window chrome, soft paper backgrounds, ink-on-paper type. No dark-tech, violet, or glass-heavy redesign.
- Voice is operational and specific: processes, hand-offs, and measurable steps — not abstract platform claims.
- Imagery: real enterprise/industrial photos with sourced context; no generic stock hero. Motion is static unless measured evidence demands it (see §5).

## 2. Grid & Container

- Single container formula (no per-breakpoint widths):
  ```css
  .container { width: min(var(--container-max), calc(100% - var(--container-gutter))); margin-inline: auto; }
  ```
  where `--container-max: 1180px;` and `--container-gutter: clamp(20px, 4vw, 48px);`.
- Content max: section headings ≤ 640px / `62ch` for body copy. Case grid uses `.96fr / 1.04fr` asymmetry; bento/platform keep existing proportions but inherit the container.
- Gutters are fluid via `clamp()` so 320–380px phones never overflow.

## 3. Breakpoints

- Canonical: **768 / 1024 / 1280**. All responsive overrides are expressed at these widths.
- Legacy 1180/950/700/480/360 rules are collapsed into the three canonical queries (480 retained only for safe-area/touch tuning, 360 merged into 480).
- Mobile-first ordering: base (≥320) → `@768` → `@1024` → `@1280`. No additional intermediate breakpoints.

## 4. Radii, Shadows, Z-index, Spacing

- Canonical radii (macOS language):
  `--radius-sm: 8px` (tag/pill), `--radius-md: 12px` (control/card inner), `--radius-lg: 16px` (card/window), `--radius-xl: 20px` (panel), `--radius-window: 22px` (floating window), `--radius-pill: 999px`.
  Legacy `4px/10px` values are mapped to `sm/md` respectively.
- Shadows (three levels):
  `--shadow-card` (resting), `--shadow-surface` (floating), `--shadow-surface-hover` (lifted). Window uses `--mac-shadow-window`.
- Z-index scale: `--z-nav: 50`, `--z-menu: 60`, `--z-overlay: 200`, `--z-skip: 500`, `--z-cursor: 9999` (hidden on touch).
- Section spacing: `--space-section: 84px` (desktop), `--space-section-sm: 56px` (≤768), with inner heading gap `12–18px`. Implemented via `.section { padding: var(--space-section) 0; }`.

## 5. Motion Budget

- **Default: static.** `Reveal` is intentionally a pass-through (`components/marketing/Reveal.tsx`); no intersection observer.
- Allowed: `transform`/`opacity` ≤ 250ms `ease-smooth-out`, `box-shadow`/`border-color` ≤ 350ms. `page-enter` blur/translate is under `prefers-reduced-motion` and capped at `500ms`.
- All animations are disabled under `@media (prefers-reduced-motion: reduce)` — `animation: none; transition: none`.

## 6. Color & Theme

- Canonical light tokens: `--paper` (#ECEEF2-family soft), `--paper-strong` (#fff), `--ink` (#1D1D1F), `--muted` (#636366), `--signal` (#007AFF), `--signal-deep` (#0051D5), `--mint` (#5AC8FA). Aliases (`--ios-*`, `--mac-*`) point to these.
- **Dark preference:** `prefers-color-scheme: dark` keeps the marketing site on the light QTS enterprise palette. The landing page should not auto-switch to dark surfaces because the approved direction is light, technical, and enterprise-first.
- **Forced colors** (`forced-colors: active`) collapses glass/shadows, forces `Canvas/CanvasText`, and adds `1px solid CanvasText` borders to interactive surfaces so Windows HCM remains navigable.
- **Fallbacks:** `@supports not (backdrop-filter: blur(1px))` replaces glass nav/mega/hero-scenario/inspector with solid `var(--paper-strong)` and `var(--shadow-card)`.

## 7. A11y Notes

- Focus: `2px solid var(--signal)` + `2px offset` on all interactive elements; `.skip-link` is first focusable and translates in on focus.
- Touch targets ≥ 44px (`--btn` min-height, nav-menu, overlay close). `field-float` inputs use 16px to avoid iOS zoom.
- Contrast: body `var(--ink)` on `var(--paper)` passes AA; muted text is not used for UI labels that require AA (case-study overrides to #596764 where paper is darker). T6 will validate final ratios.
- Backdrop-filter is never the sole separator; every glass surface carries a `1px solid var(--mac-separator)` fallback.

## 8. Implementation Map (T2)

- `app/globals.css`: canonical tokens, `prefers-color-scheme`/`forced-colors`/`@supports` blocks, single container formula, radii/shadow alias normalization, representative hard-coded value → token replacements (`.qts-mark-loading`, `.brand-mark`, etc.). Breakpoint consolidation to 768/1024/1280.
- `app/page.tsx`: inline `style` on case heading and spacing → token-backed classes (no broad rewrite).
- `components/marketing/Reveal.tsx`: remains static (no scroll reveal reintroduced).
- T3/T4 will consume `var(--radius-*)`, `var(--shadow-*)`, `var(--space-section)`, `var(--signal)`/focus tokens; no redesign in this pass.
