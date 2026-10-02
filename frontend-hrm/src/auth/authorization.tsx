import { createContext, useContext, useMemo, type ReactNode } from "react";

import { can as roleCan, scopeFor, type DataScope, type Permission, type Role } from "../permissions";

const EffectivePermissionsContext = createContext<ReadonlySet<string> | null>(null);
const DataScopeContext = createContext<DataScope | null>(null);

export function AuthorizationProvider({ permissions, dataScope, children }: { permissions: string[] | null; dataScope: DataScope | null; children: ReactNode }) {
  const effective = useMemo(() => permissions === null ? null : new Set(permissions), [permissions]);
  return <EffectivePermissionsContext.Provider value={effective}><DataScopeContext.Provider value={dataScope}>{children}</DataScopeContext.Provider></EffectivePermissionsContext.Provider>;
}

export function useDataScope(role: Role) {
  return useContext(DataScopeContext) ?? scopeFor(role);
}

export function usePermissionCheck(role: Role) {
  const effective = useContext(EffectivePermissionsContext);
  return (permission: Permission) => effective === null ? roleCan(role, permission) : effective.has(permission);
}
