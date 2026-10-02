import { cookies } from "next/headers";
import { prisma } from "@/platform/database/client";
import { DEFAULT_DEMO_USER_ID, DEMO_USER_COOKIE, demoAuthEnabled } from "./demo-users";
import type { AuthProvider, AuthenticatedUser } from "./types";
import { findUserById } from "./user-repository";

/**
 * DEMO ONLY: identifies the user from an unsigned cookie set by the "Switch user" control.
 * There is no password and the cookie is trivially forgeable — never use outside a demo.
 */
export const demoAuthProvider: AuthProvider = {
  id: "demo",
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    if (!demoAuthEnabled()) return null;
    const cookieStore = await cookies();
    const userId = cookieStore.get(DEMO_USER_COOKIE)?.value ?? DEFAULT_DEMO_USER_ID;
    return findUserById(prisma, userId);
  },
};
