import type { Role } from "@/platform/rbac/permissions";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
};

/**
 * The only contract the rest of the platform depends on.
 * Swap the demo implementation for Okta / Auth0 / Entra ID by implementing this interface
 * (e.g. validate an OIDC session and map group claims to a Role).
 */
export interface AuthProvider {
  readonly id: string;
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
