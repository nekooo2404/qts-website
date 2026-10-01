# QTS cross-surface UX/UI refresh

## Direction

Apply an iOS/SwiftUI-inspired interaction language to the existing web products without changing their framework, authentication contracts, permissions, or domain behavior.

- Calm daylight canvas with a restrained QTS blue accent.
- Clear hierarchy and content-driven layout before decoration.
- Glass treatment only for navigation chrome, floating menus, and transient controls.
- Opaque content cards for data readability and predictable contrast.
- Standard controls, comfortable targets, visible focus, reduced-motion support.
- One shared vocabulary for loading, empty, error, success, disabled, and recovery states.

## Scope

1. Landing (`frontend-client`)
   - Compact first viewport and trust proof.
   - Remove dark/low-contrast treatments where they compete with content.
   - Fix light-background Industries rendering.
   - Normalize typography, grid rhythm, CTA count, image overlays, and section spacing.
   - Ensure reveal animations never hide content when motion is unavailable.
2. Portal (`frontend-portal/portal`, `packages/app-chrome`)
   - Refine glass shell/topbar and application launcher.
   - Improve empty/loading/error/permission states and mobile structure.
   - Preserve OIDC, entitlements, notification, and navigation behavior.
3. HRM (`frontend-hrm`)
   - Refine shell, dashboard density, data surfaces, dialogs, and mobile bottom navigation.
   - Keep role/data-scope enforcement and API contracts unchanged.
   - Keep prototype fixtures visibly out of production behavior.

## Implementation order

1. Establish shared visual tokens and accessibility/motion rules.
2. Repair landing hierarchy and light-surface contrast.
3. Refine shared app chrome, then portal-specific surfaces.
4. Refine HRM surfaces and responsive states.
5. Run typecheck/lint/build for every affected workspace.
6. Run browser visual and interaction checks at 1440px and 390px.
7. Build and deploy one production image at a time to the 1GB VPS.
8. Verify remote health and public smoke flows before reloading Caddy.

## Acceptance checks

- No production page has accidental black/grey canvas blocks or white text on a light background.
- Primary action is apparent within the first viewport of each surface.
- All interactive controls have visible focus and usable hit areas.
- Loading, empty, error, disabled, success, and retry states remain reachable.
- Reduced-motion mode leaves content visible and usable.
- Landing, Portal, and HRM builds pass without new TypeScript/lint errors.
- Public URLs return healthy HTML/assets after deployment.
- OIDC/SSO behavior is unchanged and passes existing production smoke checks.

## Explicit non-goals

- No migration to SwiftUI or a new frontend framework.
- No replacement of Ory, Spring, API, permission, or data contracts.
- No invented metrics, testimonials, customer claims, or backend capabilities.
- No destructive cleanup of unrelated worktree changes.
