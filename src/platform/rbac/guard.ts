import { ForbiddenError } from "@/lib/errors";
import { recordAuditEvent } from "@/platform/audit/audit-recorder";
import { PLATFORM_AUDIT_ACTIONS } from "@/platform/audit/types";
import type { AuthenticatedUser } from "@/platform/auth/types";
import { prisma } from "@/platform/database/client";
import { type Permission, hasPermission } from "./permissions";

export type DeniedAttemptContext = {
  resourceType: string;
  resourceId: string;
  attemptedAction: string;
};

/**
 * Server-side authorization check used by every service method.
 * When `deniedAttempt` is supplied (privileged mutations), the denial itself is written to the audit trail.
 */
export async function requirePermission(
  actor: AuthenticatedUser,
  permission: Permission,
  deniedAttempt?: DeniedAttemptContext,
): Promise<void> {
  if (hasPermission(actor, permission)) return;

  if (deniedAttempt) {
    await recordAuditEvent(prisma, {
      actor,
      action: PLATFORM_AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: deniedAttempt.resourceType,
      resourceId: deniedAttempt.resourceId,
      metadata: { requiredPermission: permission, attemptedAction: deniedAttempt.attemptedAction },
    });
  }
  throw new ForbiddenError(`${actor.name} (${actor.role}) lacks permission "${permission}"`);
}
