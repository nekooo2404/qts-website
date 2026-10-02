import { scopeFor, type DataScope, type Role } from "../permissions";
import { verifiedAuthenticationAssurance, type UserInfo } from "./oidc";

const ROLE_ORDER: Role[] = ["super-admin", "hr-manager", "hr-staff", "accountant", "manager", "employee"];

export type HrmSession = {
  userId: string;
  displayName: string;
  email: string;
  tenantId: string;
  tenantName: string;
  employeeId: string | null;
  employeeCode: string | null;
  roles: string[];
  permissions: string[];
  dataScope: DataScope | null;
  mfa: boolean | null;
};

export function pickHrmRole(roles: string[]): Role | null {
  return ROLE_ORDER.find((role) => roles.includes(role)) ?? null;
}

export function sessionFromUserInfo(profile: UserInfo, idToken = ""): HrmSession {
  void idToken;
  const role = pickHrmRole(profile.roles);
  return {
    userId: profile.sub,
    displayName: profile.name || profile.email,
    email: profile.email,
    tenantId: profile.tid,
    tenantName: profile.tenant,
    employeeId: profile.employee_id ?? null,
    employeeCode: profile.employee_code ?? null,
    roles: profile.roles,
    permissions: profile.permissions,
    dataScope: profile.data_scope ?? (role ? scopeFor(role) : null),
    mfa: verifiedAuthenticationAssurance(),
  };
}
