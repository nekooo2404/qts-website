# QTS Marketing — Operational Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the violet/glass marketing visual system in `frontend-client` with the approved Operational Signal direction (warm paper + ink/teal/mint/signal tokens, Fraunces/Manrope/DM Mono).

**Architecture:** Single-pass restyle driven by `next/font` imports in `frontend-client/app/layout.tsx` plus a token/selector swap in `frontend-client/app/globals.css` (the site's ~763-line hand-written stylesheet). Components (`SiteHeader`, `SiteFooter`, `HomeExperience`, `PlatformExplorer`, `SolutionsBento`, `ProductExperience`, `CallToAction`, `PageHero`, page files) keep their routes, copy, and behavior; most restyle lands via existing class selectors. Only minimal TSX edits for the Operation Index artifact, signal-glyph brand, and inline color cleanups.

**Tech Stack:** Next.js 16.3.5 App Router + React 19 + TypeScript 5.9, `next/font/google`, `framer-motion` 12, hand-written `globals.css` (Tailwind installed but not driving the marketing surface), `recharts` (ProductExperience).

**Spec:** `docs/superpowers/specs/2026-09-15-qts-marketing-operational-signal-design.md`

## Global Constraints

- Scope is `frontend-client` only — do not touch `frontend-portal/portal` or `frontend-portal/identity`.
- Do not change copy, routes, navigation IA, SEO metadata construction (`lib/seo`), API contracts, auth, or form submission behavior (`ContactForm` PoW/honeypot/POST to `LEADS_PRIVATE_BASE_URL`).
- Tokens must match spec exactly: `--paper:#f1ede4`, `--paper-strong:#fbf8f1`, `--ink:#132022`, `--ink-soft:#173638`, `--muted:#596764`, `--signal:#ed5a37`, `--signal-deep:#c94a2a`, `--mint:#91ffe0`, `--line:rgba(19,32,34,.16)`, `--radius-*` `0–10px`. Remove violet (`#5b5cef`/`#4038c7`) and cyan (`#17b3dc`/`#4ac1df`) from the public marketing visual system; `recharts` accent colors remapped to signal/mint/ink scale where needed.
- Fonts: `Fraunces` 500–700, `Manrope` 400–800, `DM Mono` 400–500 via `next/font/google` in `frontend-client/app/layout.tsx`; system fonts only as final fallback. Do not promote Arial/Segoe UI/Helvetica Neue/Inter/Space Grotesk as primary faces.
- Illustrative content stays illustrative (keep existing “Minh họa”/disclosure language; Operation Index artifact is illustrative, not a new business claim).
- No new dependencies, component libraries, token frameworks, or asset pipelines. Use platform/CSS and already-installed deps only.
- Motion: CSS-first where possible, hero stagger 70–120ms, existing `Reveal` is the single scroll-reveal system, respect `prefers-reduced-motion` (disable transitions/animations).
- Accessibility: preserve semantic headings/links/buttons, visible keyboard focus in signal color, maintain or improve contrast on warm paper and ink surfaces.

---

### Task 1: Fonts + Design Tokens

**Files:**
- Modify: `frontend-client/app/layout.tsx`
- Modify: `frontend-client/app/globals.css:5-50`

**Interfaces:**
- Consumes: `next/font/google` (`Fraunces`, `Manrope`, `DM_Mono`), Tailwind directives already present in `globals.css:1-3`.
- Produces: CSS variables `--font-display` (Fraunces), `--font-sans` (Manrope), `--font-mono` (DM Mono) on `<html>`; updated `:root` tokens consumed by all later tasks.

- [ ] **Step 1: Add next/font imports to layout**

In `frontend-client/app/layout.tsx`, replace the current import block with:

```ts
import { Fraunces, Manrope, DM_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext", "vietnamese"], weight: ["500","600","700"], variable: "--font-display", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400","500","600","700","800"], variable: "--font-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin", "latin-ext"], weight: ["400","500"], variable: "--font-mono", display: "swap" });
```

Apply variables on `<html>`:

```tsx
<html lang="vi" className={`${fraunces.variable} ${manrope.variable} ${dmMono.variable}`}>
```

Keep existing `metadataBase`/`organizationJsonLd` changes from `HEAD` (do not revert them).

- [ ] **Step 2: Swap :root tokens in globals.css**

In `frontend-client/app/globals.css`, replace the `:root` block (lines 5–20) with:

```css
:root {
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --ink: #132022;
  --ink-soft: #173638;
  --muted: #596764;
  --line: rgba(19, 32, 34, .16);
  --paper: #f1ede4;
  --paper-strong: #fbf8f1;
  --signal: #ed5a37;
  --signal-deep: #c94a2a;
  --mint: #91ffe0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
}
```

Delete `--violet`, `--violet-deep`, `--cyan`, `--radius-xl` from the token set. Any remaining references to those names must be replaced in later tasks — no silent fallbacks.

- [ ] **Step 3: Retarget base type + selection/focus defaults**

Update `globals.css` base rules:

```css
body { background: var(--paper); color: var(--ink); font-family: var(--font-sans), system-ui, -apple-system, sans-serif; }
.display { font-family: var(--font-display), serif; letter-spacing: -0.02em; }
:where(a, button, [role="button"], input, textarea, select, summary, [tabindex]):focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }
::selection { background: rgba(237, 90, 55, .18); }
```

- [ ] **Step 4: Verify type + tokens compile**

Run: `npm run build:web` (or `npm run build --workspace=@qts/web`)

Expected: PASS (production build completes). Visually, headings should render in Fraunces, body/UI in Manrope, no layout crash.

- [ ] **Step 5: Commit**

```bash
git add frontend-client/app/layout.tsx frontend-client/app/globals.css
git commit -m "feat(web): add Operational Signal fonts and tokens

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Shared Chrome — Header, Footer, Buttons, Section Primitives

**Files:**
- Modify: `frontend-client/app/globals.css:45-80`
- Modify: `frontend-client/components/marketing/SiteHeader.tsx:31-60`
- Modify: `frontend-client/components/marketing/SiteFooter.tsx:1-23`
- Modify: `frontend-client/app/globals.css` (buttons `.btn*`, `.eyebrow`, `.display`, `.section`, `.container`, `.nav`, `.footer`, `.nav-mega`, `.mobile-overlay`, `.field`)

**Interfaces:**
- Consumes: tokens from Task 1, existing navigation arrays in `SiteHeader`, `COMPANY` from `@/lib/company`, `featuredResource` for mega-menu.
- Produces: rule-based header/footer/button primitives consumed by all page routes.

- [ ] **Step 1: Restyle global section primitives**

In `globals.css`, update:

```css
.container { width: min(1180px, calc(100% - 48px)); margin-inline: auto; }
.section { padding: 96px 0; position: relative; border-top: 1px solid var(--line); }
.section:first-of-type { border-top: 0; }
.eyebrow { font-family: var(--font-mono), ui-monospace, monospace; font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); display: inline-flex; align-items: center; gap: 8px; }
.eyebrow::before { content: ""; width: 14px; height: 2px; border-radius: 0; background: var(--signal); box-shadow: none; }
.display { font-family: var(--font-display), serif; font-weight: 600; line-height: .98; letter-spacing: -.04em; color: var(--ink); }
.section-heading h2 { font-family: var(--font-display), serif; }
.section-heading p { color: var(--muted); }
```

Reduce any `border-radius` > 10px to `var(--radius-md)` or `var(--radius-lg)`; replace violet/cyan shadow/glow literals with ink/muted shadows.

- [ ] **Step 2: Convert header from frosted pill to rule-based bar**

In `globals.css`:

```css
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: var(--paper-strong); border-bottom: 1px solid var(--line); transition: background .2s ease, border-color .2s ease; }
.nav.scrolled { padding-top: 0; }
.scrolled .nav-inner, .nav-inner { height: 64px; background: transparent; border: 0; border-radius: 0; box-shadow: none; backdrop-filter: none; }
.nav-links { font-family: var(--font-sans); font-size: 13px; font-weight: 600; color: var(--ink); }
.nav-link { font-family: var(--font-sans); }
.nav-link.active { color: var(--ink); border-bottom: 2px solid var(--signal); }
.nav-cta.btn-dark, .btn-dark { background: var(--ink); color: var(--paper-strong); box-shadow: none; }
.btn-dark:hover { background: var(--signal); }
```

In `SiteHeader.tsx`, keep all routes/handlers/timers; only visuals: ensure `QtsMark` renders the existing logo image plus a CSS stepped signal glyph (do not replace the image asset). Add a small DM Mono status label next to the CTA if desired (e.g., `VI · Hệ thống hoạt động`), using `var(--font-mono)`.

- [ ] **Step 3: Ink footer + mint cues**

In `globals.css`:

```css
.footer { background: var(--ink); color: var(--paper-strong); border-top: 1px solid rgba(255,255,255,.08); }
.footer .brand, .footer-col h4 { color: var(--paper-strong); }
.footer-about, .footer-col a, .footer-bottom { color: rgba(251,248,241,.72); }
.footer-col a:hover { color: var(--mint); }
.footer-bottom { border-top-color: rgba(255,255,255,.1); }
```

Verify `Brand` dark variant still renders correctly on ink.

- [ ] **Step 4: Buttons + form focus**

```css
.btn { border-radius: var(--radius-md); font-family: var(--font-sans); }
.btn-primary { background: var(--ink); color: var(--paper-strong); box-shadow: none; }
.btn-primary:hover { background: var(--signal); }
.btn-light { background: transparent; color: var(--ink); border: 1px solid var(--ink); }
.btn-light:hover { border-color: var(--signal); color: var(--signal); }
.field input, .field textarea, .field-float input, .field-float textarea { font-family: var(--font-sans); border-color: var(--line); }
.field input:focus, .field textarea:focus, .field input:focus-visible { border-color: var(--signal); box-shadow: 0 0 0 3px rgba(237,90,55,.14); outline: none; }
.field label, .field-float label { font-family: var(--font-mono); }
```

- [ ] **Step 5: Quick visual + build check**

Run: `npm run build:web`

Expected: PASS. Check header scrolled/expanded states, mega-menu hover/focus, footer contrast.

- [ ] **Step 6: Commit**

```bash
git add frontend-client/app/globals.css frontend-client/components/marketing/SiteHeader.tsx frontend-client/components/marketing/SiteFooter.tsx
git commit -m "feat(web): restyle shared chrome to Operational Signal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Home — Hero + Trust Ledger + Product Preview Shell

