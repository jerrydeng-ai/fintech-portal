import type { JsonObject } from "@/platform/database/json";
import type { Role } from "@/platform/rbac/permissions";

/** Upper snake case, conventionally DOMAIN_VERB: KYC_APPROVED, REFUND_APPROVED, FEATURE_FLAG_CHANGED... */
export type AuditAction = string;

export type AuditActor = { id: string; name: string; role: Role };

export type RecordAuditEventInput = {
  actor: AuditActor;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  previousState?: JsonObject | null;
  newState?: JsonObject | null;
  metadata?: JsonObject | null;
  timestamp?: Date;
};

/** Serialisable shape used by API responses and UI components. */
export type AuditEventDto = {
  eventId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  previousState: JsonObject | null;
  newState: JsonObject | null;
  metadata: JsonObject | null;
};

export type AuditLogFilters = {
  action?: string;
  resourceType?: string;
  userId?: string;
  limit?: number;
  offset?: number;
};

/** Actor recorded for events produced by automated systems rather than people. */
export const SYSTEM_ACTOR = { id: "system", name: "Screening Engine" } as const;

/** Platform-level actions emitted by shared services. */
export const PLATFORM_AUDIT_ACTIONS = {
  ACCESS_DENIED: "ACCESS_DENIED",
} as const;
