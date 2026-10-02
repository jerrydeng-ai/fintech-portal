export const TRANSACTION_STATUSES = ["SETTLED", "REFUNDED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TXN_SORT_KEYS = ["customerName", "amountCents", "createdAt", "status"] as const;
export type TransactionSortKey = (typeof TXN_SORT_KEYS)[number];

export type TransactionQuery = {
  status?: TransactionStatus;
  search?: string;
  sortBy?: TransactionSortKey;
  sortDir?: "asc" | "desc";
};

export type RefundTransactionDto = {
  id: string;
  customerId: string;
  customerName: string;
  merchantRef: string;
  amountCents: number;
  currency: string;
  method: string;
  status: TransactionStatus;
  createdAt: string;
  refundedAt: string | null;
  refundedByName: string | null;
  refundReason: string | null;
};

export type TransactionStats = { settled: number; refunded: number; refundedByCurrency: { currency: string; cents: number }[] };
