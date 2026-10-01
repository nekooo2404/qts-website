# Requirements Traceability Matrix

This matrix connects business and security requirements to the owning domain,
API or event contract, UI surface, automated test and acceptance evidence.
Rows are `Draft` until the Product and Security owners sign the corresponding
acceptance evidence.

## Traceability rules

- The client never supplies tenant, actor, role or permission as authority;
  the server derives them from the verified session/token.
- A UI control is not evidence of authorization. The protected API and its
  denial test are authoritative.
- A requirement is not complete until its implementation, test and operational
  evidence are linked.
- Requirements from the attached detailed-design document are treated as
  reference controls; domain-specific QTS decisions remain in the decision
  register.

## Matrix

| ID | Requirement | Source | Owner domain | API/event | UI surface | Test IDs | Acceptance evidence | Status |
|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Password login creates a Kratos browser session without exposing the password to business apps | QTS Identity UX; DOCX XIV.10 | Identity | Kratos browser flow | Identity sign-in | AUTH-001 | Browser trace, cookie flags, Kratos session proof | Evidence pending |
| AUTH-002 | Portal and HRM use OAuth Authorization Code + PKCE with exact redirect URIs | QTS production research; Spring runbook | Identity/Platform | Hydra authorize/token | Portal and HRM bootstrap | AUTH-002 | Redirect allowlist, state/nonce/PKCE test, token exchange trace | Evidence pending |
| AUTH-003 | An existing Identity session enables cross-application SSO | QTS ecosystem requirements | Identity/Portal/HRM | Hydra login bridge; `/oauth/userinfo` | Launcher and HRM entry | AUTH-003 | Portal → HRM browser trace and `/oauth/userinfo` response | Evidence pending |
| AUTH-004 | Logout revokes local and upstream sessions according to policy | Spring runbook; DOCX XIV.10 | Identity | logout bridge/session revoke | Identity sign-out | AUTH-004 | Cross-app logout trace and revoked-session API result | Evidence pending |
| AUTH-005 | MFA is opt-in for ordinary users and policy-forced for approved high-risk groups | QTS product decision; DOCX XIV.10 | Identity/Security | Kratos TOTP/AAL2 | Settings/security | AUTH-005 | Approved policy, AAL tests and recovery drill | Evidence pending |
| AUTH-006 | Failed credentials use a generic response and do not enumerate users | Identity UX specification | Identity | Kratos flow error | Sign-in error state | SEC-005 | Response comparison and browser screenshot | Draft |
| AUTH-007 | Session idle and absolute expiry are enforced server-side | DOCX XIV.10; HRM production research | Identity/Platform | Kratos/session policy | Expired-session state | AUTH-006 | Timer policy, expiry trace and re-authentication result | Evidence pending |
| AUTH-008 | Production public origins and issuer values are HTTPS-only | Spring runbook | Platform | Env/config validation | HRM/Portal auth gate | SEC-006 | `validate-production-env.sh` output and header probe | Draft |
| IDN-001 | Identity is the source of truth for login identity, memberships and application assignment | QTS ecosystem requirements | Identity | session/launcher/userinfo | Identity console and launcher | IDN-001 | Ownership map and API contract | Draft |
| IDN-002 | Employee provisioning and de-provisioning are lifecycle events, not ad-hoc HRM users | HRM domain model | Identity/HRM | provisioning events | HR employee lifecycle | IDN-002 | Event contract, idempotency and offboarding evidence | Evidence pending |
| AUTHZ-001 | Every protected API validates issuer, signature, audience, token type and expiry | Spring runbook; HRM production research | All services | Resource-server middleware | N/A | SEC-001 | 401/403 matrix and JWT validation logs | Evidence pending |
| AUTHZ-002 | Tenant, organization and data scope are enforced server-side | HRM permission matrix | HRM/Identity | domain repositories/policies | HRM screens | SEC-002 | Cross-tenant and cross-scope denial results | Evidence pending |
| AUTHZ-003 | Sensitive fields use field-level security and omission, not client-side hiding | HRM API specification | HRM | projected DTOs | Employee/profile/payroll | HRM-002 | DTO contract and salary/CCCD denial tests | Draft |
| AUTHZ-004 | Administrative and permission changes are audited | DOCX XIV.10; HRM production research | Identity/HRM | AuditEvent/outbox | Admin console | SEC-003 | Audit record with request ID and decision | Evidence pending |
| HR-001 | Authorized users can list, create and update employees with optimistic concurrency | HRM API specification | HRM | `/employees` | Employee module | HRM-001 | API contract, migration and UAT record | Evidence pending |
| HR-002 | Employee records are never hard-deleted | HRM domain model | HRM | offboarding command | Employee lifecycle | HRM-003 | Database constraint/status transition test | Draft |
| HR-003 | Documents have no public URL and downloads are policy-checked before bytes are issued | HRM domain/API | HRM/Storage | upload/finalize/download | Document module | SEC-004 | Storage policy, malware/MIME test and audit event | Evidence pending |
| HR-004 | Workflow actions are limited to the assigned actor or active delegate | HRM workflow design | HRM | approve/reject/reassign | Workflow inbox | HRM-004 | Actor/delegate denial matrix and audit trail | Evidence pending |
| LEAD-001 | Public consultation submissions are validated, rate-limited and idempotent | Spring runbook; Lead service | Lead/Event | lead API/outbox | Marketing form | LEAD-001 | 201/429/idempotency evidence | Draft |
| LEAD-002 | Lead data and notifications are delivered to authorized staff/admin users | User requirement | Lead/Event/Portal | outbox/notification | Portal notification center | LEAD-002 | Event delivery and permission-filtered view | Evidence pending |
| DATA-001 | Each domain owns its database schema and publishes integration events | HRM domain model; ecosystem requirements | Platform/All services | Flyway/outbox | N/A | DATA-001 | Grants, migrations and event contract review | Evidence pending |
| DATA-002 | Sensitive data is encrypted in transit and at rest with managed key access | DOCX XIV.10 | Platform/Security | TLS/storage/DB controls | N/A | SEC-007 | TLS scan, key policy and restore proof | Evidence pending |
| OPS-001 | All production services expose readiness/liveness and correlation IDs | Spring runbook | Platform/All services | Actuator/X-Request-ID | Operations | OPS-001 | Probe results, metric/log sample | Draft |
| OPS-002 | Backup snapshots are complete, access-controlled and restored in isolation | DOCX XIV.10; existing scripts | Operations | `scripts/backup.sh` | Operations runbook | OPS-002 | Snapshot manifest, checksum and restore report | Evidence pending |
| OPS-003 | Rollback restores the previous known-good Spring release without manual data edits | Spring runbook | Release/Operations | compose/image rollback | N/A | OPS-003 | Dry-run report and release artifact | Evidence pending |
| SEC-001 | Browser-cookie mutations require CSRF and trusted-origin checks | Spring runbook | Identity/All browser APIs | Origin/CSRF middleware | Identity/Portal/HRM | SEC-008 | Missing-token and hostile-origin denial tests | Draft |
| SEC-002 | Common web/API attacks are tested and blocked | DOCX XIV.10; OWASP-aligned research | Security/All services | validation/WAF/ORM | All forms | SEC-009 | SAST/DAST/pentest report and remediation | Evidence pending |
| PERF-001 | Identity and HRM meet approved latency, capacity and error-budget targets | DOCX XIV.6; SLO document | SRE/All services | metrics/load paths | Critical screens | PERF-001 | Baseline/load/soak report | Evidence pending |
| A11Y-001 | Critical auth and HRM workflows meet WCAG 2.2 AA target | HRM design/research | Frontend | semantic controls | Login, tables, dialogs, workflow | A11Y-001 | Automated and keyboard/screen-reader report | Evidence pending |
| GOV-001 | Each release has UAT, OAT, security, performance and operational evidence | DOCX XIV.9 | Release/Product/Security | release checklist | N/A | GOV-001 | Signed acceptance packet | Evidence pending |

## Closure rule

A row moves to `Approved` only when the evidence link is attached and the
accountable owner signs the acceptance checklist. A passing unit test alone is
not sufficient for rows involving infrastructure, security, backup, ownership
or operational recovery.

