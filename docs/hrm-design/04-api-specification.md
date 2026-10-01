# 04 — API Specification

Base: `https://api.qtsgroup.vn/api/v1`  
Auth: `Authorization: Bearer <access_token>` audience `qts-hrm`  
Time: ISO-8601 UTC. Money: `{ "amount": "15000000.00", "currency": "VND" }`  
Concurrency: mutating DTOs include `version`. Conflict → `409 VERSION_CONFLICT`.

State changes use explicit POST (`/submit`, `/approve`, `/reject`, `/lock`, `/archive`). `DELETE` is not offered for employee, attendance source, payroll snapshot, workflow action, document version or audit.

## Envelope

This envelope applies to HRM domain APIs. Existing OIDC token/JWKS endpoints retain the OAuth2 response format required by the protocol.

Success object:

```json
{
  "success": true,
  "data": {},
  "message": "",
  "meta": { "requestId": "018f2d91-..." }
}
```

Success list:

```json
{
  "success": true,
  "data": [],
  "message": "",
  "meta": { "page": 1, "pageSize": 25, "total": 186, "requestId": "018f2d91-..." }
}
```

Error (see 09 for full catalog):

```json
{
  "success": false,
  "errorCode": "PERMISSION_002",
  "message": "Bạn không có quyền truy cập hồ sơ này.",
  "requestId": "018f2d91-...",
  "timestamp": "2026-09-11T03:18:00Z"
}
```

Validation adds `details: [{ "field", "code", "message" }]`.

Client never sends `tenantId`, actor, or role in the body. Server takes them from the token.

---

## Identity / session / organization

Existing Identity HTTP (do not duplicate): `GET /api/session`, `GET /api/launcher`, `GET /oauth/userinfo` (also mounted at `/api/v1/identity/...`). HRM SPA consumes those. Do not add a parallel `GET /api/v1/me`.

Identity payloads do not include `employeeId`, `employeeCode`, or `dataScope`. HRM maps userinfo/session → `SessionDto`; employee fields come from `employee_identity_links` after Employee exists (otherwise omit/null). `dataScope` is derived by HRM policy, not stored on Identity. `memberships.department` is not an Organization scope list.

Role catalogue writes stay in Identity Console. Identity `urls.py` has no `/roles` resource today. Do not add `GET/POST /api/v1/roles` in an HRM PR. The HRM Permission screen is a read-only preview of session capabilities; it must not persist grants.

| Method | Endpoint | Purpose | Request | Response DTO | Permission | Errors |
|---|---|---|---|---|---|---|
| GET | `/api/session` | Session, memberships, permission codes, tenant — **existing Identity** | — | existing session payload; HRM maps to `SessionDto` | authenticated | 401 |
| GET | `/api/launcher` | Assigned launcher apps — **existing Identity** | — | existing launcher payload | assignment | 401, 403 |
| GET | `/organizations/companies` | Legal entities | status/page | `CompanyDto[]` | `organization.company.read` | 403 |
| GET | `/organizations/branches` | Branches | `companyId` | `BranchDto[]` | `organization.branch.read` | 403 |
| GET | `/organizations/departments` | Department tree | `companyId`, `branchId`, `parentId` | `DepartmentDto[]` | `organization.department.read` | 400, 403 |
| POST | `/organizations/departments` | Create department | code/name/company/parent/effectiveFrom | `DepartmentDto` | `organization.department.manage` | 400, 403, 409 |
| PUT | `/organizations/departments/{id}` | Update department | `version`, no cycle | `DepartmentDto` | `organization.department.manage` | 400, 403, 404, 409 |
| GET | `/organizations/positions` | Positions | department/title/page | `PositionDto[]` | `organization.position.read` | 403 |
| POST | `/organizations/positions` | Create position | reportsTo cannot cycle | `PositionDto` | `organization.position.manage` | 400, 403, 409 |

`SessionDto` is an HRM mapping of `/oauth/userinfo`, not an Identity payload. `employeeId` / `employeeCode` stay `null` until `employee_identity_links` exists. `dataScope` is derived by HRM (`company | manager | self` in the first slice) and is a UI hint only. `mfa` comes from id_token `amr` when parseable; otherwise omit/`null`.

