# HRM Production Readiness for React/Vite with OIDC/SSO

- Date: 2026-09-19
- Status: Research note
- Scope: Production readiness standards for a browser-based HRM web app built with React and Vite, integrated with OIDC/SSO.
- Source policy: Primary and high-trust sources only: OWASP Cheat Sheets, W3C WCAG 2.2, React docs, Vite docs, MDN Web Docs, and Ory docs where relevant.
- Non-scope: This is not an audit of the current codebase and does not include secrets or environment values.

## Readiness bar

A production HRM app should be treated as a high-sensitivity business system: authentication must be resistant to token theft and login CSRF, authorization must be enforced server-side on every request, employee data must not leak through frontend bundles or logs, and key HR workflows must be accessible, recoverable, auditable, and deployable without stale-asset failures.

## Actionable checklist

### 1. OIDC/SSO and token boundary

Findings:

- Use Authorization Code with PKCE for browser clients; do not use the implicit grant or resource owner password credentials flow.
- Bind each sign-in transaction to the browser with `state`, and use OIDC `nonce` where ID tokens are involved.
- Register exact redirect URIs. Do not expose open redirectors in the HRM app or SSO gateway.
- Restrict access tokens by audience, scopes, resources, and actions. HRM APIs must reject tokens minted for other resources or actions.
- Protect refresh tokens with sender constraining or refresh-token rotation. Prefer keeping long-lived credentials out of browser JavaScript by using a backend-for-frontend or server-managed session boundary.
- If Ory Kratos is used for browser sessions, use session cookies for browser and SPA interactions, check session state through `/sessions/whoami`, and respect session expiry.

Checklist:

- [ ] Authorization Code + PKCE is the only browser login flow.
- [ ] Redirect URIs are exact, HTTPS-only, and registered per environment.
- [ ] `state` and OIDC `nonce` are generated per transaction and validated.
- [ ] Tokens have minimum necessary audience, scope, resource, and action claims.
- [ ] Refresh tokens are rotated or sender-constrained, or kept server-side.
- [ ] Logout clears the local app session and invalidates the upstream SSO/session where applicable.

Sources:

