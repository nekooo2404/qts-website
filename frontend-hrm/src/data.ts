export const COMPANY = "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ QTS";

export type EmploymentStatus =
  | "Chờ nhận việc"
  | "Thử việc"
  | "Đang làm việc"
  | "Tạm hoãn HĐ"
  | "Nghỉ thai sản"
  | "Nghỉ không lương"
  | "Nghỉ việc";

export type DocType = "HĐLĐ" | "Phụ lục HĐ" | "QĐ lương" | "QĐ bổ nhiệm" | "Hồ sơ nghỉ việc" | "Bằng cấp" | "Work permit";
export type VerifyStatus = "Đã tải lên" | "Chờ xác minh" | "Đã xác minh" | "Từ chối";

export type Employee = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  legalName: string;
  initials: string;
  gender: "Nam" | "Nữ" | "";
  birthday: string;
  marital: string;
  idType: "CCCD";
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  nationality: string;
  taxCode: string;
  socialInsuranceNo: string;
  socialInsuranceStatus: string;
  workEmail: string;
  privateEmail: string;
  workPhone: string;
  mobile: string;
  permanentAddress: string;
  temporaryAddress: string;
  company: string;
  branch: string;
  department: string;
  position: string;
  managerCode: string | null;
  managerName: string;
  coachName: string;
  employmentType: string;
  status: EmploymentStatus;
  joiningDate: string;
  resignationDate: string;
  contractNo: string;
  contractType: string;
  contractStart: string;
  contractEnd: string;
  baseSalary: number;
  insuranceSalary: number;
  bankAccount: string;
  bankName: string;
  schedule: string;
  barcode: string;
  active: boolean;
};

export type EmergencyContact = { name: string; relationship: string; phone: string; primary: boolean };
export type Dependent = { name: string; relationship: string; dob: string; idNumber: string; deductible: boolean };
export type DocumentRow = {
  id: string;
  employeeCode: string;
  type: DocType;
  fileName: string;
  mime: "PDF" | "Word";
  version: string;
  required: boolean;
  issueDate: string;
  expiry: string;
  verify: VerifyStatus;
  encrypted: boolean;
};
export type AttendanceRow = {
  employeeCode: string;
  date: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  lateMin: number;
  earlyMin: number;
  otMin: number;
  missing: boolean;
};
export type HistoryRow = { date: string; action: string; from: string; to: string; decision: string };
export type AuditRow = { at: string; actor: string; action: string; field: string; ip: string };
export type WorkflowStep = { role: string; name: string; at: string; status: "Done" | "Current" | "Waiting" | "Rejected"; note: string };
export type WorkflowItem = {
  id: string;
  type: "Nghỉ phép" | "Đi muộn / về sớm" | "Điều chỉnh công";
  employeeCode: string;
  employeeName: string;
  submittedAt: string;
  current: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  payload: string;
  steps: WorkflowStep[];
};
export type PayslipLine = { label: string; amount: number; kind: "earn" | "deduct" | "net" };

export const SESSION_USER = {
  code: "",
  name: "",
  email: "",
  title: "",
};

export const employees: Employee[] = [];

export function replaceEmployees(next: Employee[]) {
  employees.splice(0, employees.length, ...next);
}

export const emergencies: Record<string, EmergencyContact[]> = {};

export const dependents: Record<string, Dependent[]> = {};

export const documents: DocumentRow[] = [];

export const attendanceToday: AttendanceRow[] = [];

export const attendanceMonth: AttendanceRow[] = [];

export const employmentHistory: Record<string, HistoryRow[]> = {};

export const salaryHistory: Record<string, HistoryRow[]> = {};

export const auditLog: Record<string, AuditRow[]> = {};

export const workflows: WorkflowItem[] = [];

export const payslipLines: PayslipLine[] = [];

export const MONTHS: string[] = [];
export const HEADCOUNT: number[] = [];
export const TURNOVER: number[] = [];
export const SALARY_COST: number[] = [];
export const ATTENDANCE_TREND: number[] = [];

export type OrganizationUnit = {
  id: string;
  parentId: string | null;
  kind: "Pháp nhân" | "Chi nhánh" | "Phòng ban";
  code: string;
  name: string;
  manager: string;
};

export type OrganizationPosition = {
  code: string;
  title: string;
  department: string;
  reportsTo: string;
  headcount: number;
};

export const organizationUnits: OrganizationUnit[] = [];

