import type { AuthenticatedUser } from "@/platform/auth/types";
import { prisma } from "@/platform/database/client";
import { requirePermission } from "@/platform/rbac/guard";
import { findAuditEvents, findAuditEventsForResource, findDistinctAuditValues } from "./audit-repository";
import type { AuditEventDto, AuditLogFilters } from "./types";

export async function listAuditLog(
  actor: AuthenticatedUser,
  filters: AuditLogFilters = {},
): Promise<{ events: AuditEventDto[]; total: number }> {
  await requirePermission(actor, "audit:view");
  return findAuditEvents(prisma, filters);
}

export async function getAuditFilterOptions(actor: AuthenticatedUser) {
  await requirePermission(actor, "audit:view");
  return findDistinctAuditValues(prisma);
}

export async function listResourceHistory(
  actor: AuthenticatedUser,
  resourceType: string,
  resourceId: string,
): Promise<AuditEventDto[]> {
  await requirePermission(actor, "audit:view");
  return findAuditEventsForResource(prisma, resourceType, resourceId);
}
