import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/platform/audit/audit-recorder";
import { listResourceHistory } from "@/platform/audit/audit-service";
import type { AuditEventDto } from "@/platform/audit/types";
import type { AuthenticatedUser } from "@/platform/auth/types";
import { prisma, runInTransaction } from "@/platform/database/client";
import { requirePermission } from "@/platform/rbac/guard";
import {
  countQueueStats,
  findAssignedAnalystId,
  findCaseById,
  findCases,
  updateCaseStatus,
} from "../repository/kyc-case-repository";
import {
  CASE_SORT_KEYS,
  CASE_STATUSES,
  REVIEW_ACTIONS,
  RISK_LEVELS,
  type CaseQuery,
  type KycCaseDetail,
  type KycCaseSummary,
  type QueueStats,
  type ReviewAction,
} from "../types";
import { OPEN_STATUSES, REVIEW_ACTION_CONFIG, canTransition } from "./workflow";

export const KYC_RESOURCE_TYPE = "KYC_CASE";
const MAX_COMMENT_LENGTH = 2000;

function pick<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

/** Normalises untrusted query input (URL params / API query string) into a typed CaseQuery. */
export function parseCaseQuery(input: Record<string, string | string[] | undefined>): CaseQuery {
  const first = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const status = first("status");
  return {
    status: pick(CASE_STATUSES, status),
    statuses: status === "OPEN" ? OPEN_STATUSES : undefined,
    riskLevel: pick(RISK_LEVELS, first("riskLevel")),
    search: first("search")?.slice(0, 100) || undefined,
    sortBy: pick(CASE_SORT_KEYS, first("sortBy")) ?? "riskScore",
    sortDir: first("sortDir") === "asc" ? "asc" : "desc",
  };
}

export async function listCases(actor: AuthenticatedUser, query: CaseQuery): Promise<KycCaseSummary[]> {
  await requirePermission(actor, "kyc:view");
  return findCases(prisma, query);
}

export async function getQueueStats(actor: AuthenticatedUser): Promise<QueueStats> {
  await requirePermission(actor, "kyc:view");
  return countQueueStats(prisma);
}

export async function getCase(actor: AuthenticatedUser, caseId: string): Promise<KycCaseDetail> {
  await requirePermission(actor, "kyc:view");
  const kycCase = await findCaseById(prisma, caseId);
  if (!kycCase) throw new NotFoundError(`KYC case ${caseId} not found`);
  return kycCase;
}

export async function getCaseHistory(actor: AuthenticatedUser, caseId: string): Promise<AuditEventDto[]> {
  return listResourceHistory(actor, KYC_RESOURCE_TYPE, caseId);
}

export type ReviewActionInput = { action: ReviewAction; comment: string; expectedVersion?: number };

export function parseReviewActionInput(body: unknown): ReviewActionInput {
  const record = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const action = pick(REVIEW_ACTIONS, record.action);
  if (!action) throw new ValidationError(`action must be one of ${REVIEW_ACTIONS.join(", ")}`);
  const comment = typeof record.comment === "string" ? record.comment.trim() : "";
  if (comment.length > MAX_COMMENT_LENGTH) throw new ValidationError(`comment must be at most ${MAX_COMMENT_LENGTH} characters`);
  const expectedVersion = typeof record.expectedVersion === "number" ? record.expectedVersion : undefined;
  return { action, comment, expectedVersion };
}

export type ReviewActionResult = { case: KycCaseDetail; auditEvent: AuditEventDto };

/**
 * Approve / reject / escalate a case.
 * Authorization → validation → (case update + audit event) in one transaction.
 */
export async function performReviewAction(
  actor: AuthenticatedUser,
  caseId: string,
  rawInput: unknown,
): Promise<ReviewActionResult> {
  const input = parseReviewActionInput(rawInput);
  const config = REVIEW_ACTION_CONFIG[input.action];

  await requirePermission(actor, config.permission, {
    resourceType: KYC_RESOURCE_TYPE,
    resourceId: caseId,
    attemptedAction: config.auditAction,
  });

  if (config.requiresComment && !input.comment) {
    throw new ValidationError(`A comment is required to ${config.label.toLowerCase()} a case`);
  }

  return runInTransaction(async (tx) => {
    const current = await findCaseById(tx, caseId);
    if (!current) throw new NotFoundError(`KYC case ${caseId} not found`);

    if (input.expectedVersion !== undefined && input.expectedVersion !== current.version) {
      throw new ConflictError("This case was updated by someone else. Refresh and try again.");
    }
    if (!canTransition(current.status, input.action)) {
      throw new ConflictError(`Cannot ${config.label.toLowerCase()} a case that is ${current.status}`);
    }

    const assignedAnalystId = (await findAssignedAnalystId(tx, caseId)) ?? actor.id;
    const updated = await updateCaseStatus(tx, {
      id: caseId,
      expectedVersion: current.version,
      status: config.targetStatus,
      assignedAnalystId,
    });
    if (!updated) throw new ConflictError("This case was updated by someone else. Refresh and try again.");

    const auditEvent = await recordAuditEvent(tx, {
      actor,
      action: config.auditAction,
      resourceType: KYC_RESOURCE_TYPE,
      resourceId: caseId,
      previousState: { status: current.status },
      newState: { status: config.targetStatus },
      metadata: {
        customerId: current.customerId,
        customerName: current.customerName,
        riskScore: current.riskScore,
        comment: input.comment || null,
      },
    });

    const result = await findCaseById(tx, caseId);
    if (!result) throw new NotFoundError(`KYC case ${caseId} not found`);
    return { case: result, auditEvent };
  });
}
