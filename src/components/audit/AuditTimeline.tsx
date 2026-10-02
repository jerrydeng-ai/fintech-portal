import type { AuditEventDto } from "@/platform/audit/types";
import type { JsonObject, JsonValue } from "@/platform/database/json";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { toneForAuditAction } from "./audit-tone";

function formatValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** Generic before/after diff: shows only keys whose value changed. Works for any resource type. */
function StateChange({ previous, next }: { previous: JsonObject | null; next: JsonObject | null }) {
  if (!previous && !next) return null;
  const keys = Array.from(new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})]));
  const changed = keys.filter((key) => formatValue(previous?.[key]) !== formatValue(next?.[key]));
  if (changed.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {changed.map((key) => (
        <div key={key} className="font-mono text-xs text-slate-700">
          {changed.length > 1 || key !== "status" ? <span className="text-slate-500">{key}: </span> : null}
          {formatValue(previous?.[key])} <span className="text-slate-400">→</span>{" "}
          <span className="font-semibold">{formatValue(next?.[key])}</span>
        </div>
      ))}
    </div>
  );
}

export function AuditTimeline({
  events,
  showResource = false,
  emptyMessage = "No audit events yet.",
}: {
  events: AuditEventDto[];
  showResource?: boolean;
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {events.map((event) => {
        const comment = event.metadata?.comment;
        return (
          <li key={event.eventId} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-300" />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={event.action} tone={toneForAuditAction(event.action)} className="font-mono" />
              <span className="text-sm font-medium text-slate-900">{event.userName}</span>
              <span className="text-xs text-slate-500">{event.userRole}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(event.timestamp)}
              {showResource && (
                <>
                  {" · "}
                  <span className="font-mono">
                    {event.resourceType}:{event.resourceId}
                  </span>
                </>
              )}
            </div>
            <StateChange previous={event.previousState} next={event.newState} />
            {typeof comment === "string" && comment && (
              <blockquote className="mt-1.5 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">“{comment}”</blockquote>
            )}
            {event.action === "ACCESS_DENIED" && (
              <div className="mt-1 text-xs text-red-700">
                Attempted {formatValue(event.metadata?.attemptedAction)} without{" "}
                <code className="font-mono">{formatValue(event.metadata?.requiredPermission)}</code>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