**Files:**
- Modify: `frontend-client/components/marketing/HomeExperience.tsx:63-156`
- Modify: `frontend-client/app/globals.css:81-147` (`.hero`, `.hero-grid`, `.product-glow`, `.mock-*`, `.trust`, `.floating-note`, `.noise`, `.signal-chart`, `.progress`)
- Modify: `frontend-client/app/page.tsx:18-70` (remove `style={{ background:"#f7f8fc" }}` literals)

**Interfaces:**
- Consumes: tokens from Task 1, chrome from Task 2, existing `CountUp`/`NotificationToast`/`ProductPreview` structure.
- Produces: hero with Operation Index artifact + ledger trust strip consumed by home route only.

- [ ] **Step 1: Hero structure — mono label + Fraunces display + Operation Index**

In `HomeExperience.tsx`, within the hero section (around line 138–147):

- Insert a mono numbered label before the eyebrow: `<span className="hero-kicker">01 / HỆ ĐIỀU HÀNH SỐ</span>` styled with `var(--font-mono)` (10px, uppercase, tracking .14em).
- Keep existing headline/copy/CTAs verbatim but apply `className="display"` heading already present.
- Add an **Operation Index** artifact adjacent to `.hero-copy` (inside `.hero-grid` second column or as a sibling block). Use only existing non-claiming language + illustrative disclaimer. Example (no invented customer count):

