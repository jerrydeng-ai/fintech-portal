import type { AuditEvent } from "@prisma/client";
import type { DbClient } from "@/platform/database/client";
import { fromJsonColumn, toJsonColumn } from "@/platform/database/json";
import type { AuditEventDto, AuditLogFilters, RecordAuditEventInput } from "./types";

function toDto(event: AuditEvent): AuditEventDto {
  return {
    eventId: event.id,
    timestamp: event.timestamp.toISOString(),
    userId: event.userId,
    userName: event.userName,
    userRole: event.userRole,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    previousState: fromJsonColumn(event.previousState),
    newState: fromJsonColumn(event.newState),
    metadata: fromJsonColumn(event.metadata),
  };
}

/** Insert-only by design: there is intentionally no update or delete function. */
export async function insertAuditEvent(db: DbClient, input: RecordAuditEventInput): Promise<AuditEventDto> {
  const event = await db.auditEvent.create({
    data: {
      timestamp: input.timestamp,
      userId: input.actor.id,
      userName: input.actor.name,
      userRole: input.actor.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      previousState: toJsonColumn(input.previousState),
      newState: toJsonColumn(input.newState),
      metadata: toJsonColumn(input.metadata),
    },
  });
  return toDto(event);
}

export async function findAuditEventsForResource(
  db: DbClient,
  resourceType: string,
  resourceId: string,
): Promise<AuditEventDto[]> {
  const events = await db.auditEvent.findMany({
    where: { resourceType, resourceId },
    orderBy: { timestamp: "desc" },
  });
  return events.map(toDto);
}

const whereFor = (filters: AuditLogFilters) => ({
  action: filters.action || undefined,
  resourceType: filters.resourceType || undefined,
  userId: filters.userId || undefined,
});

export async function findAuditEvents(
  db: DbClient,
  filters: AuditLogFilters,
): Promise<{ events: AuditEventDto[]; total: number }> {
  const where = whereFor(filters);
  const [events, total] = await Promise.all([
    db.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: filters.limit ?? 200,
      skip: filters.offset ?? 0,
    }),
    db.auditEvent.count({ where }),
  ]);
  return { events: events.map(toDto), total };
}

export async function findDistinctAuditValues(db: DbClient): Promise<{ actions: string[]; resourceTypes: string[] }> {
  const [actions, resourceTypes] = await Promise.all([
    db.auditEvent.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    db.auditEvent.findMany({ distinct: ["resourceType"], select: { resourceType: true }, orderBy: { resourceType: "asc" } }),
  ]);
  return { actions: actions.map((a) => a.action), resourceTypes: resourceTypes.map((r) => r.resourceType) };
}
