# 06 — Permission Matrix

Identity stores permission codes. HRM enforces them on every API, export, PDF and worker. UI `PermissionGate` is convenience only.

## Roles

| Role code | Default data scope | Landing (prototype) |
|---|---|---|
| `super-admin` | company / tenant | CEO Dashboard |
| `hr-manager` | company | HR Dashboard |
| `hr-staff` | assigned department / branch | HR Dashboard |
| `manager` | employees whose current `parent_id` = self | HR Dashboard (team) |
| `employee` | self | Own profile |
| `accountant` | payroll legal-entity scope | Payroll |

Legend: **A** all in scope · **T** team (`parent_id`) · **S** self · **R** read · **P** payroll projection only · **—** denied · **F** also needs the field permission.

A field permission never replaces a record permission. Both must pass.

## Permission codes

Pattern matches Identity validator: `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`

| Code | Meaning |
|---|---|
| `hrm.dashboard.executive` | CEO dashboard + labor cost |
| `hrm.dashboard.hr` | HR operational dashboard |
| `hrm.employee.read` | Employee list/detail in scope |
| `hrm.employee.create` | Create personnel record |
| `hrm.employee.edit` | Edit non-protected profile fields |
| `hrm.employee.export` | Export with same FLS as list |
| `hrm.employee.offboard` | Start offboarding (no delete) |
| `hrm.employee.employment.manage` | New employment record / manager change |
| `hrm.employee.field.personal` | DOB, private contact, address, emergency |
| `hrm.employee.field.cccd` | Identity document number |
| `hrm.employee.field.salary` | Salary / allowance / insurance salary |
| `hrm.employee.field.bank` | Bank account |
| `hrm.employee.field.tax` | MST, dependents, BHXH number |
| `hrm.contract.read` / `create` / `edit` / `renew` / `terminate` | Contract lifecycle |
| `hrm.document.view` / `upload` / `edit` / `download` / `verify` | Document actions |
| `hrm.attendance.read` | Attendance dashboard |
| `hrm.attendance.claim.create` | Submit claim |
| `hrm.attendance.late_early.create` | Submit late/early |
| `hrm.attendance.overtime.create` | Submit OT |
| `hrm.attendance.import` | Device/import batch |
| `hrm.leave.read` / `read_own` / `balance.read` | Leave visibility |
| `hrm.leave.request.create` / `cancel` | Leave request |
| `hrm.payroll.read` / `calculate` / `review` / `lock` / `period.manage` | Payroll |
| `hrm.payslip.read_own` / `download` | Payslip |
| `hrm.workflow.read` / `approve` / `reject` / `reassign` / `delegate` | Workflow |
| `hrm.workflow.definition.read` / `manage` | Workflow definition |
| `hrm.audit.read` | Target audit trail |
| `hrm.permission.manage` | HRM-side matrix view; writes go to Identity |
| `identity.manage_permissions` | Identity role/permission write |
| `organization.company.read` / `organization.branch.read` / `department.read` / `department.manage` / `position.read` / `position.manage` | Org |

## Module matrix

| Module / action | Super Admin | HR Manager | HR Staff | Manager | Employee | Accountant |
|---|---|---|---|---|---|---|
| Identity roles: View | A | R | — | — | — | — |
| Identity roles: Manage | A | — | — | — | — | — |
| Organization: View | A | A | Assigned | T directory | R directory | Assigned legal entity |
| Organization: Create/Edit | A | A | If granted | — | — | — |
| Employee: View | A+F | A+F | Assigned+F | T public/management | S allowed fields | P only |
| Employee: Create | A | A | Assigned | — | — | — |
| Employee: Edit | A | A | Assigned | Team management if granted | Own via request workflow | — |
| Employee: Export | A+F | A+F | Assigned+F if granted | — | — | Payroll export only |
| Employee: Delete | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden |
| Contract: View | A+F | A+F | Assigned, salary needs F | T non-confidential | Own eligible | Payroll terms P |
| Contract: Create/Edit | A | A | Assigned | — | — | — |
| Contract renew/terminate: Start | A | A | Assigned | Approve only | — | — |
| Document: View | Policy+A | Policy+A | Policy+assigned | Policy+T | Policy+S | Policy+payroll docs |
| Document: Upload/Edit | A | A | Assigned | — | Own if policy | Payroll docs |
| Document: Download | Policy+A | Policy+A | Explicit grant | Explicit policy | Explicit policy | Payslip/payroll policy |
| Attendance: View | A | A | Assigned | T | S | Input projection |
| Claim / late-early / OT: Create | A | Proxy | Assigned proxy | T proxy if policy | S | — |
| Attendance source edit | — | — | — | — | — | — |
| Leave balance: View | A | A | Assigned | T | S | — |
| Leave request: Create/Cancel | A | Proxy | Assigned proxy | T proxy if policy | S | — |
| Payroll period/detail: View | A+F | A+F | Only if payroll grant | — | S payslip | A+F |
| Payroll calculate/review/lock | A | If granted | — | — | — | A |
| Payslip download | A+F | A+F | Explicit | — | S | A+F |
| Workflow inbox | A | A | Assigned | Current actor / T | S requests | Configured payroll steps |
| Workflow approve/reject | A | HR step | HR step | Manager step | — | Payroll step if configured |
| Audit events | A | HR scoped | Assigned limited | — | Own request status | Payroll targets |

## Field-level security

| Field group | Examples | Super Admin | HR Manager | HR Staff | Manager | Employee | Accountant |
|---|---|---|---|---|---|---|---|
| Internal public | legal name, avatar, department, title, work email, work phone, parent | A | A | Assigned | T | S + directory policy | P identifiers |
| Management | contract type, joining date, education, certificates | A | A | Assigned | T | S | — |
| Personal confidential | birthday, private email, mobile, addresses, emergency | F | F | F | — | Own contact (no CCCD) | — |
| CCCD / passport | `id_number` | F | F | F if granted | — | Masked last-4 only if policy | — |
| Salary | base, allowance, insurance salary, gross, net | F | F | — default | — | Own payslip | F |
| Bank | account number, bank name | F | F | — default | — | Own if policy | F |
| Tax / BHXH / dependents | MST, BHXH no, dependents | F | F | — default | — | Own if policy | F |

Unauthorized API result: mask CCCD `********1234` only when a masked view is allowed; otherwise omit salary/bank. Never send the raw value for the UI to hide.

CCCD mask when a masked view is allowed: `********` + last 4. Salary and bank render as Hidden; no digits in DOM.

## Data scope algorithm

```text
scope = company | branch | department | manager | self

company     → tenant/company predicate
branch      → employment.branch_id IN assigned_branches
department  → employment.department_id IN assigned_departments
manager     → employment.manager_employee_id = actor.employee_id
self        → employee.id = actor.employee_id
```

List count, search, export, dashboard aggregates and document owner checks all apply this predicate before serialization.

`assigned_branches` / `assigned_departments` have no owner table today. Identity `memberships.department` is a free-text title, not an Organization id. Do not invent a store. `company` / `manager` / `self` do not need it.

## Prototype alignment (`frontend-hrm/src/permissions.ts`)

The UI prototype is a subset used for HF review. Backend implements the full matrix above. Prototype currently grants HR Staff `field.personal` + `field.cccd` but not salary/bank/tax; Manager has no confidential fields; Employee has personal (own) + payroll read (own); Accountant has salary/bank/tax + payroll lock, no full HR profile.