```tsx
<div className="operation-index" aria-label="Chỉ số vận hành minh hoạ">
  <small>OPERATION INDEX — MINH HỌA</small>
  <strong>07 mô-đun · 01 lõi dữ liệu</strong>
  <span>Dữ liệu mô phỏng cho mục đích trình bày sản phẩm.</span>
</div>
```

Style with offset solid shadow (`box-shadow: 6px 6px 0 var(--ink)`), `border: 1px solid var(--line)`, `background: var(--paper-strong)`, `border-radius: var(--radius-md)`.

- Adjust stagger to 70–120ms: change `staggerChildren: 0.2` → `0.08` and chain label→headline→paragraph→actions→index with `delayChildren` offsets (0, 0.08, 0.16, 0.24).

- [ ] **Step 2: Hero/product surface styles**

In `globals.css`:

```css
.hero { background: var(--paper); }
.hero::before { background: radial-gradient(ellipse at 20% 10%, rgba(237,90,55,.10), transparent 55%); }
.hero::after { background: radial-gradient(ellipse at 85% 30%, rgba(145,255,224,.18), transparent 60%); }
.hero::after, .hero::before { filter: none; }
.hero-grid { gap: 40px; }
.product-glow { background: var(--paper-strong); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: 6px 6px 0 var(--ink); backdrop-filter: none; }
.product-glow::before { display: none; }
.mock-app { border-color: var(--line); background: var(--paper-strong); }
.signal-chart i { background: var(--ink); }
.signal-chart i:nth-child(odd) { background: var(--signal); }
.progress span { background: var(--signal); }
.floating-note { border-color: var(--line); background: var(--paper-strong); box-shadow: 4px 4px 0 var(--ink); }
```

