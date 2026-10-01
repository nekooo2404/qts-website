# Data Classification and Retention

## Classification levels

| Level | Meaning | Default handling |
|---|---|---|
| Public | Approved for public distribution | Integrity and availability still protected |
| Internal | Business information for authenticated QTS users | Access-controlled, not indexed publicly |
| Confidential | Personal, operational or customer information | Least privilege, encryption, audited access |
| Restricted | Payroll, credentials, keys, recovery material or high-impact security data | Strongest isolation, encryption, step-up/MFA and explicit review |

## QTS data inventory

| Data set | Classification | Source of truth | Access | Proposed retention | Required control |
|---|---|---|---|---|---|
| Public marketing content | Public | Marketing frontend/content source | Public | Product lifecycle | Integrity, CDN/cache policy |
| Consultation lead | Confidential | Lead service | Assigned staff/admin | 24 months unless contract/legal policy differs | Rate limit, scope, audit export |
| Identity profile and memberships | Confidential | Identity/Kratos/Identity Admin | Identity admins and authorized apps | Account lifecycle plus approved audit period | Encryption, RBAC, lifecycle revoke |
| Passwords, TOTP secrets, backup codes | Restricted | Kratos/secret store | Identity system only | Provider policy; never business-app export | Hash/encrypt, no logs, key separation |
| Employee legal/contact data | Confidential | HRM employee domain | HR scope and field-level policy | Employment lifecycle plus approved legal period | Encryption, FLS, audit |
| CCCD, tax and bank data | Restricted | HRM personal-details domain | Explicit field permissions | Legal/HR policy only | Masking, encryption, step-up and audit |
| Salary and payroll | Restricted | Payroll domain | Payroll/HR scope and employee self-view | Legal/financial policy only | FLS, immutable history, export audit |
| Contracts and HR documents | Restricted | Document storage/domain | Owner/scope/permission | Legal/HR policy only | Private storage, malware scan, download audit |
| Attendance and leave | Confidential | Attendance/Leave domains | Employee/manager/HR scope | Employment lifecycle plus approved policy | Scope, workflow audit |
| Audit/security events | Restricted | Central audit store | Security/auditors | At least 90 days proposed; legal hold where needed | Tamper-evident, redaction, access review |
| Tokens, cookies, private keys | Restricted | Runtime/secret manager | Runtime/security operators | Ephemeral/key-management policy | Never log or export |
| Metrics and traces | Internal/Confidential | Observability platform | Operations/Security | 30–90 days proposed | PII scrubbing and access control |

## Data handling rules

- Collect the minimum fields needed for the stated business purpose.
- Do not duplicate Identity source-of-truth fields in HRM unless the mapping
  is explicitly owned and synchronized.
- Do not include restricted values in list DTOs, logs, URLs or browser storage.
- Do not create public document URLs; downloads must be policy-checked.
- Encrypt data in transit and at rest using managed keys.
- Export requires the same tenant, scope and field-level rules as viewing.
- Retention and deletion must be approved by the data owner and security owner.
- Legal holds suspend deletion only for the specified data and case.

## Retention approval

The durations above are proposed planning values. They do not replace
employment, accounting, privacy or contractual retention obligations. Each data
owner must approve the final schedule and document archival, deletion,
anonymization and restore behavior.

