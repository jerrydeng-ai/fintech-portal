"use client";

import type { ReactNode } from "react";
import { useCan } from "@/platform/auth/SessionProvider";
import type { Permission } from "./permissions";

/**
 * Hides UI the current user cannot use. This is a UX affordance, not a security control:
 * every mutation is re-checked server-side by requirePermission().
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
