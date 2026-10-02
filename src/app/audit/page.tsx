import Link from "next/link";
import { toneForAuditAction } from "@/components/audit/audit-tone";
import { AccessDenied } from "@/components/feedback/AccessDenied";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDateTime } from "@/lib/format";
import { getAuditFilterOptions, listAuditLog } from "@/platform/audit/audit-service";
import type { AuditEventDto } from "@/platform/audit/types";
import { requireUser } from "@/platform/auth/session";
import { listUsers } from "@/platform/auth/user-repository";
import { prisma } from "@/platform/database/client";
import type { JsonObject } from "@/platform/database/json";
import { hasPermission } from "@/platform/rbac/permissions";
import { AuditFilters } from "./AuditFilters";

export const dynamic = "force-dynamic";

const RESOURCE_LINKS: Record<string, (id: string) => string> = {
  KYC_CASE: (id) => `/kyc/${id}`,
};

function stateLabel(state: JsonObject | null): string {
  if (!state) return "—";
  return Object.values(state).map(String).join(", ");
}

function ResourceCell({ event }: { event: AuditEventDto }) {
  const href = RESOURCE_LINKS[event.resourceType]?.(event.resourceId);
  const label = (
    <span className="font-mono text-xs">
      {event.resourceType}:{event.resourceId}
    </span>
  );
  return (
    <div>
      {href ? (
        <Link href={href} className="text-blue-600 hover:underline">
          {label}
        </Link>
      ) : (
        label
      )}
      {typeof event.metadata?.customerName === "string" && (
        <div className="text-xs text-slate-500">{event.metadata.customerName}</div>
      )}
    </div>
  );
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "audit:view")) {
    return (
      <>
        <PageHeader title="Audit Log" />
        <AccessDenied permission="audit:view" message="The global audit log is restricted to compliance and admin roles." />
      </>
    );
  }

  const params = await searchParams;
  const [events, options, users] = await Promise.all([
    listAuditLog(user, { action: params.action, resourceType: params.resourceType, userId: params.userId }),
    getAuditFilterOptions(user),
    listUsers(prisma),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Audit Log"
        description="Append-only record of every privileged action across all internal tools. Rows cannot be edited or deleted — the database rejects it."
      />
      <AuditFilters actions={options.actions} resourceTypes={options.resourceTypes} users={users} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Timestamp</th>
              <th className="px-4 py-2.5">User</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Resource</th>
              <th className="px-4 py-2.5">State change</th>
              <th className="px-4 py-2.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No events match these filters.
                </td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event.eventId} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{formatDateTime(event.timestamp)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-medium text-slate-900">{event.userName}</div>
                  <div className="text-xs text-slate-500">{event.userRole}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge
                    label={event.action}
                    className="font-mono"
                    tone={toneForAuditAction(event.action)}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ResourceCell event={event} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">
                  {event.previousState || event.newState ? (
                    <>
                      {stateLabel(event.previousState)} → <strong>{stateLabel(event.newState)}</strong>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                  {typeof event.metadata?.comment === "string" && <div>“{event.metadata.comment}”</div>}
                  {event.action === "ACCESS_DENIED" && (
                    <div className="text-red-700">
                      Tried {String(event.metadata?.attemptedAction)} without {String(event.metadata?.requiredPermission)}
                    </div>
                  )}
                  <div className="mt-0.5 font-mono text-[10px] text-slate-400">{event.eventId}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
