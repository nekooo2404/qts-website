# 03 — Domain Model

Each domain owns its aggregates, invariants and events. A domain never mutates another domain’s tables.

## Command / query / event convention

| Kind | Rule |
|---|---|
| Command | Named after a business action (`SubmitLeaveRequest`, `LockPayrollPeriod`). Validated, authorized, then applied in one owner transaction + outbox. |
| Query | Returns a DTO after RBAC + data scope + field projection. Never returns an ORM entity. |
| Domain event | Published from outbox after commit. Consumers are idempotent. Payload contains IDs/versions, not raw CCCD/salary/bank. |

Logical employee identity in events: `employeeId` (UUID) + `employeeCode`. Logical manager used by Workflow: `parentId` = current `employee_employment_records.manager_employee_id`.

---

## DOMAIN 01 — Identity & Access Management

**Aggregates:** `User`, `Membership`, `Role`, `Application`, `IdentitySession`

| Aggregate | Invariant |
|---|---|
| User | Email unique; Identity does not store HR legal profile |
| Membership | One membership per `(tenant, user)`; `policy_version` increments on role/grant change |
| Role | Existing Identity system roles stay. HRM **adds** `hr-manager`, `hr-staff`, `accountant` as undeletable. Do not delete `portal-limited`, `organization-admin`, `developer`, `customer`. |
| Application | Keep `qts-hr` for the Portal HR tile. Add `qts-hrm` as a public OIDC client alongside `qts-portal`. Secret never returned. |
| Session | Refresh reuse revokes the family |

**Commands:** `AuthenticateOidc`, `AssignApplication`, `GrantRole`, `RevokeMembership`, `DeactivateUser`  
**Queries:** `GetSession`, `ListAssignedApplications`, `ListRoles`  
**Events:** `identity.user_provisioned`, `identity.application_assigned`, `identity.role_changed`, `identity.permission_changed`, `identity.user_deactivated`

HRM does not create login users ad hoc. Employee Service emits a provisioning request; Identity creates/links the subject; Identity writes `work_email` / `identity_user_id` back through `employee_identity_links`.

---

## DOMAIN 02 — Organization Management

**Aggregates:** `Company`, `Department`, `Position`

| Aggregate | Invariant |
|---|---|
| Company | Unique `code` per tenant; legal employer for contracts/payroll scope |
| Department | `parent_department_id` cannot cycle; child stays in the same company |
| Position | `reports_to_position_id` cannot cycle; this is planned org design, not workflow actor |

**Commands:** `CreateCompany`, `CreateDepartment`, `MoveDepartment`, `CreatePosition`  
**Queries:** `ListDepartments`, `GetOrganizationTree`, `ListPositions`  
**Events:** `organization.department_changed`, `organization.position_changed`

Changing a department does not rewrite `employee_employment_records` history. HR creates a new effective employment record.

---

## DOMAIN 03 — Employee Management

**Aggregates:** `Employee` (root), with entities PersonalDetails, EmploymentRecord, Dependent, EmergencyContact, Education, Certificate, IdentityLink

| Invariant | Enforcement |
|---|---|
| `employee_code` unique per tenant, never reused | Unique constraint |
| Never hard-delete | `active=false` + catalog Nghỉ việc (`resigned` is a storage key) |
| Exactly one current employment record | Partial unique on `is_current` / exclusion on overlapping `effective_from/to` |
| `parent_id` ≠ self and no manager cycle | Domain service walk + reject |
| Confidential fields live in `employee_personal_details` | FLS projection; encryption |
| Salary history is append-only | No UPDATE of historical amounts |

**Lifecycle:** catalog seeded with the seven §5.4 Vietnamese labels. Typical path Chờ nhận việc → Thử việc → Chính thức/Đang làm việc; may enter Tạm hoãn hợp đồng / Nghỉ thai sản / Nghỉ không lương; terminal operational state Nghỉ việc (`active=false`). Storage codes in 02 are keys, not a frozen enum. Create path: HR create or offer-accept auto-create. `work_email` is not required at insert.

**Commands:** `CreateEmployee`, `UpdatePersonalDetails`, `ChangeEmployment`, `ChangeManager`, `OffboardEmployee`, `LinkIdentityUser`  
**Queries:** `SearchEmployees`, `GetEmployeeDetail`, `GetEmploymentHistory`, `GetSalaryHistory` (FLS)  
**Events:** `employee.created`, `employee.manager_changed`, `employee.status_changed`, `employee.offboarded`, `employee.provisioning_requested`

`parent_id` in DTO = current `manager_employee_id`. Workflow resolver reads this value (or the snapshot taken at submit).

---

## DOMAIN 04 — Contract Management

**Aggregate:** `EmploymentContract` with Terms, Appendix, Renewal, Termination, Decision

| Invariant | Enforcement |
|---|---|
| Unique `contract_number` per tenant | Unique constraint |
| One active primary contract per employee/date | Exclusion constraint |
| Signed terms are not overwritten | New `contract_terms` / appendix version |
| Termination does not delete the employee | Calls Employee `OffboardEmployee` / status change via event. Terminate workflow path is unspecified — do not invent steps |

**Commands:** `CreateContract`, `AddAppendix`, `ProposeRenewal`, `TerminateContract`, `IssueDecision`  
**Queries:** `ListContracts`, `GetContractDetail`, `ListExpiringContracts`  
**Events:** `contract.activated`, `contract.expiring`, `contract.renewal_proposed`, `contract.terminated`

---

## DOMAIN 05 — Document Management

