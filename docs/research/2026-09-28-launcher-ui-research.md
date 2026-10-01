# Launcher UI research, 2026-09-28

Scope: QTS Identity `/launcher`, an authenticated enterprise app launcher backed by `/api/launcher`.

## Primary-source takeaways

- Microsoft 365 treats the app launcher as an admin-curated, user-facing application access point. Admins can pin up to three apps and group applications for users. For QTS, keep a small "recommended/primary" zone, but do not invent pinning unless backend support exists. Source: https://learn.microsoft.com/en-us/microsoft-365/admin/manage/pin-apps-to-app-launcher
- Fluent 2 cards hold information and actions about one concept or object. If one action is obvious, the full card can be interactive. For QTS, each assigned application can stay a full-card link with one clear open action. Source: https://fluent2.microsoft.design/components/web/react/core/card/usage
- Carbon's UI shell positions app switching as a global, cross-product utility. It recommends switchers for recently used apps, frequent apps, or all apps attached to a user account. For QTS, the launcher should orient the user across products and preserve the existing header as global identity chrome. Source: https://carbondesignsystem.com/components/UI-shell-header/usage/
- Material search guidance frames search as a fast way to find information across an app, using a persistent top search field or opened search view. For QTS, add search/filter only if it works client-side from loaded assignments and does not block SSO. Source: https://github.com/material-components/material-components-android/blob/master/docs/components/Search.md
- Material card guidance treats cards as containers for content and actions about one subject. For QTS, app cards should show name, description, access/status metadata, and the open action without nested cards. Source: https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md
- Material empty-state guidance says empty states prevent confusion and should use neutral support text. Polaris adds that empty states should explain next steps, avoid blame, and generally use one primary action. For QTS, empty assigned-app state should tell the user to contact an administrator or return to account/security, not imply failure. Sources: https://m1.material.io/patterns/empty-states.html and https://polaris-react.shopify.com/components/layout-and-structure/empty-state
- Polaris skeleton guidance says loading placeholders should mimic the final layout and keep stable page structure. For QTS, route loading can use app-card skeletons if we add `app/launcher/loading.tsx`. Source: https://polaris-react.shopify.com/components/feedback-indicators/skeleton-page
- WCAG 2.2 requires visible keyboard focus and sets target-size guidance. For QTS, cards and actions should keep strong focus rings and comfortable hit areas. Source: https://www.w3.org/TR/wcag/
- WAI-ARIA APG disclosure guidance confirms Enter/Space behavior and `aria-expanded` needs for show/hide widgets. For QTS, do not add collapsible filters unless they include correct button semantics. Source: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- shadcn blocks and Tailwind application UI templates show current admin/application-shell conventions: compact header, search form, responsive panels, and grids. For QTS, borrow the structure, not the package, because the repo already has its own Identity shell and no shadcn dependency. Sources: https://ui.shadcn.com/blocks/sidebar and https://tailwindcss.com/plus/ui-blocks/application-ui

## Proposed direction for QTS

- Keep server-rendered page data fetching, preserving `/api/launcher`, `redirect_uri`, and `?sso=1`.
- Make the first viewport a functional workspace header, not a marketing hero.
- Add session/tenant context as compact metadata.
- Present apps in a responsive grid with larger hit targets, icon tile, status/last-opened metadata, and a single open action.
- Add empty state and route loading state that match the final layout.
- Keep visual language aligned with existing QTS Identity tokens: calm light surface, QTS blue accent, no new design-system package.
- Avoid backend-dependent features such as user pinning, recent sorting, favorites, or server search unless separately scoped.

