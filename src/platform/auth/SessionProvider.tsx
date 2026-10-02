"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Permission } from "@/platform/rbac/permissions";
import type { AuthenticatedUser } from "./types";

type ClientSession = { user: AuthenticatedUser; permissions: Permission[] };

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({ session, children }: { session: ClientSession; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}

/** UI-only convenience. Real enforcement happens in services via requirePermission. */
export function useCan(permission: Permission): boolean {
  return useSession().permissions.includes(permission);
}