**Aggregate:** `Document` with Version, AccessPolicy, Verification

| Invariant | Enforcement |
|---|---|
| No public URL | Object key never in DTO |
| Version immutable after finalize | Status `final` + no UPDATE of bytes/checksum |
| Upload rejected if extension, claimed MIME, detected MIME, or virus scan fail | Application + storage policy. Numeric size cap is unspecified — do not invent one |
| Ordinary employee cannot download sensitive HR files | Document policy + RBAC `hrm.document.download` |

Document types required by source: labor contract, appendix, salary decision, appointment decision, offboarding file, plus education/work-permit attachments.

**Commands:** `StartUpload`, `FinalizeVersion`, `VerifyDocument`, `IssueDownload`  
**Queries:** `ListDocuments`, `GetDocument`, `GetEmployeeChecklist`  
**Events:** `document.uploaded`, `document.verified`, `document.rejected`, `document.expired`

Every View / Download / Edit / Upload writes `document_access_events` and a platform `AuditEvent`.

---

## DOMAIN 06 — Attendance

**Aggregates:** `AttendanceRecord` (evidence), `AttendanceClaim`, `LateEarlyRequest`, `OvertimeRequest`

| Invariant | Enforcement |
|---|---|
| Source check-in/out cannot be edited | Column/permission: no update of source fields |
| Correction = claim or late/early + workflow + `attendance_adjustments` | Apply only on `workflow.completed`; OT workflow ownership is unspecified |
| Unique record per employee/date/shift | Unique constraint |
| Device stores no biometric payload | Metadata only |

**Commands:** `IngestDeviceEvent`, `SubmitAttendanceClaim`, `SubmitLateEarlyRequest`, `SubmitOvertimeRequest`, `ApplyAttendanceAdjustment`  
**Queries:** `ListDailyAttendance`, `GetAttendanceSummary`  
**Events:** `attendance.ingested`, `attendance.claim_submitted`, `attendance.adjustment_applied`

---

## DOMAIN 07 — Leave Management

**Aggregates:** `LeaveType`/`LeavePolicy`, `LeaveBalance`, `LeaveRequest`

| Invariant | Enforcement |
|---|---|
| Request cannot overlap another approved/pending request for the same day | Date exclusion |
| Approved days cannot exceed available balance after policy | Domain check before HR complete |
| Reject does not debit balance | Ledger write only on apply |
| Maternity / unpaid leave may change Employee lifecycle | Employee consumes `leave.approved` when policy says so |

**Commands:** `SubmitLeaveRequest`, `CancelLeaveRequest`, `ApplyApprovedLeave`  
**Queries:** `ListLeaveRequests`, `GetLeaveBalances`  
**Events:** `leave.submitted`, `leave.approved`, `leave.rejected`, `leave.cancelled`

---

## DOMAIN 08 — Payroll

**Aggregates:** `SalaryStructure`, `PayrollPeriod` (root for a run), `Payslip`

Illustrative display formula from source (not coded rates; Vietnam engine is later):

```text
net = base_salary + allowance + bonus + overtime − social_insurance − tax − deduction
```

| Invariant | Enforcement |
|---|---|
| Inputs come from Employee/Contract/Attendance/Leave DTOs or `payroll_input_snapshots` | No Employee repository import |
| Locked period cannot recalculate or edit lines | Status guard + DB reject |
| Payslip is personal; PDF password-protected | Delivery + download policy |
| Correction after lock = decision + history + new controlled run | No unlock |

Period status: `draft` → `calculated` → `reviewed` → `locked` → `paid`.

**Commands:** `CreatePayrollPeriod`, `CaptureInputSnapshot`, `CalculatePayroll`, `ReviewPayroll`, `LockPayrollPeriod`, `GeneratePayslip`, `DeliverPayslip`  
**Queries:** `ListPayrollDetails`, `GetPayslip`  
**Events:** `payroll.calculated`, `payroll.locked`, `payslip.generated`, `payslip.delivered`

---

## DOMAIN 09 — Workflow Engine

**Aggregates:** `WorkflowDefinition`, `WorkflowInstance`, `WorkflowDelegation`

| Invariant | Enforcement |
|---|---|
| One current actionable step unless terminal | Step status machine |
| Only assigned actor or active delegate may act | Policy check |
| Reject is terminal | No skip |
| `direct_manager` resolver uses Employee `parent_id` | Employee query at submit, snapshot stored on the step |
| Workflow does not update HR tables | Domain callback on `workflow.completed` / `workflow.rejected` |

**Commands:** `StartWorkflow`, `ApproveStep`, `RejectStep`, `ReassignStep`, `CreateDelegation`  
**Queries:** `ListInbox`, `GetInstance`  
**Events:** `workflow.started`, `workflow.approved`, `workflow.rejected`, `workflow.completed`, `workflow.reassigned`

Callback payload (owner consumes idempotently):

```json
{
  "eventType": "workflow.completed",
  "workflowInstanceId": "uuid",
  "domainType": "leave_request",
  "businessEntityId": "uuid",
  "definitionVersion": 1,
  "completedAt": "2026-09-11T03:18:00Z",
  "requestId": "uuid"
}
```

---

## Domain interaction map

```text
Identity  ← provisioning request — Employee
Employee  → parent_id snapshot  → Workflow
Employee/Contract/Attendance/Leave DTOs → Payroll snapshot
Document  ← owner metadata from Employee/Contract/Payslip
Leave/AttendanceClaim/LateEarly/ContractRenewal → Workflow → owner apply
All domains → outbox → AuditEvent
```