export const organizationPositions: OrganizationPosition[] = [];

export function activateOfficialHrmData(data: {
  employees: Employee[];
  organizationUnits: OrganizationUnit[];
  organizationPositions: OrganizationPosition[];
}) {
  replaceEmployees(data.employees);
  organizationUnits.splice(0, organizationUnits.length, ...data.organizationUnits);
  organizationPositions.splice(0, organizationPositions.length, ...data.organizationPositions);
  documents.splice(0, documents.length);
  attendanceToday.splice(0, attendanceToday.length);
  attendanceMonth.splice(0, attendanceMonth.length);
  workflows.splice(0, workflows.length);
  payslipLines.splice(0, payslipLines.length);
  leaveBalances.splice(0, leaveBalances.length);
  for (const target of [emergencies, dependents, employmentHistory, salaryHistory, auditLog]) {
    for (const key of Object.keys(target)) delete target[key];
  }
}

export type LeaveType = { id: string; name: string; description: string; paid: boolean };
export type LeaveBalance = { employeeCode: string; leaveTypeId: string; entitled: number; used: number; pending: number };

export const leaveTypes: LeaveType[] = [
  { id: "annual", name: "Nghỉ phép năm", description: "Theo chính sách phép năm hiện hành", paid: true },
  { id: "sick", name: "Nghỉ bệnh", description: "Theo chính sách và hồ sơ hợp lệ", paid: false },
  { id: "unpaid", name: "Nghỉ không lương", description: "Không trừ số dư phép năm", paid: false },
  { id: "maternity", name: "Nghỉ thai sản", description: "Có thể cập nhật trạng thái vòng đời theo chính sách", paid: false },
];

export const leaveBalances: LeaveBalance[] = [];

function prototypeEmployee(
  code: string,
  legalName: string,
  department: string,
  position: string,
  managerCode: string | null,
  baseSalary = 0,
): Employee {
  const parts = legalName.split(/\s+/).filter(Boolean);
  const lastName = parts.at(-1) ?? legalName;
  return {
    id: code,
    code,
    firstName: parts.slice(0, -1).join(" ") || legalName,
    lastName,
    legalName,
    initials: parts.slice(-2).map((part) => part[0]).join("").toUpperCase(),
    gender: "",
    birthday: "1990-01-01",
    marital: "Chưa cập nhật",
    idType: "CCCD",
    idNumber: "",
    idIssueDate: "",
    idIssuePlace: "",
    nationality: "Việt Nam",
    taxCode: "",
    socialInsuranceNo: "",
    socialInsuranceStatus: "Chưa đồng bộ",
    workEmail: `${code.toLowerCase()}@qts.com`,
    privateEmail: "",
    workPhone: "",
    mobile: "",
    permanentAddress: "",
    temporaryAddress: "",
    company: COMPANY,
    branch: "Trụ sở chính",
    department,
    position,
    managerCode,
    managerName: managerCode ? "Quản lý trực tiếp" : "",
    coachName: "",
    employmentType: "Toàn thời gian",
    status: "Đang làm việc",
    joiningDate: "2026-01-01",
    resignationDate: "",
    contractNo: "",
    contractType: "Không xác định",
    contractStart: "",
    contractEnd: "",
    baseSalary,
    insuranceSalary: baseSalary,
    bankAccount: "",
    bankName: "",
    schedule: "Ca hành chính",
    barcode: code,
    active: true,
  };
}

