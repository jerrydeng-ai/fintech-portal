import type { User } from "@prisma/client";
import type { DbClient } from "@/platform/database/client";
import { isRole } from "@/platform/rbac/permissions";
import type { AuthenticatedUser } from "./types";

function toAuthenticatedUser(user: User): AuthenticatedUser {
  if (!isRole(user.role)) {
    throw new Error(`User ${user.id} has unknown role ${user.role}`);
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title };
}

export async function findUserById(db: DbClient, id: string): Promise<AuthenticatedUser | null> {
  const user = await db.user.findUnique({ where: { id } });
  return user ? toAuthenticatedUser(user) : null;
}

export async function listUsers(db: DbClient): Promise<AuthenticatedUser[]> {
  const users = await db.user.findMany({ orderBy: { name: "asc" } });
  return users.map(toAuthenticatedUser);
}