Add subtle engineering grid (CSS only, hero-limited):

```css
.hero { background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 32px 32px; background-position: 0 0; }
.hero .container { background: var(--paper); } /* keep content legible over grid */
```

Remove violet `conic-gradient` on `.score-ring` → use `var(--ink)` + `var(--line)`.

- [ ] **Step 3: Trust as ruled ledger**

Replace `.trust-inner` card look with ledger:

```css
.trust { padding: 24px 0 48px; }
.trust-inner { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 18px 0; background: transparent; }
.trust-stat strong { font-family: var(--font-display); color: var(--ink); }
.trust-stat span { font-family: var(--font-mono); color: var(--muted); font-size: 11px; }
.logo-row { border-top: 1px solid var(--line); padding-top: 16px; margin-top: 16px; }
```

In `HomeExperience.tsx` `TrustStrip`, keep `companyFacts` values/labels exactly; only class hooks change.

- [ ] **Step 4: Clean inline backgrounds on home**

In `frontend-client/app/page.tsx`, replace `style={{ background: "#f7f8fc" }}` with `style={{ background: "var(--paper)" }}` or remove (paper is the default).

- [ ] **Step 5: Build + viewport smoke**

Run: `npm run build:web`

Expected: PASS. At desktop the hero shows 2-column grid with product preview framed as an operational surface; at ~375px width preview stacks without overflow.

- [ ] **Step 6: Commit**

