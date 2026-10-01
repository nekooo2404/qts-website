# Incident Response Runbook

This runbook applies to security, availability and data-integrity incidents
across Identity, Portal, HRM, Lead and supporting Spring/Ory services.

## Severity

| Severity | Example | Initial acknowledgement | Update cadence |
|---|---|---:|---:|
| SEV-1 | Active credential/token compromise, restricted-data exposure, total SSO outage | 15 minutes | Every 30 minutes |
| SEV-2 | Major HRM/API outage, tenant-isolation suspicion, failed recovery | 30 minutes | Every 60 minutes |
| SEV-3 | Degraded non-critical service, contained security finding | 4 business hours | Daily |
| SEV-4 | Cosmetic or low-risk issue with workaround | 1 business day | At milestone |

Times are proposed operating targets and require approval with the SLO/SLA
decision.

## Lifecycle

### 1. Detect and declare

1. Record time, detector, affected service, environment and request IDs.
2. Page the incident commander and service owner.
3. Assign severity using the table above.
4. Open an incident channel and an evidence log.
5. Preserve logs, metrics, traces and relevant deployment/configuration
   revisions before changing state.

### 2. Triage

Determine:

- authentication, authorization, availability or data-integrity impact;
- affected tenants, users, services and time window;
- whether credentials, tokens, keys or restricted data may be exposed;
- whether the event is ongoing;
- whether a release, migration or configuration change preceded it.

Do not copy passwords, tokens, cookies, private keys or unnecessary HR data into
the incident channel.

### 3. Containment

Choose the least disruptive approved action:

- disable a compromised client or application assignment;
- revoke affected sessions and token families;
- disable a user or rotate a secret/key;
- block a route, source or egress path at the edge;
- pause event polling or a writer;
- roll back to the last known-good Spring release;
- place a service in controlled maintenance mode.

Record every containment action, actor, approval and timestamp.

### 4. Eradication and recovery

1. Remove malicious code/configuration or patch the vulnerable dependency.
2. Validate database integrity and audit events.
3. Restore only through the approved backup/restore procedure when required.
4. Rebuild from a trusted image and verified source.
5. Run Identity, Portal, HRM, protected API, logout and notification smoke
   tests.
6. Monitor error rate, auth failures, queue lag and data access anomalies.
7. Keep the incident open until the incident commander accepts recovery.

### 5. Communication and closure

Communicate only verified facts, impact, mitigation and next update time.
External or customer notification follows the approved legal/security path.

Close with:

- timeline;
- root cause and contributing factors;
- affected assets and data;
- containment/recovery evidence;
- customer/user impact;
- corrective actions with owners and due dates;
- threat-model and runbook updates;
- post-incident review approval.

## Scenario playbooks

### SSO outage or Ory failure

Check edge health, Hydra/Kratos readiness, Identity Bridge logs, issuer,
redirect configuration, database reachability and key compatibility. Do not
disable issuer/audience validation to restore convenience.

### Suspected token or account compromise

Revoke sessions/token families, disable affected client/user, preserve
correlation evidence, rotate only the affected secrets, check `/oauth/userinfo`
and protected API access, then run a focused access review.

### Cross-tenant access suspicion

Immediately stop the affected endpoint or grant if needed, preserve request IDs
and database audit evidence, identify all potentially affected tenants, run
negative authorization tests and notify the security owner.

### Data exposure or backup theft

Restrict storage access, preserve object and audit logs, rotate keys only under
the key-management procedure, identify data classes and retention obligations,
and follow the approved notification process.

### Failed restore or migration

Keep production writers on the known-good state, isolate the failed restore,
capture migration and checksum evidence, and do not perform manual production
data edits during rollback.

## Required roster

The operations handbook must maintain current contacts for:

- incident commander;
- security owner;
- Identity owner;
- HR data owner;
- platform/SRE on-call;
- network/edge owner;
- product and communications lead;
- legal/privacy escalation.

