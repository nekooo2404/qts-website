export type Role = "super-admin" | "hr-manager" | "hr-staff" | "manager" | "employee" | "accountant";

export const ROLE_LABEL: Record<Role, string> = {
  "super-admin": "Quản trị viên cấp cao",
  "hr-manager": "Quản lý nhân sự",
  "hr-staff": "Chuyên viên nhân sự",
  manager: "Quản lý",
  employee: "Nhân viên",
  accountant: "Kế toán",
};

export type Permission =
  | "hrm.dashboard.executive"
  | "hrm.dashboard.hr"
  | "hrm.employee.read"
  | "hrm.employee.export"
  | "hrm.employee.edit"
  | "hrm.employee.field.personal"
  | "hrm.employee.field.cccd"
  | "hrm.employee.field.salary"
  | "hrm.employee.field.bank"
  | "hrm.employee.field.tax"
  | "hrm.document.view"
  | "hrm.document.upload"
  | "hrm.document.download"
  | "hrm.document.edit"
  | "hrm.attendance.read"
  | "hrm.payroll.read"
  | "hrm.payroll.lock"
  | "hrm.payslip.read_own"
  | "hrm.workflow.approve"
  | "hrm.workflow.read"
  | "hrm.permission.manage"
  | "hrm.onboarding.read"
  | "hrm.kpi.read"
  | "hrm.training.read"
  | "hrm.asset.read"
  | "hrm.report.read"
  | "hrm.nav.recruitment"
  | "hrm.nav.system"
  | "organization.company.read"
  | "organization.branch.read"
  | "organization.department.read"
  | "organization.position.read"
  | "hrm.contract.read"
  | "hrm.leave.read"
  | "hrm.leave.read_own"
  | "hrm.leave.balance.read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  "super-admin": [
    "hrm.dashboard.executive", "hrm.dashboard.hr", "hrm.employee.read", "hrm.employee.export", "hrm.employee.edit",
    "hrm.employee.field.personal", "hrm.employee.field.cccd", "hrm.employee.field.salary", "hrm.employee.field.bank", "hrm.employee.field.tax",
    "hrm.document.view", "hrm.document.upload", "hrm.document.download", "hrm.document.edit",
    "hrm.attendance.read", "hrm.payroll.read", "hrm.payroll.lock", "hrm.payslip.read_own", "hrm.workflow.read", "hrm.workflow.approve", "hrm.permission.manage",
    "hrm.onboarding.read", "hrm.kpi.read", "hrm.training.read", "hrm.asset.read", "hrm.report.read",
    "hrm.nav.recruitment", "hrm.nav.system", "organization.company.read", "organization.branch.read", "organization.department.read", "organization.position.read", "hrm.contract.read", "hrm.leave.read", "hrm.leave.read_own", "hrm.leave.balance.read",
  ],
  "hr-manager": [
    "hrm.dashboard.hr", "hrm.employee.read", "hrm.employee.export", "hrm.employee.edit",
    "hrm.employee.field.personal", "hrm.employee.field.cccd", "hrm.employee.field.salary", "hrm.employee.field.bank", "hrm.employee.field.tax",
    "hrm.document.view", "hrm.document.upload", "hrm.document.download", "hrm.document.edit",
    "hrm.attendance.read", "hrm.payroll.read", "hrm.payroll.lock", "hrm.payslip.read_own", "hrm.workflow.read", "hrm.workflow.approve",
    "hrm.onboarding.read", "hrm.kpi.read", "hrm.training.read", "hrm.asset.read", "hrm.report.read",
    "hrm.nav.recruitment", "hrm.nav.system", "organization.company.read", "organization.branch.read", "organization.department.read", "organization.position.read", "hrm.contract.read", "hrm.leave.read", "hrm.leave.read_own", "hrm.leave.balance.read",
  ],
  "hr-staff": [
    "hrm.dashboard.hr", "hrm.employee.read", "hrm.employee.export", "hrm.employee.edit",
    "hrm.employee.field.personal", "hrm.employee.field.cccd",
    "hrm.document.view", "hrm.document.upload", "hrm.document.edit",
    "hrm.attendance.read", "hrm.workflow.read", "hrm.workflow.approve", "hrm.nav.recruitment",
    "hrm.onboarding.read", "hrm.kpi.read", "hrm.training.read", "hrm.asset.read", "hrm.report.read",
    "organization.company.read", "organization.branch.read", "organization.department.read", "organization.position.read", "hrm.contract.read", "hrm.leave.read", "hrm.leave.read_own", "hrm.leave.balance.read",
  ],
  manager: [
    "hrm.dashboard.hr", "hrm.employee.read", "hrm.document.view", "hrm.attendance.read", "hrm.workflow.read", "hrm.workflow.approve", "hrm.report.read", "organization.company.read", "organization.branch.read", "organization.department.read", "organization.position.read", "hrm.contract.read", "hrm.leave.read", "hrm.leave.balance.read",
  ],
  employee: ["hrm.employee.read", "hrm.employee.field.personal", "hrm.document.view", "hrm.attendance.read", "hrm.leave.read_own", "hrm.leave.balance.read", "hrm.payslip.read_own", "hrm.workflow.read"],
  accountant: [
    "hrm.employee.read", "hrm.employee.field.salary", "hrm.employee.field.bank", "hrm.employee.field.tax",
    "hrm.payroll.read", "hrm.payroll.lock", "hrm.payslip.read_own", "hrm.attendance.read", "hrm.contract.read", "hrm.report.read",
  ],
};

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function landingPath(role: Role, ownCode: string) {
  if (role === "super-admin") return "/dashboard/ceo";
  if (role === "accountant") return "/payroll";
  if (role === "employee") return `/employees/${ownCode}/personal`;
  return "/dashboard/hr";
}

export type DataScope = "company" | "branch" | "department" | "manager" | "self";

export function scopeFor(role: Role): DataScope {
  if (role === "employee") return "self";
  if (role === "manager") return "manager";
  return "company";
}