```bash
git add frontend-client/components/marketing/HomeExperience.tsx frontend-client/app/globals.css frontend-client/app/page.tsx
git commit -m "feat(web): hero and trust ledger for Operational Signal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Platform, Solutions, Case Study, CTA

**Files:**
- Modify: `frontend-client/components/marketing/PlatformExplorer.tsx:16-42`
- Modify: `frontend-client/components/marketing/SolutionsBento.tsx`
- Modify: `frontend-client/components/marketing/ProductExperience.tsx:18-35`
- Modify: `frontend-client/app/globals.css:148-285` (`.platform-wrap`, `.platform-grid`, `.module-button`, `.platform-core`, `.orbit`, `.core`, `.platform-preview`, `.bento`, `.solution`, `.experience-shell`, `.demo-*`, `.case-study`, `.case-grid`, `.case-dashboard`, `.industries`, `.cta-band`)

**Interfaces:**
- Consumes: tokens/chrome/hero foundations.
- Produces: restyled explorer/bento/dashboard/CTA sections consumed by `/`, `/platform`, `/solutions`.

- [ ] **Step 1: PlatformExplorer — signal-only selection, dark core, mint status**

In `PlatformExplorer.tsx`:

- Remove per-module `color` hex literals as visual API (keep `icon`/`name`/`caption`/`impact`/`description`/`value`). If `color` stays for TS, ignore it in rendering.
- Change preview icon background from `linear-gradient(135deg, ${color}, #4ac1df)` → `background: var(--ink)` with `color: var(--mint)` on the icon glyph. Active `module-button` uses `border-color: var(--signal)` + `background: var(--paper-strong)`; inactive uses `border-color: var(--line)`. Do not color every module distinctly.

In `globals.css`:

```css
.platform-wrap { background: var(--paper-strong); border: 1px solid var(--line); border-radius: var(--radius-lg); }
.platform-wrap::after { background: radial-gradient(circle, rgba(19,32,34,.06), transparent 66%); }
.orbit { border-color: var(--line); }
.core { background: var(--ink-soft); border-color: rgba(255,255,255,.08); box-shadow: none; }
.module-button { background: var(--paper-strong); border-color: var(--line); border-radius: var(--radius-md); }
.module-button.active { border-color: var(--signal); }
.module-icon { background: var(--ink); color: var(--mint); }
.platform-preview { background: var(--paper-strong); border-color: var(--line); border-radius: var(--radius-md); }
.impact b { color: var(--signal); }
```

Add lightweight CSS scan on active module (no JS): `.module-button.active { position: relative; overflow: hidden; } .module-button.active::after { content:""; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(237,90,55,.08), transparent); animation: scan 1.6s linear infinite; } @keyframes scan { from{transform:translateX(-100%)} to{transform:translateX(100%)} }` — disabled under `prefers-reduced-motion`.

- [ ] **Step 2: Solutions bento — reduced radii, no lavender**

```css
.bento { gap: 14px; }
.solution { border-color: var(--line); border-radius: var(--radius-md); background: var(--paper-strong); }
.solution.enterprise, .solution.cloud { background: var(--paper-strong); }
.solution:hover { transform: translateY(-4px); border-color: var(--ink); box-shadow: 4px 4px 0 var(--ink); }
.solution-arrow { border-color: var(--line); }
.mini-window { border-color: var(--line); background: var(--paper); }
```

- [ ] **Step 3: ProductExperience console + chart tokens**

In `ProductExperience.tsx`, remap inline hex colors to token scale:

- Tooltip bg ` #272941` → `var(--ink)`, muted `#c6c6de` → `rgba(251,248,241,.72)`.
- `TrendRows` color array: violet `#675fe8` → `var(--ink)`, green `#25b68d` → `var(--mint)` (on dark) or `var(--signal)` for emphasis, amber `#e79731` → `var(--signal)`. Keep at most two hues.
- Chart gradient `#6865e9` → `var(--signal)`, grid `#eaebf2` → `var(--line)`, axis `#9295a6` → `var(--muted)`.

In `globals.css`:

```css
.experience-shell { border-color: var(--line); border-radius: var(--radius-lg); background: var(--paper-strong); box-shadow: none; }
.demo-tabs { border-bottom-color: var(--line); }
.demo-tab.active { color: var(--ink); border-bottom-color: var(--signal); }
.demo-stage { background: var(--paper); }
.demo-card { border-color: var(--line); border-radius: var(--radius-md); }
```

- [ ] **Step 4: Case study — dark control room (preserve disclosure)**

```css
.case-study { background: var(--ink-soft); color: var(--paper-strong); }
.case-study .section-heading h2, .case-study h2, .case-step h4 { color: var(--paper-strong); }
.case-study p, .case-step p { color: rgba(251,248,241,.72); }
.case-study .eyebrow { color: var(--mint); }
.case-steps { border-left-color: rgba(255,255,255,.14); }
.case-step::before { background: var(--signal); box-shadow: 0 0 0 1px var(--signal); border-color: var(--ink-soft); }
.case-dashboard { background: var(--ink); border-color: rgba(255,255,255,.08); box-shadow: none; transform: none; border-radius: var(--radius-md); }
.dark-panel { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); }
```

Keep the paragraph “Mô hình dưới đây mang tính minh họa…” unchanged.

- [ ] **Step 5: CTA — ink/teal with grid + signal action**

```css
.cta-band { background: var(--ink); }
.cta-band::before { background: radial-gradient(ellipse 620px 320px at 78% 45%, rgba(237,90,55,.12), transparent 70%), radial-gradient(ellipse 480px 300px at 8% 70%, rgba(145,255,224,.10), transparent 72%); }
.cta-copy h2 { color: var(--paper-strong); font-family: var(--font-display); }
.cta-copy p { color: rgba(251,248,241,.72); }
.cta-band .btn-light { background: var(--signal); color: white; border-color: var(--signal); }
.cta-band .btn-light:hover { background: var(--signal-deep); }
```

- [ ] **Step 6: Build check**

Run: `npm run build:web`

Expected: PASS. Platform selected state is the only signal-colored module; bento hovers are rule/lift only.

- [ ] **Step 7: Commit**

```bash
git add frontend-client/components/marketing/PlatformExplorer.tsx frontend-client/components/marketing/SolutionsBento.tsx frontend-client/components/marketing/ProductExperience.tsx frontend-client/app/globals.css
git commit -m "feat(web): platform, bento, and case study in Operational Signal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Supporting Pages via Shared Selectors

**Files:**
- Modify: `frontend-client/app/globals.css:316-430` (`.page-hero`, `.page-hero-grid`, `.hero-fact`, `.contact-*`, `.detail-rows`, `.resource-*`, `.company-*`, `.industry-*`, `.testimonial-*`, `.case-detail-*`, `.legal`)
- Modify: `frontend-client/app/platform/page.tsx:39` (remove `#f7f8fc` inline bg)
- Modify: `frontend-client/app/solutions/page.tsx:45,50` (remove inline `color:#5b5e73` + `#f7f8fc`)
- Modify: `frontend-client/app/resources/page.tsx:88` (remove `#f7f8fc`)
- Modify: `frontend-client/app/resources/case-studies/global-manufacturing/page.tsx:28-32` (remove inline `color:#6ee0b2` on live dot, keep accessible contrast via class)
- Modify: `frontend-client/app/page.tsx:59` (live dot `#6ee0b2` → class)

**Interfaces:**
- Consumes: tokens + chrome from Tasks 1–2; page components keep their JSX.
- Produces: `/platform`, `/solutions`, `/company`, `/industries`, `/resources`, `/contact`, `/legal`, and resource detail pages visually coherent without per-page art direction.

- [ ] **Step 1: Page hero + supporting section tokens**

In `globals.css`:

```css
.page-hero { background: var(--paper); border-bottom: 1px solid var(--line); }
.page-hero::before { background: radial-gradient(ellipse, rgba(237,90,55,.08), transparent 62%); }
.page-hero h1 { font-family: var(--font-display); color: var(--ink); }
.page-hero-copy { color: var(--muted); }
.hero-fact { background: var(--paper-strong); border-color: var(--line); border-radius: var(--radius-md); box-shadow: none; }
.hero-fact i { background: var(--ink); color: var(--mint); }
.contact-panel { background: var(--paper-strong); border-color: var(--line); border-radius: var(--radius-lg); box-shadow: none; }
.detail-row, .resource-card, .company-point, .industry-card { background: var(--paper-strong); border-color: var(--line); border-radius: var(--radius-md); }
.industries, .company-technology + .industries, .industries-hero { background: var(--ink-soft); color: var(--paper-strong); }
```

Remove lavender/soft violet fills (`#f7f8fc`, `#f0f0ff`, `#eeecff`, `#fafaff`) — map them to `var(--paper)` / `var(--paper-strong)`.

- [ ] **Step 2: Clean remaining inline hex literals**

Replace in page TSX:

- `style={{ background: "#f7f8fc" }}` → `style={{ background: "var(--paper)" }}` or delete (3 occurrences: `frontend-client/app/platform/page.tsx:39`, `frontend-client/app/solutions/page.tsx:50`, `frontend-client/app/resources/page.tsx:88`).
- `style={{ color: "#5b5e73" }}` in `frontend-client/app/solutions/page.tsx:45` → `style={{ color: "var(--muted)" }}` or class.
- `style={{ color: "#6ee0b2" }}` on live dots → add class `.live-dot { color: var(--mint); }` and use `className="live-dot"`.

Do not edit any other copy, links, or layout.

- [ ] **Step 3: Verify supporting pages compile**

Run: `npm run build:web`

Expected: PASS. No visual regression beyond token swap; page-specific layouts unchanged.

- [ ] **Step 4: Commit**

```bash
git add frontend-client/app/globals.css frontend-client/app/platform/page.tsx frontend-client/app/solutions/page.tsx frontend-client/app/resources/page.tsx frontend-client/app/resources/case-studies/global-manufacturing/page.tsx frontend-client/app/page.tsx
git commit -m "feat(web): supporting pages adopt shared Operational Signal tokens

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Motion Pass — Stagger + Reduced Motion

**Files:**
- Modify: `frontend-client/app/globals.css` (tail: `prefers-reduced-motion`, keyframes)
- Modify: `frontend-client/lib/motion.ts` (staggerContainer/staggerItem timing)
- Modify: `frontend-client/components/marketing/Reveal.tsx` (easing/duration alignment)
- Modify: `frontend-client/components/marketing/HomeExperience.tsx` (hero stagger values)

**Interfaces:**
- Consumes: framer-motion `EASE`/`DUR` already defined; existing `Reveal` `whileInView` behavior.
- Produces: 70–120ms hero reveal cadence + reduced-motion guard for all motion.

- [ ] **Step 1: Align motion primitives to spec cadence**

In `frontend-client/lib/motion.ts`:

```ts
export const DUR = { fast: 0.18, base: 0.28, slow: 0.42 };
export function staggerContainer(delay = 0, stagger = 0.08): Variants { /* 80ms default */ }
export const staggerItem: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } };
```

In `frontend-client/components/marketing/Reveal.tsx`, ensure `delay` prop honors 70–120ms steps; do not add a second scroll-reveal system.

- [ ] **Step 2: Harden prefers-reduced-motion**

At the end of `globals.css`, ensure:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .module-button.active::after { animation: none !important; }
}
```

