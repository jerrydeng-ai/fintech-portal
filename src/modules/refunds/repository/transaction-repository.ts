import type { Prisma, Transaction } from "@prisma/client";
import type { DbClient } from "@/platform/database/client";
import {
  TRANSACTION_STATUSES,
  type RefundTransactionDto,
  type TransactionQuery,
  type TransactionStatus,
} from "../types";

function parseStatus(value: string): TransactionStatus {
  const status = TRANSACTION_STATUSES.find((s) => s === value);
  if (!status) throw new Error(`Unknown transaction status ${value}`);
  return status;
}

function toDto(row: Transaction): RefundTransactionDto {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    merchantRef: row.merchantRef,
    amountCents: row.amountCents,
    currency: row.currency,
    method: row.method,
    status: parseStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    refundedAt: row.refundedAt?.toISOString() ?? null,
    refundedByName: row.refundedByName,
    refundReason: row.refundReason,
  };
}

function orderBy(query: TransactionQuery): Prisma.TransactionOrderByWithRelationInput {
  const dir = query.sortDir ?? "desc";
  switch (query.sortBy) {
    case "customerName":
      return { customerName: dir };
    case "amountCents":
      return { amountCents: dir };
    case "status":
      return { status: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function findTransactions(db: DbClient, query: TransactionQuery): Promise<RefundTransactionDto[]> {
  const search = query.search?.trim();
  const rows = await db.transaction.findMany({
    where: {
      status: query.status,
      OR: search
        ? [
            { id: { contains: search } },
            { customerId: { contains: search } },
            { customerName: { contains: search } },
            { merchantRef: { contains: search } },
          ]
        : undefined,
    },
    orderBy: [orderBy(query), { id: "asc" }],
  });
  return rows.map(toDto);
}

export async function findTransactionById(db: DbClient, id: string): Promise<RefundTransactionDto | null> {
  const row = await db.transaction.findUnique({ where: { id } });
  return row ? toDto(row) : null;
}

export async function countTransactionStats(db: DbClient) {
  const [settled, refunded, byCurrency] = await Promise.all([
    db.transaction.count({ where: { status: "SETTLED" } }),
    db.transaction.count({ where: { status: "REFUNDED" } }),
    // Sums stay per-currency — mixing currencies in one total would be meaningless.
    db.transaction.groupBy({ by: ["currency"], where: { status: "REFUNDED" }, _sum: { amountCents: true } }),
  ]);
  return {
    settled,
    refunded,
    refundedByCurrency: byCurrency.map((g) => ({ currency: g.currency, cents: g._sum.amountCents ?? 0 })),
  };
}

/** Refund is only applied while the transaction is still SETTLED — concurrent refunds can't both win. */
export async function markRefunded(
  db: DbClient,
  params: { id: string; refundedById: string; refundedByName: string; reason: string },
): Promise<boolean> {
  const result = await db.transaction.updateMany({
    where: { id: params.id, status: "SETTLED" },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundedById: params.refundedById,
      refundedByName: params.refundedByName,
      refundReason: params.reason,
    },
  });
  return result.count === 1;
}
