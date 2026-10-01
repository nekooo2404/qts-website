# QTS Threat Model

## Assets and trust boundaries

High-value assets:

- identity credentials, browser sessions, OIDC codes and tokens;
- tenant memberships, roles, permissions and application assignments;
- employee, payroll, contract and document data;
- consultation leads and notification content;
- database backups, Ory keys and deployment secrets;
- audit logs and security telemetry.

Trust boundaries:

1. browser ↔ public edge;
2. public edge ↔ frontend/gateway;
3. gateway ↔ Identity/Ory;
4. gateway ↔ business APIs;
5. services ↔ databases/storage/Redis;
6. production ↔ management/CI/CD;
7. production ↔ backup/observability systems.

## Threat register

| ID | Threat | Likelihood/impact | Required mitigation | Evidence | Residual owner |
|---|---|---|---|---|---|
| THR-001 | Credential phishing or password reuse | Med/High | Kratos policy, rate limit, MFA for risk groups, generic errors, user training | Auth and MFA tests | Security |
| THR-002 | Authorization-code interception or login CSRF | Med/High | PKCE, state, nonce, exact redirect allowlist, trusted-origin checks | OIDC negative tests | Identity |
| THR-003 | Token replay or wrong audience | Med/High | Short-lived tokens, audience/token-type validation, rotation/session revoke | Resource-server tests | Identity |
| THR-004 | Session fixation or stale session | Med/High | Regenerate/revoke session, secure cookies, idle/absolute timeout | Session tests | Identity |
| THR-005 | Cross-tenant IDOR | Med/Critical | Server-side tenant/data-scope predicate and deny-by-default | Cross-tenant tests | HRM/Identity |
| THR-006 | Field-level salary/CCCD leakage | Med/Critical | Projected DTOs, FLS policy, export controls, audit | HRM security tests | HR data owner |
| THR-007 | CSRF on cookie mutation | Med/High | CSRF token plus Origin/Referer validation, no state-changing GET | Negative API tests | Platform |
| THR-008 | XSS/injection through user input | Med/High | Validation, safe rendering, parameterized SQL, CSP, DAST | SAST/DAST/pentest | Engineering |
| THR-009 | Malicious document upload | Med/High | Claimed/detected MIME check, size policy, malware scan, private storage | Upload tests | HRM/Platform |
| THR-010 | SSRF or open redirect | Low/High | URL allowlists, exact redirect URIs, egress policy | DAST and code review | Platform |
| THR-011 | Supply-chain compromise | Med/High | Lockfiles, dependency/image scan, signed/pinned CI actions, SBOM | CI evidence | Platform |
| THR-012 | Insider privilege misuse | Med/Critical | Least privilege, step-up/MFA, access review, immutable audit | Review and audit report | Security |
| THR-013 | Backup theft or key loss | Low/Critical | Encryption, separated custody, restore drill, least privilege | DR report | Operations |
| THR-014 | Log tampering or sensitive log leakage | Med/High | Central tamper-evident store, redaction and access review | Log test/review | Security |
| THR-015 | DDoS, abuse or lead flooding | Med/Med | WAF, rate limit, idempotency, backpressure and alerting | 429/load evidence | Platform |
| THR-016 | Service or database outage | Med/High | Health probes, redundancy, backups, RTO exercise and rollback | OAT/DR report | SRE |

## Review triggers

Re-review the threat model when there is a change to:

- Ory issuer, client, redirect or consent flow;
- token claims, audience, scopes or session handling;
- tenant, role, data-scope or FLS policy;
- document storage, export or notification path;
- network exposure, WAF, database or secret-manager topology;
- a critical dependency, major release or security incident.

## Risk acceptance

Residual risk must identify a named owner, expiry date, compensating control and
retest date. “Low likelihood” is not a reason to omit a high-impact threat.

