# QTS Marketing — Operational Signal Design

**Date:** 2026-09-15  
**Status:** Approved

## Objective

Replace the generic light violet/glass visual language of the QTS marketing site with the approved **Operational Signal** direction. The site should feel like a reliable enterprise operating system: precise, warm, tangible and actively monitored—not a generic SaaS landing page.

Scope is limited to `frontend-client`, including the home page and its shared marketing components. Existing copy, routes, navigation information architecture, forms, SEO metadata, and backend behavior remain unchanged.

## Visual Foundation

### Typography

Load these Google font families in the Next root layout:

- **Fraunces** (`500–700`): display headings, important numerical/readout values.
- **Manrope** (`400–800`): navigation, body copy, controls and cards.
- **DM Mono** (`400–500`): eyebrow labels, system readouts, metadata and small labels.

Do not use Arial, Segoe UI, Helvetica Neue, Inter or Space Grotesk as intended visual faces. System fonts remain only as final fallbacks.

### Tokens

Define the following semantic CSS variables in the global marketing stylesheet:

| Token | Value | Usage |
| --- | --- | --- |
| `--paper` | `#f1ede4` | Default page background |
| `--paper-strong` | `#fbf8f1` | Raised light surface |
| `--ink` | `#132022` | Primary text and dark controls |
| `--ink-soft` | `#173638` | Dark feature sections / data panels |
| `--muted` | `#596764` | Supporting text |
| `--signal` | `#ed5a37` | Sole warm action and alert accent |
| `--signal-deep` | `#c94a2a` | Hover and text emphasis |
| `--mint` | `#91ffe0` | Dark-surface status / live indicators |
| `--line` | `rgba(19, 32, 34, .16)` | Rules and borders |
| `--radius-*` | `0–10px` | Small, functional rounding only |

Remove violet, cyan and glass-gradient tokens from the public marketing visual system. Never distribute the signal color evenly: it identifies action, changed state, and the most important operational reading.

### Surface Language

- Use thin, visible rules and restrained square/small-radius surfaces.
- Use warm paper, not pure white, as the resting field.
- Use subtle engineering-grid and localized radial glows in hero/feature contexts only.
- Use offset solid shadows sparingly for operation-index/readout blocks; do not use large blurred “floating SaaS card” shadows.
- Reserve the dark ink/teal surface for high-importance modules, industry sections and CTA bands.
- Replace decorative purple gradients and pervasive backdrop blur with tactile boundaries, surface contrast and data-like artifacts.

## Shared Components

### Header and Footer

`SiteHeader` retains routes and responsive behavior. Restyle it with:

- QTS wordmark with a distinctive orange stepped/signal glyph.
- Tight Manrope navigation and DM Mono status/language notation.
- Rule-based fixed header rather than a frosted floating pill.
- Signal-colored primary contact action.

`SiteFooter` becomes an ink surface with mint status cues, paper/low-contrast type hierarchy and the same mark. No violet gradient or white glass treatment.

### Buttons and Form Controls

- Primary: ink background with paper text; hover moves to signal accent only where it signals an active action.
- Secondary: transparent/paper surface with ink border, no glass effect.
- Labels and field metadata use DM Mono; inputs retain accessible focus states in signal color.
- Maintain visible keyboard focus and native semantic controls.

### Section Primitives

- Eyebrows use DM Mono uppercase tracking and a short signal bar/dot instead of a soft violet dot halo.
- Display headings use Fraunces at slightly tightened optical spacing; paragraphs use Manrope with spacious enterprise-document rhythm.
- Use numbered system labels where context supports them: `01 / PLATFORM`, `02 / SOLUTIONS`, `03 / OPERATIONS`.
- Alternate paper and ink sections deliberately to establish pacing rather than adding arbitrary background variation.

## Home Page

Keep the existing content order and routing:

1. Hero
2. Trust / proof
3. Platform explorer
4. Solution bento
5. Operational model / case study
6. QTS differentiators
7. CTA

### Hero

Preserve current text and actions but present them as an operating-system introduction:

- Add a mono numbered label and a strong Fraunces display hierarchy.
- Add an **Operation Index** artifact adjacent to the content using existing non-claiming language or explicitly marked illustrative status. Do not introduce unsupported business statistics.
- Layer a subdued technical grid and localized signal/mint radial lighting.
- Desktop should preserve the product preview; frame it as an operational surface with sharper boundaries and no violet glass shell.

### Trust and Platform

- Turn trust proof into a horizontal ruled ledger rather than rounded statistical cards.
- Keep `PlatformExplorer` interaction and content; visually treat modules as bounded system nodes.
- Make only the selected module signal-colored. Use the ink surface for the core and mint for healthy/live status.

### Solutions, Case Study and CTA

- Preserve all existing cards and links.
- Reduce bento corner radii, remove soft lavender fills, and make hover states a modest physical lift or signal-rule activation.
- Make the case-study dashboard/control room deliberately dark and operational; retain the existing disclosure that content is illustrative.
- CTA is ink/teal with technical-grid atmosphere, paper text and one clear signal action.

## Supporting Marketing Pages

The following pages retain their content and component composition, receiving the shared visual system and any appropriate section variants:

- `/platform`: modules render as a clear systems map; product experience retains content and becomes a dark/light operational console.
- `/solutions`: bento and detail rows adopt the framed system-node pattern; impact section becomes an intentional contrast panel.
- `/company`, `/industries`, `/resources`, `/contact`, `/legal`, and resource detail pages: all use the shared fonts, token palette, footer/header, buttons, form surfaces, and page-hero pattern. Their page-specific layouts do not change without an existing shared CSS selector to restyle.

No page receives a separate art direction; the shared language creates cohesion.

## Motion

Use CSS-first motion and respect `prefers-reduced-motion`.

- A hero load sequence reveals system label, headline, paragraph/actions, and index/readout in 70–120ms staggered steps.
- Existing `Reveal` behavior remains the single scroll reveal system; restyle timing/easing if necessary rather than adding another animation framework.
- Selected platform modules may run a lightweight CSS scan/status pulse.
- Hover effects should be limited to transform/rule/color changes. Avoid perpetual decorative animation.

## Accessibility and Performance

- Maintain semantic headings, links, buttons and existing aria labels.
- Preserve or improve contrast for body copy, controls and focus indicators against warm paper and ink surfaces.
- Respect reduced motion by disabling transitions/animations.
- Load fonts through the existing Next mechanism or Google font CSS in a way compatible with the project. Avoid a new dependency.
- Do not add image assets or simulated customer metrics solely to decorate the redesign.

## Testing / Verification

1. Run the existing `frontend-client` lint and production build commands from the root/package scripts.
2. Inspect the home page at desktop and mobile viewport widths using the project run workflow.
3. Verify all marketing routes compile and shared header/menu, CTA links, contact form focus/validation, and reduced-motion styling continue to work.
4. Confirm no unsupported performance claims or newly invented customer facts are introduced.

## Deliberate Exclusions

- No redesign of QTS Portal or QTS Identity.
- No changes to business copy, SEO, API contracts, authentication, forms’ submission behavior, or navigation structure.
- No new component library, animation dependency, design-token framework, or asset-generation pipeline.