```json
{
  "userId": "uuid",
  "displayName": "Nguyễn Thị Lan",
  "email": "lan@qts.com",
  "tenantId": "uuid",
  "tenantName": "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ QTS",
  "employeeId": null,
  "employeeCode": null,
  "roles": ["hr-manager"],
  "permissions": ["hrm.employee.read", "hrm.employee.field.cccd"],
  "dataScope": "company",
  "mfa": null
}
```

---

## Employee

`EmployeeListItemDto` never contains CCCD, salary, bank, tax, private address.

```json
{
  "id": "uuid",
  "employeeCode": "QTS-00028",
  "legalName": "Nguyễn Văn Đức",
  "workEmail": "duc@qts.com",
  "departmentName": "Engineering",
  "jobTitle": "Kỹ sư",
  "managerName": "Phạm Quang Huy",
  "employmentStatus": "active",
  "employmentStatusLabel": "Đang làm việc"
}
```

| Method | Endpoint | Purpose | Request / validation | Permission | Scope / FLS / audit | Errors |
|---|---|---|---|---|---|---|
| GET | `/employees` | Paginated directory | `q`, `departmentId`, `branchId`, `status`, `employmentType`, `page`, `pageSize` | `hrm.employee.read` | Scope before count. No confidential columns. | 400, 403 |
| POST | `/employees` | Create personnel + provisioning request | legal name, code unique, manager valid, joining date | `hrm.employee.create` | HR scope; `employee.created` | 400, 403, 409 |
| GET | `/employees/{id}` | Field-projected profile | `include` allow-list: `personal,employment,contract` | `hrm.employee.read` | Scope + FLS; audit protected view | 403, 404 |
| PUT | `/employees/{id}` | Update allowed public/management fields | `version` | `hrm.employee.edit` | Scope + FLS; audit | 400, 403, 404, 409 |
| GET | `/employees/{id}/personal-details` | Confidential personal DTO | — | `hrm.employee.field.personal` | CCCD/tax/bank gated separately; audit view | 403, 404 |
| PUT | `/employees/{id}/personal-details` | Update encrypted legal/contact | `version`; CCCD format/hash unique | field edit permissions matching changed groups | Scope + audit diff | 400, 403, 409 |
| GET | `/employees/{id}/employment-records` | Effective assignment history | date/status | `hrm.employee.read` | No salary | 403, 404 |
| POST | `/employees/{id}/employment-records` | Transfer / manager / status | no overlap; manager not self/cycle | `hrm.employee.employment.manage` | Events `manager_changed` / `status_changed` | 400, 403, 409 |
| GET | `/employees/{id}/dependents` | Dependents | — | `hrm.employee.field.tax` | Audit view | 403, 404 |
| POST | `/employees/{id}/dependents` | Add dependent | relation, DOB, identity | `hrm.employee.field.tax` + edit | Audit | 400, 403, 409 |
| GET | `/employees/{id}/emergency-contacts` | Emergency 1-N | — | `hrm.employee.field.personal` | Audit | 403, 404 |
| GET | `/employees/{id}/history` | Employment/salary history | `type=employment\|salary` | read + salary FLS for salary | Audit salary read | 403, 404 |
| GET | `/employees/{id}/audit-events` | Target audit | date/action/page | `hrm.audit.read` | Redacted | 403, 404 |
| POST | `/employees/exports` | Async export job | allow-listed columns | `hrm.employee.export` | Same scope/FLS; audit request+download | 400, 403, 422 |
| POST | `/employees/{id}/offboard` | Controlled offboarding | effective date, reason, decision ref | `hrm.employee.offboard` | No delete; Identity deactivation after complete | 400, 403, 409 |

Unauthorized salary/bank: omit the field. Do not send `{ "access": "denied" }` or a UI placeholder.

Authorized masked CCCD:

```json
{ "idNumberMasked": "********1234", "idDocumentType": "cccd" }
```

---

## Contract & Document

