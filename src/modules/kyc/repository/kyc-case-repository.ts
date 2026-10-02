import type { Customer, KycCase, Prisma, RiskFactor, User } from "@prisma/client";
import type { DbClient } from "@/platform/database/client";
import { CASE_STATUSES, RISK_LEVELS, type CaseQuery, type CaseStatus, type KycCaseDetail, type KycCaseSummary, type RiskLevel } from "../types";
import { OPEN_STATUSES } from "../services/workflow";

type CaseWithRelations = KycCase & { customer: Customer; assignedAnalyst: User | null };
type CaseWithDetail = CaseWithRelations & { riskFactors: RiskFactor[] };

function parseStatus(value: string): CaseStatus {
  const status = CASE_STATUSES.find((s) => s === value);
  if (!status) throw new Error(`Unknown case status ${value}`);
  return status;
}

function parseRiskLevel(value: string): RiskLevel {
  const level = RISK_LEVELS.find((l) => l === value);
  if (!level) throw new Error(`Unknown risk level ${value}`);
  return level;
}

function toSummary(row: CaseWithRelations): KycCaseSummary {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer.fullName,
    country: row.customer.country,
    countryCode: row.customer.countryCode,
    riskScore: row.riskScore,
    riskLevel: parseRiskLevel(row.riskLevel),
    reasonFlagged: row.reasonFlagged,
    status: parseStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    assignedAnalystName: row.assignedAnalyst?.name ?? null,
  };
}

function toDetail(row: CaseWithDetail): KycCaseDetail {
  return {
    ...toSummary(row),
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
    customer: {
      id: row.customer.id,
      fullName: row.customer.fullName,
      email: row.customer.email,
      country: row.customer.country,
      dateOfBirth: row.customer.dateOfBirth.toISOString(),
      accountCreatedAt: row.customer.accountCreatedAt.toISOString(),
    },
    verification: {
      identityVerification: row.identityVerification,
      documentType: row.documentType,
      documentStatus: row.documentStatus,
      addressVerification: row.addressVerification,
      sanctionsScreening: row.sanctionsScreening,
      pepScreening: row.pepScreening,
    },
    riskFactors: row.riskFactors.map((f) => ({ label: f.label, points: f.points, description: f.description })),
  };
}

function orderBy(query: CaseQuery): Prisma.KycCaseOrderByWithRelationInput {
  const dir = query.sortDir ?? "desc";
  switch (query.sortBy) {
    case "customerName":
      return { customer: { fullName: dir } };
    case "country":
      return { customer: { country: dir } };
    case "status":
      return { status: dir };
    case "createdAt":
      return { createdAt: dir };
    case "riskScore":
    default:
      return { riskScore: dir };
  }
}

const SUMMARY_INCLUDE = { customer: true, assignedAnalyst: true } as const;

export async function findCases(db: DbClient, query: CaseQuery): Promise<KycCaseSummary[]> {
  const search = query.search?.trim();
  const rows = await db.kycCase.findMany({
    where: {
      status: query.status,
      riskLevel: query.riskLevel,
      // SQLite LIKE is case-insensitive for ASCII; on PostgreSQL add `mode: "insensitive"`.
      OR: search
        ? [{ id: { contains: search } }, { customerId: { contains: search } }, { customer: { fullName: { contains: search } } }]
        : undefined,
    },
    include: SUMMARY_INCLUDE,
    orderBy: [orderBy(query), { id: "asc" }],
  });
  return rows.map(toSummary);
}

export async function findCaseById(db: DbClient, id: string): Promise<KycCaseDetail | null> {
  const row = await db.kycCase.findUnique({
    where: { id },
    include: { ...SUMMARY_INCLUDE, riskFactors: { orderBy: { points: "desc" } } },
  });
  return row ? toDetail(row) : null;
}

export async function countQueueStats(db: DbClient) {
  const [pending, inReview, escalated, highRiskOpen, total] = await Promise.all([
    db.kycCase.count({ where: { status: "PENDING" } }),
    db.kycCase.count({ where: { status: "IN_REVIEW" } }),
    db.kycCase.count({ where: { status: "ESCALATED" } }),
    db.kycCase.count({ where: { riskLevel: "HIGH", status: { in: [...OPEN_STATUSES] } } }),
    db.kycCase.count(),
  ]);
  return { pending, inReview, escalated, highRiskOpen, total };
}

/**
 * Optimistic-concurrency update: only succeeds if nobody changed the case since `expectedVersion` was read.
 * Returns false when the row was modified concurrently.
 */
export async function updateCaseStatus(
  db: DbClient,
  params: { id: string; expectedVersion: number; status: CaseStatus; assignedAnalystId: string | null },
): Promise<boolean> {
  const result = await db.kycCase.updateMany({
    where: { id: params.id, version: params.expectedVersion },
    data: { status: params.status, assignedAnalystId: params.assignedAnalystId, version: { increment: 1 } },
  });
  return result.count === 1;
}

export async function findAssignedAnalystId(db: DbClient, id: string): Promise<string | null> {
  const row = await db.kycCase.findUnique({ where: { id }, select: { assignedAnalystId: true } });
  return row?.assignedAnalystId ?? null;
}
