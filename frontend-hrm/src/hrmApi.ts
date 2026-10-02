import { authorizedApiRequest } from "./auth/oidc";
import {
  COMPANY,
  activateOfficialHrmData,
  type Employee,
  type OrganizationPosition,
  type OrganizationUnit,
} from "./data";

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type HrmEmployeeListItem = {
  id: string;
  employeeCode: string;
  legalName: string;
  workEmail?: string | null;
  departmentName?: string | null;
  jobTitle?: string | null;
  managerName?: string | null;
  employmentStatus?: string | null;
};

type HrmCompany = {
  id: string;
  code: string;
  name: string;
  status: string;
};

type HrmBranch = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  status: string;
};

type HrmDepartment = {
  id: string;
  code: string;
  name: string;
  companyId: string;
  branchId?: string | null;
  parentId?: string | null;
  status: string;
};

type HrmPosition = {
  id: string;
  departmentId?: string | null;
  reportsToId?: string | null;
  code: string;
  title: string;
  status: string;
};

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase();
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: value, lastName: "" };
  return { firstName: parts.at(-1) ?? value, lastName: parts.slice(0, -1).join(" ") };
}

function statusLabel(status?: string | null) {
  return ({
    pending: "Chờ nhận việc",
    probation: "Thử việc",
    active: "Đang làm việc",
    suspended: "Tạm hoãn HĐ",
    maternity: "Nghỉ thai sản",
    unpaid_leave: "Nghỉ không lương",
    resigned: "Nghỉ việc",
  } as const)[status ?? ""] ?? "Đang làm việc";
}

function officialEmployee(row: HrmEmployeeListItem): Employee {
  const name = row.legalName || row.workEmail || row.employeeCode;
  const split = splitName(name);
  return {
    id: row.id,
    code: row.employeeCode,
    firstName: split.firstName,
    lastName: split.lastName,
    legalName: name,
    initials: initials(name),
    gender: "",
    birthday: "",
    marital: "",
    idType: "CCCD",
    idNumber: "",
    idIssueDate: "",
    idIssuePlace: "",
    nationality: "",
    taxCode: "",
    socialInsuranceNo: "",
    socialInsuranceStatus: "",
    workEmail: row.workEmail ?? "",
    privateEmail: "",
    workPhone: "",
    mobile: "",
    permanentAddress: "",
    temporaryAddress: "",
    company: COMPANY,
    branch: "",
    department: row.departmentName || "Chưa phân phòng ban",
    position: row.jobTitle || "Chưa gán chức danh",
    managerCode: null,
    managerName: row.managerName || "—",
    coachName: row.managerName || "—",
    employmentType: "",
    status: statusLabel(row.employmentStatus),
    joiningDate: "",
    resignationDate: "",
    contractNo: "",
    contractType: "",
    contractStart: "",
    contractEnd: "",
    baseSalary: 0,
    insuranceSalary: 0,
    bankAccount: "",
    bankName: "",
    schedule: "",
    barcode: row.employeeCode,
    active: row.employmentStatus !== "resigned",
  };
}

function officialOrganizationUnits(companies: HrmCompany[], branches: HrmBranch[], departments: HrmDepartment[]) {
  const units: OrganizationUnit[] = [
    ...companies.map((company) => ({
      id: `company:${company.id}`,
      parentId: null,
      kind: "Pháp nhân" as const,
      code: company.code,
      name: company.name,
      manager: "—",
    })),
    ...branches.map((branch) => ({
      id: `branch:${branch.id}`,
      parentId: `company:${branch.companyId}`,
      kind: "Chi nhánh" as const,
      code: branch.code,
      name: branch.name,
      manager: "—",
    })),
    ...departments.map((department) => ({
      id: `department:${department.id}`,
      parentId: department.parentId
        ? `department:${department.parentId}`
        : department.branchId
          ? `branch:${department.branchId}`
          : `company:${department.companyId}`,
      kind: "Phòng ban" as const,
      code: department.code,
      name: department.name,
      manager: "—",
    })),
  ];
  return units;
}

function officialPositions(positions: HrmPosition[], employees: Employee[]) {
  return positions.map((position) => ({
    code: position.code,
    title: position.title,
    department: "",
    reportsTo: "—",
    headcount: employees.filter((employee) => employee.position === position.title).length,
  } satisfies OrganizationPosition));
}

export async function loadOfficialHrmData() {
  const employeeEnvelope = await authorizedApiRequest<ApiEnvelope<HrmEmployeeListItem[]>>("/api/v1/employees?pageSize=100", { method: "GET" });
  const [companyEnvelope, branchEnvelope, departmentEnvelope, positionEnvelope] = await Promise.all([
    authorizedApiRequest<ApiEnvelope<HrmCompany[]>>("/api/v1/organizations/companies?pageSize=100", { method: "GET" }).catch(() => ({ data: [] })),
    authorizedApiRequest<ApiEnvelope<HrmBranch[]>>("/api/v1/organizations/branches?pageSize=100", { method: "GET" }).catch(() => ({ data: [] })),
    authorizedApiRequest<ApiEnvelope<HrmDepartment[]>>("/api/v1/organizations/departments", { method: "GET" }).catch(() => ({ data: [] })),
    authorizedApiRequest<ApiEnvelope<HrmPosition[]>>("/api/v1/organizations/positions?pageSize=100", { method: "GET" }).catch(() => ({ data: [] })),
  ]);
  const officialEmployees = (employeeEnvelope.data ?? []).map(officialEmployee);
  activateOfficialHrmData({
    employees: officialEmployees,
    organizationUnits: officialOrganizationUnits(
      companyEnvelope.data ?? [],
      branchEnvelope.data ?? [],
      departmentEnvelope.data ?? [],
    ),
    organizationPositions: officialPositions(positionEnvelope.data ?? [], officialEmployees),
  });
  return {
    employees: officialEmployees,
    organizationUnits: companyEnvelope.data ?? [],
    departments: departmentEnvelope.data ?? [],
    positions: positionEnvelope.data ?? [],
  };
}
