"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DataTable, type Column, type SortState } from "@/components/table/DataTable";
import { SearchInput } from "@/components/forms/SearchInput";
import { SelectFilter } from "@/components/forms/SelectFilter";
import { formatDate, humanize } from "@/lib/format";
import { CASE_STATUSES, RISK_LEVELS, type CaseQuery, type CaseSortKey, type KycCaseSummary } from "../types";
import { CaseStatusBadge, RiskLevelBadge } from "./KycBadges";

const COLUMNS: Column<KycCaseSummary, CaseSortKey>[] = [
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
  { id: "country", header: "Country", sortKey: "country", cell: (row) => row.country },
  {
    id: "riskScore",
    header: "Risk Score",
    sortKey: "riskScore",
    align: "right",
    cell: (row) => <span className="font-semibold tabular-nums text-slate-900">{row.riskScore}</span>,
  },
  { id: "riskLevel", header: "Risk Level", cell: (row) => <RiskLevelBadge level={row.riskLevel} /> },
  {
    id: "reason",
    header: "Reason Flagged",
    className: "max-w-[260px] truncate",
    cell: (row) => <span title={row.reasonFlagged}>{row.reasonFlagged}</span>,
  },
  { id: "status", header: "Status", sortKey: "status", cell: (row) => <CaseStatusBadge status={row.status} /> },
  { id: "createdAt", header: "Created At", sortKey: "createdAt", cell: (row) => formatDate(row.createdAt) },
  {
    id: "assigned",
    header: "Assigned Analyst",
    cell: (row) => row.assignedAnalystName ?? <span className="text-slate-400">Unassigned</span>,
  },
];

const STATUS_OPTIONS = CASE_STATUSES.map((value) => ({ value, label: humanize(value) }));
const RISK_OPTIONS = RISK_LEVELS.map((value) => ({ value, label: humanize(value) }));

/** Filter/sort state lives in the URL so views are shareable and the server does the querying. */
export function KycQueueTable({ cases, query }: { cases: KycCaseSummary[]; query: CaseQuery }) {
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
  const sort: SortState<CaseSortKey> = { key: query.sortBy ?? "riskScore", direction: query.sortDir ?? "desc" };
  const hasFilters = Boolean(query.status || query.riskLevel || query.search);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query.search ?? ""} onChange={onSearch} placeholder="Search by customer name or ID…" />
        <SelectFilter label="Status" value={query.status ?? ""} options={STATUS_OPTIONS} onChange={(status) => setParams({ status })} />
        <SelectFilter
          label="Risk"
          value={query.riskLevel ?? ""}
          options={RISK_OPTIONS}
          onChange={(riskLevel) => setParams({ riskLevel })}
        />
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
          {cases.length} case{cases.length === 1 ? "" : "s"}
        </span>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={cases}
        getRowKey={(row) => row.id}
        sort={sort}
        onSortChange={(next) => setParams({ sortBy: next.key, sortDir: next.direction })}
        onRowClick={(row) => router.push(`/kyc/${row.id}`)}
        emptyMessage="No cases match the current filters."
      />
    </div>
  );
}