Verify `MotionProvider` already uses `<MotionConfig reducedMotion="user">` (it does) — keep it.

- [ ] **Step 3: Hover discipline**

Sweep `globals.css` for `transition`/`animation` — hovers may only change `transform`, `border-color`, `color`, `background`. Remove any perpetual decorative keyframe not tied to `.module-button.active::after` scan.

- [ ] **Step 4: Build check**

Run: `npm run build:web`

Expected: PASS. With OS reduced-motion on, hero renders instantly without stagger, scan pulse disabled.

- [ ] **Step 5: Commit**

```bash
git add frontend-client/app/globals.css frontend-client/lib/motion.ts frontend-client/components/marketing/Reveal.tsx frontend-client/components/marketing/HomeExperience.tsx
git commit -m "feat(web): motion cadence and reduced-motion guard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Lint, Build, and Smoke Verification

**Files:**
- Test: `frontend-client` (no new test files — ponytail: verification is via existing lint + production build + viewport smoke)
- Modify: none (fix-ups only if verification fails)

**Interfaces:**
- Consumes: all tasks above.
- Produces: passing `npm run lint` + `npm run build:web` + manual route smoke.

- [ ] **Step 1: Lint**

Run: `npm run lint --workspace=@qts/web`

Expected: PASS (no new eslint errors). Fix any newly introduced `no-unused-vars` or `no-explicit-any` from token edits.

- [ ] **Step 2: Production build**

Run: `npm run build:web`

Expected: PASS (`next build` completes for `frontend-client`).

- [ ] **Step 3: Viewport + route smoke (via project run)**

Start dev server: `npm run dev:web` and open `/`, `/platform`, `/solutions`, `/industries`, `/resources`, `/resources/case-studies/global-manufacturing`, `/company`, `/contact`, `/legal` at 1280px and 375px. Verify:

- Header mega-menu hover + keyboard (Tab/Escape) still works; mobile overlay open/close + accordion.
- CTA links (`/contact`, `/solutions`, `/platform`, `/resources`) navigate.
- Contact form: focus rings in signal color, validation messages, honeypot field remains off-screen (not `display:none`).
- Reduced-motion: enable in OS/browser, reload `/` — no stagger, no scan.
- No invented customer metrics visible; “Minh họa” disclosures still present.

- [ ] **Step 4: Fix-forward commit if needed**

If verification required edits:

```bash
git add -A
git commit -m "fix(web): lint/build/contrast follow-ups for Operational Signal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- Typography (Fraunces/Manrope/DM Mono) → Task 1.
- Tokens + surface language (paper/ink/mint/signal/line/radius, grid, offset shadows, no violet/glass) → Tasks 1–5 sweep.
- Header/footer/buttons/section primitives → Task 2 (eyebrows with signal bar, Fraunces headings, numbered labels in hero).
- Home order preserved + hero with Operation Index artifact + ledger trust + platform signal-only + bento radii + dark case + ink CTA → Tasks 3–4.
- Supporting pages via shared selectors only, no per-page art direction → Task 5.
- Motion (70–120ms stagger, single Reveal, CSS scan, reduced-motion) → Task 6.
- A11y/perf (semantic HTML preserved, contrast, reduced-motion, no new deps, no fake metrics) → Tasks 1–6 + Global Constraints.
- Testing/verification (lint + build + viewport smoke) → Task 7.
- Deliberate exclusions (no Portal/Identity, no copy/SEO/API/auth/nav changes) → Global Constraints + per-task file allowlists.

**Placeholder scan:** no `TBD`/`TODO`/`...` placeholders remain; every step contains concrete file paths, CSS, or TSX. Inline hex literals are explicitly enumerated for cleanup.

**Type consistency:** token names (`--paper`, `--paper-strong`, `--ink`, `--ink-soft`, `--muted`, `--signal`, `--signal-deep`, `--mint`, `--line`, `--radius-*`) match spec table and are reused verbatim across tasks. Font variables `--font-display`/`--font-sans`/`--font-mono` shared between Task 1 and Tasks 2–6.