| Method | Endpoint | Purpose | Request / validation | Permission | Scope / FLS / audit | Errors |
|---|---|---|---|---|---|---|
| GET | `/contracts` | Contract list | employee/status/`expiringBefore`/page | `hrm.contract.read` | Employee scope; no salary on list | 403 |
| POST | `/contracts` | Create draft | unique number, dates, eligible employee | `hrm.contract.create` | Audit | 400, 403, 409 |
| GET | `/contracts/{id}` | Detail | — | `hrm.contract.read` | Salary FLS | 403, 404 |
| PUT | `/contracts/{id}` | Update draft / allowed fields | `version`; signed terms not overwritten | `hrm.contract.edit` | Audit | 400, 403, 409 |
| POST | `/contracts/{id}/renewals` | Start `contract_renewal` | future range | `hrm.contract.renew` | Creates workflow. Director resolver mapping is unspecified — do not default it to `parent_id` | 400, 403, 409 |
| POST | `/contracts/{id}/terminate` | Termination proposal | date + legal reason | `hrm.contract.terminate` | Audit. Workflow path is **unspecified** — persist proposal only; do not invent steps | 400, 403, 409 |
| GET | `/documents` | Metadata list | owner/type/verification/expiry/page | `hrm.document.view` | Policy + scope | 403 |
| POST | `/documents/uploads` | Upload session | type, owner, extension/claimed MIME; actual size recorded | `hrm.document.upload` | Private PUT; audit. Numeric cap unspecified | 400, 403, 415, 422 |
| POST | `/documents/{id}/versions` | Finalize scanned version | checksum, scan passed, MIME match | `hrm.document.edit` | Immutable after; audit | 400, 403, 409, 422 |
| GET | `/documents/{id}` | Detail metadata | — | `hrm.document.view` | No storage key; audit view | 403, 404 |
| POST | `/documents/{id}/download` | Controlled download | optional `versionId` | `hrm.document.download` | Policy + audit **before** bytes | 403, 404, 409 |
| PUT | `/documents/{id}/verification` | Verify/reject | version, note, status | `hrm.document.verify` | Audit | 400, 403, 409 |
| GET | `/document-checklists` | Required/missing | `employeeId` | `hrm.document.view` | Scope | 403 |

---

## Attendance & Leave

| Method | Endpoint | Purpose | Request / validation | Permission | Scope / audit | Errors |
|---|---|---|---|---|---|---|
| GET | `/attendance/records` | Daily/month records | employee/date range/dept/shift/page | `hrm.attendance.read` | Scope; PIN/face omitted | 400, 403 |
| GET | `/attendance/summary` | Day aggregates (check-in, late, early, OT, missing) | date/dept | `hrm.attendance.read` | Scope aggregates. Not the KPI domain | 400, 403 |
| POST | `/attendance/claims` | Create claim | date, reason, claimed time; source immutable | `hrm.attendance.claim.create` | Starts `attendance_claim` workflow | 400, 403, 409 |
| POST | `/attendance/late-early-requests` | Late/early | date, type, minutes>0, reason | `hrm.attendance.late_early.create` | Starts `late_early_request` workflow | 400, 403, 409 |
| POST | `/attendance/overtime-requests` | OT | date, start/end, no overlap | `hrm.attendance.overtime.create` | Persist request. `overtime_request` workflow owner is unspecified — do not invent a definition | 400, 403, 409 |
| GET | `/attendance/claims/{id}` | Claim + workflow | — | claim read | Requester/team/HR | 403, 404 |
| POST | `/attendance/imports` | Device import batch | source, format | `hrm.attendance.import` | Security + business log | 400, 403, 415, 422 |
| GET | `/leave/types` | Leave catalogue | status | `hrm.leave.read` | Tenant | 403 |
| GET | `/leave/balances/me` | Own balances | year | `hrm.leave.read_own` | Self | 403 |
| GET | `/leave/balances` | Scoped balances | employee/dept/year | `hrm.leave.balance.read` | Manager/HR | 403 |
| POST | `/leave/requests` | Submit leave | type, dates, reason; overlap/balance | `hrm.leave.request.create` | Starts `leave_request` workflow | 400, 403, 409, 422 |
| GET | `/leave/requests` | List | mine/team/status/dates/page | `hrm.leave.read` | Self/team/HR | 400, 403 |
| GET | `/leave/requests/{id}` | Detail + timeline | — | `hrm.leave.read` | Scope | 403, 404 |
| POST | `/leave/requests/{id}/cancel` | Cancel | `version`, reason | `hrm.leave.request.cancel` | State policy; ledger reverse if needed | 400, 403, 409 |

