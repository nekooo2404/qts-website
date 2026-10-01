# Release Acceptance Checklist

This checklist is the final evidence gate for a production release. Every
unchecked item is either a release blocker or requires an explicitly approved
risk exception.

## Architecture and governance

- [ ] System owner and security owner are named and available.
- [ ] Information-system security classification is approved.
- [ ] MFA policy is approved and matches environment configuration.
- [ ] Data owners signed sensitive-data access and retention rules.
- [ ] Requirements Traceability Matrix has no unowned critical row.
- [ ] All architecture decisions affecting release are closed.

## Build and code quality

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `mvnw.cmd -B test` passes.
- [ ] Spring production gate passes.
- [ ] Dependency, container and secret scans pass.
- [ ] No retired backend runtime is in the production path.

## Authentication and authorization

- [ ] Password login and Kratos browser session pass.
- [ ] Hydra Authorization Code + PKCE pass.
- [ ] Portal-to-HRM SSO pass.
- [ ] `/oauth/userinfo` returns the expected access-token response.
- [ ] Invalid issuer, signature, audience and token type are rejected.
- [ ] Logout and cross-app session revocation pass.
- [ ] MFA policy paths pass.
- [ ] Cross-tenant and field-level denial pass.
- [ ] CSRF and trusted-origin rejection pass.

## Data and privacy

- [ ] No password, token, cookie, key or unnecessary PII is in logs.
- [ ] Sensitive fields are encrypted and access-controlled.
- [ ] Documents are private and downloads are audited.
- [ ] Retention and deletion/archival rules are approved.
- [ ] Export paths enforce the same scope and field-level policy as detail reads.

## Operations and recovery

- [ ] All services pass readiness/liveness checks.
- [ ] `X-Request-ID` is preserved or generated.
- [ ] Metrics, logs and alerts are visible to Operations.
- [ ] Backup completed successfully.
- [ ] Isolated restore was verified.
- [ ] RPO/RTO evidence meets approved targets.
- [ ] Rollback was rehearsed or the release has an approved exception.
- [ ] Incident contacts and escalation path are current.

## Acceptance and sign-off

- [ ] UAT signed by Product and data owners.
- [ ] OAT signed by Operations.
- [ ] Security test and penetration-test findings are closed or accepted.
- [ ] Performance report meets approved SLO.
- [ ] WCAG 2.2 AA critical-flow check passes.
- [ ] Release notes, migration notes and rollback notes are archived.
- [ ] Release manager records `Go`, `No-Go` or approved exception.