- [OWASP OAuth2 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [Ory Kratos session management overview](https://www.ory.com/docs/kratos/session-management/overview)

### 2. Sessions, cookies, and CSRF

Findings:

- Session identifiers must be random, meaningless, and generated with sufficient entropy. Do not embed identity, role, tenant, or PII into a client-visible session ID.
- Use HTTPS for the entire session. Set session cookies with `Secure`, `HttpOnly`, and explicit `SameSite=Strict` or `SameSite=Lax`; consider the `__Host-` cookie prefix for host-bound session cookies.
- Regenerate the session ID after authentication and other privilege-level changes.
- Enforce idle and absolute timeouts server-side. Client timers can improve UX but must not be the source of truth.
- Cookie-authenticated state-changing requests need CSRF protection. SameSite is useful defense in depth, not a full substitute for CSRF tokens or server-side origin checks.
- Never use GET for state-changing HRM actions such as approvals, payroll changes, leave decisions, identity updates, or role changes.

Checklist:

- [ ] All app and SSO traffic is HTTPS-only, with HSTS enabled at the serving layer.
- [ ] Session cookies are `Secure`, `HttpOnly`, explicit `SameSite`, short-lived enough for HRM risk, and renewed after login/privilege change.
- [ ] Server enforces idle and absolute session expiration.
- [ ] CSRF tokens or equivalent server-side CSRF controls protect every cookie-authenticated mutation.
- [ ] Mutations use POST/PUT/PATCH/DELETE, never GET.
- [ ] Session IDs, CSRF tokens, authorization codes, access tokens, and refresh tokens are never logged.

Sources:

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)

### 3. Authorization and HRM data access

Findings:

- Enforce authorization on the server for every request, regardless of whether the UI hides a button or route.
- Use deny-by-default behavior for every route, API action, report, export, and record lookup.
- HRM data access usually needs more than simple global roles. Combine role, organization, employment relationship, legal entity, location, manager relationship, data classification, and action type.
- Protect against IDOR by checking both object existence and caller permission for the specific object.
- Sensitive workflows such as compensation, payroll, performance, disciplinary records, bulk exports, and admin impersonation require explicit policy checks and audit events.

Checklist:

- [ ] All API handlers have server-side authorization checks.
- [ ] Unknown, missing, or unmatched policies deny by default.
- [ ] Object access checks include tenant/org/legal-entity scope and relationship scope.
- [ ] Bulk export and report endpoints enforce the same policy as row/detail endpoints.
- [ ] Privileged actions require step-up auth or fresh session where risk justifies it.
- [ ] Security tests cover employee self-service, manager access, HR admin access, and cross-tenant/cross-department denial.

Sources:

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP OAuth2 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

### 4. React frontend security

Findings:

- Treat React's `dangerouslySetInnerHTML` as a controlled exception. Only use it with trusted, sanitized HTML or Trusted Types.
- React does not make unsafe URL schemes safe. Validate user-provided URLs and block `javascript:` and unsafe `data:` use.
- XSS can defeat CSRF mitigations, so output handling, URL validation, and CSP must be treated as production controls, not polish.
- Avoid placing tokens, secrets, or HRM PII in client-side logs, Redux/devtools snapshots, error messages, analytics payloads, query strings, or browser storage.
- Prefer framework rendering and component composition over direct DOM mutation.

Checklist:

- [ ] No untrusted HTML reaches `dangerouslySetInnerHTML`.
- [ ] URL fields are allowlisted by scheme and destination.
- [ ] CSP is deployed and tested in report-only mode before enforcement if the app is not already CSP-clean.
- [ ] Error boundaries and global error handlers redact tokens, IDs where unnecessary, and PII.
- [ ] User-generated rich text has a sanitizer and security tests.

Sources:

- [React docs: common components and `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)

### 5. Vite build, configuration, and deployability

Findings:

- Vite exposes `VITE_*` variables to client-side source after bundling. Do not put API secrets, client secrets, private keys, service credentials, or privileged endpoints into `VITE_*`.
- Keep `.env.*.local` files out of git. Treat all browser-exposed config as public information.
- Production builds should be created with `vite build`; deployment must serve the built bundle, not the dev server.
- Vite supports code splitting and async chunk loading optimizations. Use route-level lazy loading for heavy HRM areas such as payroll, analytics, document previews, and org charts.
- Handle stale chunk failures during deploys. Vite emits `vite:preloadError`, and its docs call out `Cache-Control: no-cache` for HTML so old HTML does not point at deleted assets.
- Configure the public base path correctly for nested deployments behind portals, reverse proxies, or SSO gateways.

Checklist:

- [ ] CI runs `vite build` for production artifacts.
- [ ] No secret is present in `VITE_*`, frontend source, generated bundle, source map, or committed env file.
- [ ] HTML is served with cache policy that avoids stale asset references; hashed assets can use long-lived immutable caching.
- [ ] `vite:preloadError` is handled with a clear reload/recovery path.
- [ ] Large routes use `React.lazy`/dynamic import and `Suspense` loading states.
- [ ] Build output is checked for bundle size, source-map exposure, and environment leakage before release.

Sources:

- [Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [Vite: Building for Production](https://vite.dev/guide/build)
- [Vite: Build optimizations and async chunk loading](https://vite.dev/guide/features#async-chunk-loading-optimization)
- [React docs: `lazy`](https://react.dev/reference/react/lazy)
- [React docs: `Suspense`](https://react.dev/reference/react/Suspense)

### 6. Browser security headers and transport

Findings:

- Use HSTS to ensure future requests use HTTPS and cannot bypass certificate errors for the host.
- Use CSP to restrict scripts, styles, connections, frames, images, workers, and other resource loads. Avoid `unsafe-inline` and `unsafe-eval` unless there is a documented, temporary exception.
- Use `Referrer-Policy` to limit leakage of HRM route names, object IDs, query parameters, or callback parameters to external origins.
- Lock down third-party scripts. HRM apps should not include analytics, chat, or tracking scripts on sensitive authenticated pages unless they have a strict data-processing basis and CSP allowances.

Checklist:

- [ ] `Strict-Transport-Security` is present on HTTPS responses.
- [ ] CSP has explicit `default-src`, `script-src`, `connect-src`, `img-src`, `style-src`, `font-src`, `frame-ancestors`, and `object-src 'none'` decisions.
- [ ] `Referrer-Policy` is set, typically `strict-origin-when-cross-origin` or stricter for HRM.
- [ ] SSO callback URLs do not leak codes, state, or object IDs to third-party origins.
- [ ] Production headers are verified by automated probes.

Sources:

- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [MDN: Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### 7. Accessibility and HRM workflow usability

Findings:

- Target WCAG 2.2 Level AA for production HRM. WCAG Level AA requires all Level A and AA success criteria.
- HRM forms and workflows must be keyboard-operable, must not trap keyboard focus, and must expose status messages without forcing focus changes.
- Text contrast, focus visibility, touch target size, labels, error identification, and error suggestions are production requirements for enterprise users.
- Authentication must not rely only on a cognitive function test unless an accessible alternative or assistive mechanism is provided. Password managers and copy/paste support are specifically relevant.
- For HRM workflows that change or delete user-controllable data, provide reversible submission, validation with correction, or review/confirm/correct before finalizing.
- Session timeout UX should warn users and give them a way to extend where the timeout is content-controlled and policy allows it.

Checklist:

- [ ] WCAG 2.2 AA is an explicit release gate.
- [ ] All menus, tables, dialogs, date pickers, selects, and approval flows work by keyboard.
- [ ] Focus order is logical and visible; modals return focus on close.
- [ ] Form fields have labels/instructions, text errors, and known correction suggestions.
- [ ] Save/submit/delete/payroll/approval workflows offer confirmation, correction, or reversal as appropriate.
- [ ] Login and MFA support password managers, paste, and accessible alternatives.
- [ ] Toasts, async validation, upload progress, and save states use programmatically determinable status messages.

Sources:

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)

### 8. Auditability, logging, and incident readiness

Findings:

- HRM production readiness requires audit logs for authentication, session lifecycle, authorization denials, admin changes, role changes, employee record reads/writes, payroll/compensation changes, exports, imports, impersonation, and policy changes.
- Logs should support investigation without storing tokens, raw session IDs, secrets, or unnecessary HRM PII.
- Use stable correlation IDs and salted hashes for session correlation rather than logging session IDs directly.
- Security controls should fail closed but return user-safe errors that do not reveal implementation details.

Checklist:

- [ ] Every sensitive workflow emits an audit event with actor, subject, action, target, decision, reason, time, request ID, and source context.
- [ ] Tokens, cookies, auth codes, CSRF tokens, passwords, private keys, and secrets are redacted from all logs.
- [ ] Access-denied events are observable and alertable.
- [ ] Logs are protected from tampering and have retention aligned with HR/legal requirements.
- [ ] Production runbooks cover SSO outage, token validation failure, stale asset deploy, suspected account compromise, and unauthorized data access.

Sources:

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Suggested release gates

1. Security gate: OIDC/PKCE tests, redirect validation tests, CSRF tests, authorization denial tests, XSS sanitizer tests, header probes, dependency scan, and secret scan pass.
2. Privacy gate: No HRM PII, tokens, or secrets in bundles, source maps, logs, analytics, or URLs.
3. Accessibility gate: WCAG 2.2 AA automated checks plus keyboard and screen-reader smoke tests on login, dashboard, employee profile, approval workflow, payroll-sensitive workflow, modal, table, and error states.
4. Deployability gate: `vite build` artifact is reproducible, HTML/cache policy avoids stale chunks, chunk load recovery is tested, and environment config is public-only.
5. Operations gate: Audit events, alerting, runbooks, retention, backup/restore, and incident response ownership are documented before launch.

## Reference links

- https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/quickref/
- https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense
- https://vite.dev/guide/env-and-mode
- https://vite.dev/guide/build
- https://vite.dev/guide/features#async-chunk-loading-optimization
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
- https://www.ory.com/docs/kratos/session-management/overview
