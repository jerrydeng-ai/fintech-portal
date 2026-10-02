import { ValidationError } from "@/lib/errors";
import type { DbClient } from "@/platform/database/client";
import { insertAuditEvent } from "./audit-repository";
import type { AuditEventDto, RecordAuditEventInput } from "./types";

const ACTION_PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/**
 * Records an audit event. Pass the transaction client from the business operation
 * so the state change and its audit record commit (or roll back) together.
 */
export async function recordAuditEvent(db: DbClient, input: RecordAuditEventInput): Promise<AuditEventDto> {
  if (!ACTION_PATTERN.test(input.action)) {
    throw new ValidationError(`Audit action "${input.action}" must be UPPER_SNAKE_CASE`);
  }
  if (!input.resourceType || !input.resourceId) {
    throw new ValidationError("Audit events require a resourceType and resourceId");
  }
  return insertAuditEvent(db, input);
}
