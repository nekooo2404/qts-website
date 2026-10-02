# QTS Enterprise Website Upgrade Command Center

Date: 2026-10-02
Scope: landing site (`frontend-client`), Portal (`frontend-portal/portal`), HRM (`frontend-hrm`), shared app chrome, OIDC client, and release gates.

## Board Decision

Ship website upgrades only through an evidence-based enterprise gate. A release is not ready when it merely builds; it is ready when the landing page, Portal, and HRM pass product, security, privacy, accessibility, performance, and reliability evidence gates.

Primary standards:

- WCAG 2.2 AA for accessibility.
- OWASP ASVS and OWASP Top 10 for application security requirements.
- NIST CSF 2.0 functions: Govern, Identify, Protect, Detect, Respond, Recover.
- Core Web Vitals: LCP, INP, CLS, plus app-specific interaction budgets.

## Agent Orders

Agents Orchestrator:

- Own the pipeline: PM requirements, UX architecture, frontend implementation, QA loop, reality check.
- Do not advance a surface until its acceptance criteria and evidence files exist.
- Preserve dirty worktree changes and do not revert unrelated files.

Product Manager:

- Convert this document into a tasklist split by surface: landing, Portal, HRM, shared auth/chrome, gates.
- P0 means release-blocking; P1 means next sprint unless it reduces an active P0 risk.

UX Architect and UI Designer:

- Keep landing image-led and honest: no invented metrics, no customer-data claims, no fake screenshots.
- Keep Portal and HRM dense, operational, and task-first. Avoid marketing-style card bloat inside work apps.
- Maintain a shared QTS design token contract for focus, status, table, modal, toast, and empty states.

Frontend Developer:

- Follow existing Next/Vite/React patterns.
- Optimize waterfall and bundle risk before adding new visual libraries.
- Implement controls with native semantics first; ARIA only where native semantics are insufficient.

Accessibility Auditor:

- Gate every surface with automated axe scan plus manual keyboard flow.
- Required manual flows: landing contact form, Portal app switcher and command palette, HRM global search, HRM rejection modal with undo.
- Report WCAG criterion, severity, evidence, and exact remediation.

Security Architect:

- Produce a STRIDE threat model for lead capture, SSO handoff, Portal admin users, HRM payroll/personnel data, and app launcher.
- Require controls for auth, authorization, session storage, CSP, anti-CSRF/state, rate limiting, audit logs, and secret hygiene.

Application Security Engineer:

- Add SAST/SCA/secrets/security-config gates to CI.
- Add regression tests for every discovered security bug.
- Tune findings so Critical and High issues block release.

Data Privacy Officer:

- Maintain a processing inventory for lead forms, Portal identity data, HRM employee data, logs, analytics, and support data.
- Define lawful basis, retention, DSR workflow, cross-border transfer posture, and breach response owner for each data class.

SRE:

- Define SLOs per surface: availability, successful auth callback rate, lead submission success, HRM first workspace render, API error rate.
- Add release rollback checklist and smoke evidence for public URLs.

## P0 Controls

1. Release gates must be real.

- Evidence: root scripts `test:landing`, `test:portal`, `test:hrm`, `test:production`; Playwright configs and specs present.
- Acceptance: each gate runs at least one meaningful assertion and cannot pass because the test directory is empty.

2. Security headers must be consistent.

- Evidence: `frontend-client/next.config.ts`, `frontend-portal/portal/nginx.conf`, `frontend-hrm/nginx.conf`.
- Acceptance: all public surfaces set frame deny/ancestors none, nosniff, referrer policy, HSTS in production, permissions policy, and CSP. Any unsafe CSP directive must have a written compatibility reason.

3. Production auth must not silently downgrade.

- Evidence: HRM `hrmRuntimeConfigIssue()`, Portal/HRM OIDC client config, `packages/oidc-client`.
- Acceptance: production requires HTTPS issuer/API/redirect URLs; refresh tokens are not persisted in browser storage; expired sessions recover through OIDC instead of exposing sensitive state.

4. HRM official data boundary must remain intact.

- Evidence: `frontend-hrm/src/data.ts`, `frontend-hrm/src/hrmApi.ts`, `playwright.hrm.config.ts`.
- Acceptance: prototype/test data requires dev/test mode; production official data is loaded through API-backed identity/data path.

5. Accessibility release blockers must be zero.

- Evidence: Playwright/axe report plus manual keyboard notes.
- Acceptance: no keyboard trap, visible focus on all controls, dialogs close with Escape and return focus, form errors are announced, tables have accessible labels.

6. Privacy notice and consent must match data processing.

- Evidence: contact form, legal page, privacy inventory.
- Acceptance: contact form consent is explicit; collected fields are minimized; retention and DSR route are documented.

7. Auditability for sensitive actions.

- Evidence: Portal admin users, HRM workflow/payroll/personnel actions, backend request ID filters.
- Acceptance: state-changing actions carry actor, subject, timestamp, request id, outcome, and reason where required.

## P1 Controls

1. Core Web Vitals budgets:

- Landing: LCP under 2.5s, CLS under 0.1, INP under 200ms on a mid-tier profile.
- Portal and HRM: first authenticated workspace render under 3s on warm auth and under 5s on cold auth in staging.

2. Observability:

- Add client error telemetry with PII redaction.
- Add auth callback success/failure metrics.
- Add lead submission success and rate-limit metrics.

3. Design system convergence:

- Extract shared modal, toast, command palette, table, badge, focus ring, empty state rules.
- Replace one-off app-specific patterns only when it reduces accessibility or maintenance risk.

4. Privacy operations:

- Add Article 30-style processing registry and retention matrix.
- Add DSR intake route and owner.

## Gate Commands

Run before a release candidate:

```powershell
npm run typecheck
npm run lint
npm run build:web
npm run build:portal
npm run build:hrm
npm run test:landing
npm run test:portal
npm run test:hrm
npm run test:production
powershell -ExecutionPolicy Bypass -File scripts/security-config-audit.ps1
```

Optional deep checks:

```powershell
npm audit --omit=dev
npx playwright test --config=playwright.ory.config.ts
```

## Evidence Paths

- Landing implementation: `frontend-client/app/page.tsx`, `frontend-client/components/marketing/*`, `frontend-client/next.config.ts`.
- Portal implementation: `frontend-portal/portal/src/PortalApp.tsx`, `frontend-portal/portal/src/oidc.ts`, `frontend-portal/portal/nginx.conf`.
- HRM implementation: `frontend-hrm/src/App.tsx`, `frontend-hrm/src/auth/*`, `frontend-hrm/src/design-system/*`, `frontend-hrm/nginx.conf`.
- Shared auth: `packages/oidc-client/src/index.ts`.
- Release tests: `playwright.*.config.ts`, `tests/*`.
- Security config audit: `scripts/security-config-audit.ps1`.
