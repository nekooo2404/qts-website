# Audit Logging and Retention

## Purpose

Audit logs must support security investigation, accountability and operational
debugging without becoming a second database of passwords, tokens or
unnecessary HR personal data.

## Events that must be auditable

### Identity and access

- login success/failure;
- logout and session revocation;
- MFA enrollment, challenge, recovery and disablement;
- password/recovery changes;
- application assignment;
- role, permission and membership changes;
- account disablement and reactivation;
- policy or tenant security changes;
- authorization denial and suspicious replay.

### Business data

- employee/profile protected reads and changes;
- salary, payroll and payslip access;
- document upload, view, download, finalize, verify and reject;
- export and bulk extraction;
- attendance corrections;
- leave, contract and workflow approvals;
- lead assignment, status and export changes.

### Platform and security

- configuration changes;
- deployment and rollback;
- database migration;
- backup and restore;
- key/certificate rotation;
- rate-limit and abuse events;
- health degradation and incident actions.

## Canonical event shape

```json
{
  "eventId": "uuid",
  "occurredAt": "2026-09-25T00:00:00Z",
  "requestId": "uuid",
  "actorSubject": "opaque-subject-id",
  "tenantId": "uuid",
  "action": "hrm.employee.read",
  "targetType": "employee",
  "targetId": "opaque-target-id",
  "decision": "allow",
  "reasonCode": "POLICY_MATCH",
  "source": {
    "service": "hrm-service",
    "client": "frontend-hrm"
  },
  "sensitivity": "confidential"
}
```

Required fields are stable and searchable. `actorSubject`, `tenantId` and
`targetId` are identifiers, not display copies of personal data.

## Prohibited log content

Never log:

- passwords or password reset material;
- access tokens, refresh tokens, ID tokens or authorization codes;
- cookies, CSRF tokens or raw session identifiers;
- private keys, Ory secrets or database credentials;
- full CCCD, bank account, salary or document bytes;
- unredacted request bodies containing sensitive HR data.

## Protection and retention

| Log class | Proposed retention | Storage requirement | Review |
|---|---:|---|---|
| Security/audit events | At least 90 days, subject to legal policy | Central, access-controlled and tamper-evident | Monthly |
| Authentication and authorization | At least 90 days | Central searchable store | Monthly |
| Application error logs | 30–90 days | Redacted and correlated | Weekly |
| Debug logs | Short-lived and disabled in production by default | Restricted access | Per incident |
| Legal/security hold | As approved by owner/legal policy | Immutable hold | Case-specific |

The attached detailed-design reference specifies a minimum three-month log
retention in its security tables. QTS should use 90 days as the minimum
baseline only after the data owner and security owner confirm legal and
investigative requirements.

## Integrity and operations

- Synchronize service clocks to an approved time source.
- Protect log writers and readers with separate identities.
- Forward audit events through the event/observability pipeline.
- Alert on repeated denial, anomalous export, impossible travel or key misuse.
- Retain request IDs while hashing or omitting session correlation material.
- Test log delivery failure and ensure security decisions fail closed where
  policy requires it.

## Evidence

- event schema and redaction tests;
- central-storage access policy;
- retention configuration;
- sample investigation using a request ID;
- tamper/access review;
- monthly review record.

