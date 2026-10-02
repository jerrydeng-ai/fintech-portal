import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/platform/audit/audit-recorder";
import { listResourceHistory } from "@/platform/audit/audit-service";
import type { AuditEventDto } from "@/platform/audit/types";
import type { AuthenticatedUser } from "@/platform/auth/types";
import { prisma, runInTransaction } from "@/platform/database/client";
import { requirePermission } from "@/platform/rbac/guard";
import { countTransactionStats, findTransactionById, findTransactions, markRefunded } from "../repository/transaction-repository";
import { TRANSACTION_STATUSES, TXN_SORT_KEYS, type RefundTransactionDto, type TransactionQuery } from "../types";

export const TRANSACTION_RESOURCE_TYPE = "TRANSACTION";
const MAX_COMMENT_LENGTH = 2000;

function pick<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

export function parseTransactionQuery(input: Record<string, string | string[] | undefined>): TransactionQuery {
  const first = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    status: pick(TRANSACTION_STATUSES, first("status")),
    search: first("search")?.slice(0, 100) || undefined,
    sortBy: pick(TXN_SORT_KEYS, first("sortBy")) ?? "createdAt",
    sortDir: first("sortDir") === "asc" ? "asc" : "desc",
  };
}

export async function listTransactions(actor: AuthenticatedUser, query: TransactionQuery): Promise<RefundTransactionDto[]> {
  await requirePermission(actor, "refund:view");
  return findTransactions(prisma, query);
}

export async function getTransactionStats(actor: AuthenticatedUser) {
  await requirePermission(actor, "refund:view");
  return countTransactionStats(prisma);
}

export async function getTransaction(actor: AuthenticatedUser, txnId: string): Promise<RefundTransactionDto> {
  await requirePermission(actor, "refund:view");
  const txn = await findTransactionById(prisma, txnId);
  if (!txn) throw new NotFoundError(`Transaction ${txnId} not found`);
  return txn;
}

export async function getTransactionHistory(actor: AuthenticatedUser, txnId: string): Promise<AuditEventDto[]> {
  return listResourceHistory(actor, TRANSACTION_RESOURCE_TYPE, txnId);
}

export type RefundInput = { comment: string };

export function parseRefundInput(body: unknown): RefundInput {
  const record = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const comment = typeof record.comment === "string" ? record.comment.trim() : "";
  if (!comment) throw new ValidationError("A comment is required to refund a transaction");
  if (comment.length > MAX_COMMENT_LENGTH) throw new ValidationError(`comment must be at most ${MAX_COMMENT_LENGTH} characters`);
  return { comment };
}

export type RefundResult = { transaction: RefundTransactionDto; auditEvent: AuditEventDto };

/** Authorization → validation → (transaction update + audit event) in one transaction. */
export async function refundTransaction(actor: AuthenticatedUser, txnId: string, rawInput: unknown): Promise<RefundResult> {
  const input = parseRefundInput(rawInput);

  await requirePermission(actor, "refund:approve", {
    resourceType: TRANSACTION_RESOURCE_TYPE,
    resourceId: txnId,
    attemptedAction: "REFUND_APPROVED",
  });

  return runInTransaction(async (tx) => {
    const current = await findTransactionById(tx, txnId);
    if (!current) throw new NotFoundError(`Transaction ${txnId} not found`);
    if (current.status !== "SETTLED") throw new ConflictError(`Transaction ${txnId} is already ${current.status.toLowerCase()}`);

    const updated = await markRefunded(tx, { id: txnId, refundedById: actor.id, refundedByName: actor.name, reason: input.comment });
    if (!updated) throw new ConflictError("This transaction was just refunded by someone else.");

    const auditEvent = await recordAuditEvent(tx, {
      actor,
      action: "REFUND_APPROVED",
      resourceType: TRANSACTION_RESOURCE_TYPE,
      resourceId: txnId,
      previousState: { status: current.status },
      newState: { status: "REFUNDED" },
      metadata: {
        customerId: current.customerId,
        customerName: current.customerName,
        amountCents: current.amountCents,
        currency: current.currency,
        comment: input.comment,
      },
    });

    const result = await findTransactionById(tx, txnId);
    if (!result) throw new NotFoundError(`Transaction ${txnId} not found`);
    return { transaction: result, auditEvent };
  });
}
