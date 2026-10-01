# 05 — UI / API / Component Mapping

Prototype: `frontend-hrm` (Vite, port 5175). Production screens stay in `frontend-hrm`; shared pieces move to `packages/ui` when a second app consumes them. Components do not authorize.

Design tokens (source DS): primary `#2563EB`, bg `#F8FAFC`, sidebar 240px, header 56px, title 24 / body 14 / table 13, Inter. Desktop-first; icon sidebar ≤1023; ESS layout &lt;768.

## Screen map

| Screen (prototype `Page`) | Route intent | Primary APIs | Components | Roles |
|---|---|---|---|---|
| SSO Launcher (`launcher`) | Identity hub / `/` | existing `GET /api/session`, `GET /api/launcher` | `ApplicationCard`, `SessionMeta`, `StatusBadge` | Assigned users |
| CEO Dashboard (`ceo-dashboard`) | `/dashboard/ceo` | `GET /dashboards/executive` | `PageHeader`, `PeriodFilter`, `StatTile`, `TrendChart`, `ColumnChart`, `AlertList` | `hrm.dashboard.executive` |
| HR Dashboard (`hr-dashboard`) | `/dashboard/hr` | `GET /dashboards/hr` | `OperationCard`, `TaskList`, `AlertList`, `StatusBadge` | `hrm.dashboard.hr` |
| Employee List (`employees`) | `/employees` | `GET /employees`, `POST /employees/exports` | `DataTable`, `SearchField`, `FilterBar`, `Pagination`, `PermissionGate` | HR; Manager team; Employee self if allowed |
| Employee Profile (`profile`) | `/employees/:id/:tab` | employee detail, personal, employment, dependents, documents, attendance summary, payroll summary, history, audit | `ProfileHeader`, `Tabs`, `DataField`, `DataMask`, `Timeline`, `AuditTable` | Scope; Accountant denied full profile |
| Document Center (`documents`) | `/documents` | documents list/detail/upload/download/checklist | `DocumentTable`, `Upload`, `VerificationBadge`, `ExpiryAlert`, `Drawer` | Document policy |
| Attendance (`attendance`) | `/attendance` | records, summary, claims | `StatTile`, `DataTable`, `DateFilter`, `WorkflowLink` | self / team / HR |
| Late / Early (`late-early`) | `/attendance/late-early` | `POST /attendance/late-early-requests`, workflow instance | `Form`, `FileUpload`, `WorkflowStepper`, `ApprovalTimeline`, `Modal` | Employee submit; Manager/HR approve |
| Payroll (`payroll`) | `/payroll` | periods, details, lock, payslip download | `PayrollPeriodHeader`, `DataTable`, `PayslipDrawer`, `LockConfirmModal`, `DataMask` | Accountant / HR Manager / own payslip |
| Workflow (`workflow`) | `/workflow` | inbox, instance, approve/reject | `InboxTable`, `ApprovalTimeline`, `CommentBox`, `StatusBadge` | Actor / requester / HR |
| Permission (`permissions`) | `/system/permissions` | session capabilities; writes only via Identity Console | `RoleCard`, `PermissionMatrix`, `DataScopePanel`, `Toggle`, `SecurityNote` | Super Admin. Prototype toggles do not persist |

Profile tabs (fixed, source DS): Personal, Employment, Contract, Documents, Attendance, Payroll, Insurance, History, Audit Log.

Nav items without Phase 1 HF (Recruitment, Onboarding, KPI, Training, Assets, Reports, Org chart, Contracts list, Leave list) stay visible if permitted and open the operational empty state. They are not extra invented modules.

## Role → landing

| Role | Landing | Hidden nav |
|---|---|---|
| Super Admin | `/dashboard/ceo` | — |
| HR Manager / HR Staff / Manager | `/dashboard/hr` | Manager: no Payroll, no System |
| Employee | `/employees/{ownCode}/personal` | no Dashboard, no Payroll admin, no System |
| Accountant | `/payroll` | no Employee List; profile only via payroll projection |

## Component library

| Component | Screens | API | Permission behavior |
|---|---|---|---|
| `Button` | all actions | matching POST/PUT | disabled when `capabilities.*` false |
| `DataTable` | lists | paginated GET | columns from DTO; no client-side confidential dataset |
| `FilterBar` | lists | query params | cannot widen server scope |
| `SearchField` | list, header ⌘K | list/`q` | scoped results |
| `Pagination` | lists | `meta.page` | — |
| `Form` / `Field` | create/edit | POST/PUT | map `details[].field` |
| `Modal` | lock, confirm | transition POST | confirm ≠ grant |
| `Drawer` | payslip, document, quick view | detail GET | open after read allowed |
| `Upload` | documents, claim evidence | upload session + finalize | MIME, recorded size, scan; API revalidates. No numeric cap until specified |
| `DataMask` | profile, contract, payroll | projected DTO | Reveal = audited GET; Hidden is not a raw value |
| `PermissionGate` | toolbars | `capabilities` | UI only |
| `WorkflowStepper` | late-early, leave, renewal | instance DTO | no client-computed approver |
| `ApprovalTimeline` | workflow screens | actions DTO | controls when `canAct=true` |
| `StatusBadge` | all | status enum | not a security signal |
| `StatTile` | dashboards | aggregate DTO | omit tile if permission missing (salary cost) |
| `TrendChart` / `ColumnChart` | CEO | trend series | 1 series QTS Blue; tooltip; accessible `<details>` table |
| `EmptyState` | lists, phase-1 stubs | — | operational copy, no marketing illustration |
| `AuditTable` | profile audit | `GET .../audit-events` | `hrm.audit.read` |
| `SecurityNote` | permission, document, payroll | — | copy: UI hide ≠ security |

## Profile tab → API

| Tab | APIs | FLS |
|---|---|---|
| Personal | `GET /employees/{id}`, `GET .../personal-details`, emergency, dependents | personal / cccd / tax |
| Employment | `GET .../employment-records` | public + management |
| Contract | `GET /contracts?employeeId=` | salary FLS |
| Documents | `GET /documents?ownerId=` | document policy |
| Attendance | `GET /attendance/records?employeeId=` | self/team/HR |
| Payroll | `GET /payroll/details` or `/payslips/me` | salary FLS |
| Insurance | personal-details BHXH fields + payroll projection | tax FLS |
| History | `GET .../history` | salary history FLS |
| Audit | `GET .../audit-events` | `hrm.audit.read` |

## Waffle / Portal

Header waffle calls existing `GET /api/launcher` (same session). Portal remains `frontend-portal/portal` :5174. Do not embed HRM inside Portal. Do not invent `GET /api/v1/me`.

## Frontend tree (target)

```
frontend-hrm/src/
  features/{employee,contract,document,attendance,leave,payroll,workflow,organization,dashboard}
  screens/
  routes/
  policy/          # reads capabilities from DTO; never a second permission source
  auth/            # copy of Portal OIDC until a second consumer exists
```

Until a second consumer exists, DS may remain in `frontend-hrm/src/design-system/` (current prototype). Extract when Portal or Document app needs the same light tokens.
