# Penetration-Test Plan

## Objective

Independently assess whether QTS protects authentication, authorization,
tenant-scoped HR data, documents, APIs, infrastructure boundaries and
operational secrets before production launch and after material changes.

## Scope

### In scope

- Identity login, recovery, MFA enrollment and logout;
- Hydra authorize, consent, callback and token flows;
- Portal and HRM browser clients;
- Identity Admin and Identity Bridge APIs;
- HRM employee, organization, document, payroll and workflow endpoints;
- Lead consultation, staff operations and notification paths;
- tenant, role, data-scope and field-level authorization;
- CSRF, Origin/Referer, CORS, security headers and cookies;
- upload, download, export and report paths;
- rate limiting, idempotency and abuse controls;
- public edge, TLS and approved production exposure;
- container images, dependencies and generated bundles.

### Out of scope unless separately authorized

- destructive testing against production data;
- denial-of-service beyond a bounded load test;
- social engineering or phishing;
- third-party infrastructure not owned or contracted by QTS;
- use of real credentials outside the approved test accounts.

## Rules of engagement

- Written scope and test window are approved by the system and security owners.
- Use synthetic tenants and test identities.
- Do not retrieve or retain real passwords, tokens, documents or payroll data.
- Rate-limit testing to avoid service disruption.
- Stop immediately on evidence of restricted-data exposure or destructive
  behavior.
- Preserve request IDs and sanitized reproduction steps.
- Report critical findings immediately; do not wait for the final report.

## Required test areas

1. OIDC state, nonce, PKCE, redirect and issuer validation.
2. Session fixation, idle/absolute expiry and revocation.
3. MFA enrollment, recovery and policy bypass.
4. JWT signature, issuer, audience, token type, scope and expiry.
5. IDOR and cross-tenant/cross-organization access.
6. Field-level security and export bypass.
7. CSRF, XSS, SQL/OS/NoSQL/template injection and SSRF.
8. Upload MIME confusion, malware scanning and private download bypass.
9. Rate limiting, credential stuffing and lead flooding.
10. Secret exposure in source, images, bundles, logs and error responses.
11. Container, dependency, TLS, header and public exposure weaknesses.
12. Audit completeness and tamper-resistance.

## Deliverables and acceptance

The assessor provides:

- scope and methodology;
- asset and endpoint inventory;
- finding with severity, evidence, impact and reproducibility;
- remediation recommendation;
- retest result;
- residual-risk list.

Release acceptance requires:

- all critical findings closed;
- high findings closed or explicitly risk-accepted with expiry and compensating
  control;
- retest confirms remediation;
- threat model and traceability matrix are updated;
- report is stored under controlled access without secrets or real PII.

## Cadence

- before first production launch;
- after material authentication, authorization, network or data changes;
- after a critical security incident;
- at least annually where required by the approved security classification.