export function seedPrototypeHrmData() {
  if (employees.length > 0) return;

  employees.push(
    prototypeEmployee("QTS-00001", "Super Admin", "Ban điều hành", "Super Admin", null, 80_000_000),
    prototypeEmployee("QTS-00012", "Nguyễn Hà Linh", "Nhân sự", "Quản lý nhân sự", "QTS-00001", 45_000_000),
    prototypeEmployee("QTS-00042", "Phạm Minh Khuê", "Nhân sự", "Chuyên viên nhân sự", "QTS-00012", 24_000_000),
    prototypeEmployee("QTS-00015", "Trần Đức Nam", "Vận hành", "Quản lý vận hành", "QTS-00001", 38_000_000),
    prototypeEmployee("QTS-00028", "Lê Minh Anh", "Vận hành", "Nhân viên vận hành", "QTS-00015", 18_000_000),
    prototypeEmployee("QTS-00031", "Vũ Thu Trang", "Tài chính", "Kế toán", "QTS-00001", 27_000_000),
  );

  attendanceToday.push(
    { employeeCode: "QTS-00012", date: "2026-09-29", shift: "08:30-17:30", checkIn: "08:22", checkOut: "", lateMin: 0, earlyMin: 0, otMin: 0, missing: false },
    { employeeCode: "QTS-00028", date: "2026-09-29", shift: "08:30-17:30", checkIn: "08:47", checkOut: "", lateMin: 17, earlyMin: 0, otMin: 0, missing: false },
  );

  workflows.push({
    id: "WF-2609-001",
    type: "Điều chỉnh công",
    employeeCode: "QTS-00028",
    employeeName: "Lê Minh Anh",
    submittedAt: "29/09/2026 08:15",
    current: "HR xác nhận",
    status: "Pending",
    payload: "Điều chỉnh công ngày 28/09 do thiếu lượt quẹt thẻ.",
    steps: [
      { role: "Nhân viên", name: "Lê Minh Anh", at: "29/09/2026 08:15", status: "Done", note: "Gửi yêu cầu." },
      { role: "Manager", name: "Trần Đức Nam", at: "29/09/2026 09:10", status: "Done", note: "Đã rà soát." },
      { role: "HR", name: "Nguyễn Hà Linh", at: "", status: "Current", note: "Chờ HR xác nhận." },
      { role: "Completed", name: "Hệ thống chấm công", at: "", status: "Waiting", note: "" },
    ],
  });
  workflows.push({
    id: "WF-2609-002",
    type: "Nghỉ phép",
    employeeCode: "QTS-00028",
    employeeName: "Lê Minh Anh",
    submittedAt: "29/09/2026 10:05",
    current: "Manager",
    status: "Pending",
    payload: "Nghỉ phép năm từ 03/10/2026 đến 04/10/2026.",
    steps: [
      { role: "Nhân viên", name: "Lê Minh Anh", at: "29/09/2026 10:05", status: "Done", note: "Gửi đơn nghỉ phép." },
      { role: "Manager", name: "Trần Đức Nam", at: "", status: "Current", note: "Chờ quản lý trực tiếp phê duyệt." },
      { role: "HR", name: "Nguyễn Hà Linh", at: "", status: "Waiting", note: "Chờ kiểm tra số dư phép sau bước quản lý." },
      { role: "Completed", name: "Sổ cái phép", at: "", status: "Waiting", note: "" },
    ],
  });

  leaveBalances.push(
    { employeeCode: "QTS-00012", leaveTypeId: "annual", entitled: 12, used: 3, pending: 1 },
    { employeeCode: "QTS-00028", leaveTypeId: "annual", entitled: 12, used: 2, pending: 0 },
  );

  organizationUnits.push(
    { id: "company:qts", parentId: null, kind: "Pháp nhân", code: "QTS", name: COMPANY, manager: "Super Admin" },
    { id: "department:hr", parentId: "company:qts", kind: "Phòng ban", code: "HR", name: "Nhân sự", manager: "Nguyễn Hà Linh" },
  );
  organizationPositions.push(
    { code: "HRM", title: "Quản lý nhân sự", department: "Nhân sự", reportsTo: "Super Admin", headcount: 1 },
    { code: "OPS", title: "Nhân viên vận hành", department: "Vận hành", reportsTo: "Trần Đức Nam", headcount: 1 },
  );

  MONTHS.push("T4", "T5", "T6", "T7", "T8", "T9");
  HEADCOUNT.push(4, 4, 5, 5, 6, 6);
  TURNOVER.push(0, 0, 0, 0, 0, 0);
  SALARY_COST.push(1.7, 1.7, 2.0, 2.0, 2.32, 2.32);
  ATTENDANCE_TREND.push(96, 97, 95, 98, 97, 96);
}

export function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export function maskId(value: string) {
  if (value.length < 4) return "••••";
  return "********" + value.slice(-4);
}

export function employeeByCode(code: string) {
  return employees.find((row) => row.code === code);
}

export function visibleEmployees(scope: "company" | "branch" | "department" | "manager" | "self", actorCode: string) {
  const actor = employeeByCode(actorCode);
  if (!actor) return [];
  if (scope === "self") return employees.filter((row) => row.code === actorCode);
  if (scope === "manager") return employees.filter((row) => row.managerCode === actorCode || row.code === actorCode);
  if (scope === "department") return employees.filter((row) => row.department === actor.department);
  return employees;
}
