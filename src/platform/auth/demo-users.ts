import type { AuthenticatedUser } from "./types";

export const DEMO_USERS: readonly AuthenticatedUser[] = [
  { id: "usr_alice", name: "Alice", email: "alice@fintech.example", role: "COMPLIANCE_ANALYST", title: "Compliance Analyst" },
  { id: "usr_bob", name: "Bob", email: "bob@fintech.example", role: "SUPPORT_AGENT", title: "Support Agent" },
  { id: "usr_carol", name: "Carol", email: "carol@fintech.example", role: "ADMIN", title: "Admin" },
];

export const DEFAULT_DEMO_USER_ID = "usr_alice";
export const DEMO_USER_COOKIE = "demo_user_id";

/** Password-less demo auth is on in development; production requires DEMO_AUTH="true". */
export function demoAuthEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_AUTH === "true";
}
