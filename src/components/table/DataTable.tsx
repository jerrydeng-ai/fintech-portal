"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SortDirection = "asc" | "desc";
export type SortState<K extends string> = { key: K; direction: SortDirection };

export type Column<T, K extends string = string> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** When set, the header becomes a sort toggle for this key. */
  sortKey?: K;
  align?: "left" | "right";
  className?: string;
};

type DataTableProps<T, K extends string> = {
  columns: Column<T, K>[];
  rows: T[];
  getRowKey: (row: T) => string;
  sort?: SortState<K>;
  onSortChange?: (sort: SortState<K>) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
};

function SortIndicator({ direction }: { direction: SortDirection | null }) {
  return (
    <span aria-hidden className={cn("ml-1 inline-block text-[10px]", direction ? "text-slate-700" : "text-slate-300")}>
      {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "▲▼"}
    </span>
  );
}

/** Generic, presentation-only table. Data fetching, filtering and sorting live with the caller. */
export function DataTable<T, K extends string = string>({
  columns,
  rows,
  getRowKey,
  sort,
  onSortChange,
  onRowClick,
  emptyMessage = "No records found.",
}: DataTableProps<T, K>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => {
              const active = column.sortKey !== undefined && sort?.key === column.sortKey;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.sortKey && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center uppercase hover:text-slate-800"
                      onClick={() => {
                        const sortKey = column.sortKey as K;
                        onSortChange({
                          key: sortKey,
                          direction: active && sort?.direction === "desc" ? "asc" : "desc",
                        });
                      }}
                    >
                      {column.header}
                      <SortIndicator direction={active ? (sort?.direction ?? null) : null} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer hover:bg-slate-50")}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-slate-700",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
