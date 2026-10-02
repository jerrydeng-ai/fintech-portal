"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SearchInput } from "@/components/forms/SearchInput";
import { SelectFilter } from "@/components/forms/SelectFilter";
import { DataTable, type Column, type SortState } from "@/components/table/DataTable";
import { formatDate, humanize } from "@/lib/format";
import { TRANSACTION_STATUSES, type RefundTransactionDto, type TransactionQuery, type TransactionSortKey } from "../types";
import { TransactionStatusBadge } from "./RefundBadges";

function formatMoney(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

const COLUMNS: Column<RefundTransactionDto, TransactionSortKey>[] = [
  {
    id: "customer",
    header: "Customer",
    sortKey: "customerName",
    cell: (row) => (
      <div>
        <div className="font-medium text-slate-900">{row.customerName}</div>
        <div className="font-mono text-xs text-slate-500">{row.customerId}</div>
      </div>
    ),
  },
  { id: "id", header: "Transaction", cell: (row) => <span className="font-mono text-xs">{row.id}</span> },
  { id: "merchantRef", header: "Merchant Ref", cell: (row) => <span className="font-mono text-xs">{row.merchantRef}</span> },
  { id: "method", header: "Method", cell: (row) => humanize(row.method) },
  {
    id: "amount",
    header: "Amount",
    sortKey: "amountCents",
    align: "right",
    cell: (row) => <span className="font-semibold tabular-nums text-slate-900">{formatMoney(row.amountCents, row.currency)}</span>,
  },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <TransactionStatusBadge status={row.status} /> },
  { id: "createdAt", header: "Created At", sortKey: "createdAt", cell: (row) => formatDate(row.createdAt) },
];

const STATUS_OPTIONS = TRANSACTION_STATUSES.map((value) => ({ value, label: humanize(value) }));

export function RefundQueueTable({ transactions, query }: { transactions: RefundTransactionDto[]; query: TransactionQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onSearch = useCallback((search: string) => setParams({ search }), [setParams]);
  const sort: SortState<TransactionSortKey> = { key: query.sortBy ?? "createdAt", direction: query.sortDir ?? "desc" };
  const hasFilters = Boolean(query.status || query.search);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query.search ?? ""} onChange={onSearch} placeholder="Search by customer, transaction or merchant ref…" />
        <SelectFilter label="Status" value={query.status ?? ""} options={STATUS_OPTIONS} onChange={(status) => setParams({ status })} />
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500">
          {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
        </span>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={transactions}
        getRowKey={(row) => row.id}
        sort={sort}
        onSortChange={(next) => setParams({ sortBy: next.key, sortDir: next.direction })}
        onRowClick={(row) => router.push(`/refunds/${row.id}`)}
        emptyMessage="No transactions match the current filters."
      />
    </div>
  );
}
