/**
 * Central permission catalogue for the internal-tools platform.
 * Permissions follow `<resource>:<verb>`. New tools add their permissions here
 * and grant them to roles below; everything else (guards, PermissionGate, nav) picks them up.
 */
export const PERMISSIONS = [
  "customer:view",
  "kyc:view",
  "kyc:approve",
  "kyc:reject",
  "kyc:escalate",
  "audit:view",
  "admin:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["COMPLIANCE_ANALYST", "SUPPORT_AGENT", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  COMPLIANCE_ANALYST: "Compliance Analyst",
  SUPPORT_AGENT: "Support Agent",
  ADMIN: "Admin",
};

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPPORT_AGENT: ["customer:view", "kyc:view"],
  COMPLIANCE_ANALYST: ["customer:view", "kyc:view", "kyc:approve", "kyc:reject", "kyc:escalate", "audit:view"],
  ADMIN: PERMISSIONS,
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(subject: { role: Role }, permission: Permission): boolean {
  return ROLE_PERMISSIONS[subject.role].includes(permission);
}
