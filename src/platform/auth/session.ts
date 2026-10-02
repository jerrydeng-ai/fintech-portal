import { UnauthenticatedError } from "@/lib/errors";
import { type Permission, permissionsForRole } from "@/platform/rbac/permissions";
import { demoAuthProvider } from "./demo-auth-provider";
import type { AuthProvider, AuthenticatedUser } from "./types";

export type Session = {
  user: AuthenticatedUser;
  permissions: Permission[];
  authProvider: string;
};

/** Composition point for authentication. Production would return an SSO-backed provider here. */
export function getAuthProvider(): AuthProvider {
  return demoAuthProvider;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  return getAuthProvider().getCurrentUser();
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export async function getSession(): Promise<Session | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, permissions: permissionsForRole(user.role), authProvider: getAuthProvider().id };
}