Leave create body:

```json
{
  "leaveTypeId": "uuid",
  "startDate": "2026-09-15",
  "endDate": "2026-09-16",
  "reason": "Việc gia đình",
  "days": [{ "leaveDate": "2026-09-15", "fraction": "1.00" }]
}
```

---

## Payroll & Workflow

| Method | Endpoint | Purpose | Request / validation | Permission | Scope / FLS / audit | Errors |
|---|---|---|---|---|---|---|
| GET | `/payroll/periods` | Periods | status/year/page | `hrm.payroll.read` | Payroll scope | 403 |
| POST | `/payroll/periods` | Create period | unique `periodCode`, date range | `hrm.payroll.period.manage` | Audit | 400, 403, 409 |
| POST | `/payroll/periods/{id}/calculate` | Start run | approved snapshot/version | `hrm.payroll.calculate` | Calls owner DTOs; never Employee DB | 400, 403, 409, 422 |
| GET | `/payroll/periods/{id}/details` | Lines | dept/employee/page | `hrm.payroll.read` | Manager: no gross/net | 403 |
| GET | `/payroll/details/{id}` | One result | — | `hrm.payroll.read` | FLS; audit view | 403, 404 |
| POST | `/payroll/periods/{id}/review` | Mark reviewed | runId, version | `hrm.payroll.review` | Audit | 400, 403, 409 |
| POST | `/payroll/periods/{id}/lock` | Lock | runId, version, confirm | `hrm.payroll.lock` | Immutable; audit | 400, 403, 409 |
| GET | `/payslips/me` | Own payslips | period/page | `hrm.payslip.read_own` | Self | 403 |
| POST | `/payslips/{id}/download` | Password PDF | — | `hrm.payslip.download` | Own or payroll; audit | 403, 404 |
| GET | `/workflow/definitions` | Definitions | domainType | `hrm.workflow.definition.read` | Tenant | 403 |
| POST | `/workflow/definitions` | Create version | ordered steps, resolvers | `hrm.workflow.definition.manage` | Audit | 400, 403, 409 |
| GET | `/workflow/inbox` | Actionable queue | status/domainType/page | `hrm.workflow.read` | Actor/delegate/requester/HR | 403 |
| GET | `/workflow/instances/{id}` | Timeline | — | `hrm.workflow.read` | Entity scope | 403, 404 |
| POST | `/workflow/instances/{id}/approve` | Approve step | `version`, comment optional | `hrm.workflow.approve` | Current actor only; audit | 400, 403, 409, 422 |
| POST | `/workflow/instances/{id}/reject` | Reject | `version`, comment required | `hrm.workflow.reject` | Terminal; audit | 400, 403, 409, 422 |
| POST | `/workflow/instances/{id}/reassign` | Reassign | target, reason | `hrm.workflow.reassign` | Policy; audit | 400, 403, 409 |
| POST | `/workflow/delegations` | Delegate | delegate, start/end, no self | `hrm.workflow.delegate` | Audit | 400, 403, 409 |

Lock body:

```json
{ "runId": "uuid", "version": 3, "confirm": true }
```

Locked period mutation → `409 PAYROLL_PERIOD_LOCKED`.

## Dashboard read models

These are query endpoints over scoped aggregates, not a tenth domain.

| Method | Endpoint | Permission | Notes |
|---|---|---|---|
| GET | `/dashboards/executive` | `hrm.dashboard.executive` | Headcount, joiners, leavers, salary cost (needs `hrm.payroll.read` or omit cost), trends |
| GET | `/dashboards/hr` | `hrm.dashboard.hr` | Missing profiles, expiring contracts, attendance exceptions, payroll period status; counts already scoped |

## DTO rules

- No ORM graph, no `storage_object_key`, no PIN, no raw token.
- `capabilities` on detail DTO (`canEdit`, `canDownload`, `canApprove`) is a hint; API re-checks.
- Field denial: mask CCCD `********1234` only when a masked view is allowed; otherwise omit salary/bank. Do not invent a fourth representation. Never send the raw value for the UI to hide.
