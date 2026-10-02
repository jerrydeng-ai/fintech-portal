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
  "kyc:approve_rejection",
  "refund:view",
  "refund:approve",
  "audit:view",
  "admin:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["COMPLIANCE_ANALYST", "SUPPORT_AGENT", "COMPLIANCE_MANAGER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  COMPLIANCE_ANALYST: "Compliance Analyst",
  SUPPORT_AGENT: "Support Agent",
  COMPLIANCE_MANAGER: "Compliance Manager",
  ADMIN: "Admin",
};

const ANALYST_PERMISSIONS: readonly Permission[] = [
  "customer:view",
  "kyc:view",
  "kyc:approve",
  "kyc:reject",
  "kyc:escalate",
  "refund:view",
  "refund:approve",
  "audit:view",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPPORT_AGENT: ["customer:view", "kyc:view", "refund:view"],
  COMPLIANCE_ANALYST: ANALYST_PERMISSIONS,
  COMPLIANCE_MANAGER: [...ANALYST_PERMISSIONS, "kyc:approve_rejection"],
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
