# Test, UAT, OAT, Security and Performance Plan

## Test layers

| Layer | Purpose | Owner | Required evidence |
|---|---|---|---|
| Unit | Domain rules, validation, mapping and policy decisions | Service team | Maven/JUnit or frontend test report |
| Integration | Database, Flyway, Ory, Redis, outbox and service boundaries | Service team | Test database report |
| Contract | API envelopes, OAuth protocol responses, event payloads | Platform + consumer teams | Contract diff/report |
| Browser SSO | Login, callback, launcher, Portal, HRM, logout and expiry | QA | Playwright trace/video/report |
| UAT | Business user confirms workflows and data visibility | Product/data owners | Signed UAT scenarios |
| OAT | Operations confirms health, deploy, rollback, recovery and observability | SRE/Operations | OAT checklist |
| Performance | Baseline, load, stress and soak under agreed capacity | SRE/QA | Metrics and bottleneck report |
| Security | SAST, dependency, DAST, authz, abuse, threat-model controls and pentest | Security | Findings, remediation and retest |
| Accessibility | WCAG 2.2 AA keyboard, focus, labels and status messages | UX/QA | Axe and manual report |
| DR | Backup, isolated restore and failover | SRE/Security | Restore and exercise report |

## Minimum scenario catalogue

| ID | Scenario | Expected result | Evidence |
|---|---|---|---|
| AUTH-001 | Password login through QTS Identity | Kratos creates a secure browser session; no business app receives a password | Browser trace + cookie probe |
| AUTH-002 | OIDC Authorization Code + PKCE | Exact redirect, state, nonce and verifier are accepted; invalid values are rejected | Hydra trace |
| AUTH-003 | Portal to HRM SSO | HRM opens without another credential prompt when the Identity session is valid | Cross-app Playwright report |
| AUTH-004 | Logout and session revocation | Local and upstream sessions are revoked according to policy | Logout trace + API status |
| AUTH-005 | MFA opt-in and forced-risk paths | Ordinary users follow approved default; privileged/external policy path requires MFA | Kratos AAL evidence |
| AUTH-006 | Expired session | Protected request returns safe expiry state and login can restart | Browser/API report |
| AUTHZ-001 | Invalid issuer/audience/token type | API returns 401 and does not disclose data | Resource-server test |
| AUTHZ-002 | Cross-tenant object access | API returns 403/404 according to policy and writes an audit event | Security test |
| AUTHZ-003 | Salary/CCCD field denial | Sensitive field is omitted or request denied; no value leaks in logs | HRM API test |
| AUTHZ-004 | Workflow actor denial | Only current actor or active delegate can approve/reject | Workflow test |
| HRM-001 | Employee lifecycle | Create/update/offboard obeys invariants and optimistic concurrency | UAT + integration report |
| HRM-002 | Document upload/download | MIME/virus/policy checks run before private download bytes | Security + UAT report |
| LEAD-001 | Consultation submission | Valid request creates one lead and outbox event | Lead test |
| LEAD-002 | Repeated consultation submission | Abuse protection returns 429 with `Retry-After` and does not duplicate | API report |
| OPS-001 | Readiness and correlation | All services expose readiness and preserve/create `X-Request-ID` | OAT report |
| OPS-002 | Backup and restore | Snapshot is complete; isolated restore matches integrity evidence | DR report |
| OPS-003 | Rollback | Previous image/config is restored without manual data edits | Release report |
| SEC-001 | CSRF and trusted-origin checks | Missing token or hostile origin is rejected | Bridge/API test |
| SEC-002 | Injection/XSS/IDOR | Automated and manual tests find no exploitable high/critical issue | Security report |
| SEC-003 | Secret and dependency scan | No committed secret; no unresolved high/critical dependency finding | CI evidence |
| PERF-001 | Baseline | Normal traffic produces agreed latency/error measurements | Baseline report |
| PERF-002 | Load | Peak concurrent usage stays within approved SLO | Load report |
| PERF-003 | Soak | Long-running traffic shows no memory, connection or queue leak | Soak report |
| A11Y-001 | Critical keyboard workflow | Login, dialogs, tables and approvals are keyboard-operable with visible focus | Axe + manual report |

## Commands and evidence sources

```powershell
npm run typecheck
npm run lint
npm run build
npm run test:ory
npm run test:portal
npm run test:production
mvnw.cmd -B test
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1
```

For a local environment where Docker image builds are unavailable:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1 -SkipDockerBuild
```

The skipped Docker build is not production evidence. A CI or release-host
Docker build is still required.

## Performance method

1. Define traffic model: registered users, concurrent users, requests per
   second, payload sizes, file sizes and event rate.
2. Baseline each Tier 0 and Tier 1 service.
3. Run load at expected peak and at a documented safety margin.
4. Run a soak test long enough to expose memory, connection and queue leaks.
5. Capture p50/p95/p99 latency, error rate, saturation, outbox lag, database
   locks, CPU, memory and network.
6. Compare against the approved SLO and record exceptions.

## Security test method

- Verify OIDC state, nonce, PKCE, exact redirect URI and audience.
- Verify cookie flags, CSRF, Origin/Referer and logout protections.
- Verify RBAC, tenant scope, data scope, field-level security and IDOR.
- Scan dependencies, images, source and generated bundles for secrets.
- Run authenticated and unauthenticated DAST.
- Exercise upload MIME/virus checks and private download authorization.
- Validate safe errors and redaction.
- Run independent penetration testing before go-live and after major changes.

## UAT and OAT exit criteria

UAT passes only when the business/data owner signs every critical workflow.
OAT passes only when Operations signs health, observability, deploy, rollback,
backup/restore and incident procedures. A technical test pass cannot substitute
for either approval.

