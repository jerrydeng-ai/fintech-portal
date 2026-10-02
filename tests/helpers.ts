import { DEMO_USERS } from "@/platform/auth/demo-users";
import type { AuthenticatedUser } from "@/platform/auth/types";

export function demoUser(name: "Alice" | "Bob" | "Carol"): AuthenticatedUser {
  const user = DEMO_USERS.find((u) => u.name === name);
  if (!user) throw new Error(`No demo user ${name}`);
  return user;
}

export const alice = demoUser("Alice");
export const bob = demoUser("Bob");
export const carol = demoUser("Carol");
