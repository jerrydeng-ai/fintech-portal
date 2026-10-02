import type { BadgeTone } from "@/components/feedback/StatusBadge";

export function toneForAuditAction(action: string): BadgeTone {
  if (action === "ACCESS_DENIED" || action.endsWith("_REJECTED")) return "danger";
  if (action.endsWith("_APPROVED")) return "success";
  if (action.endsWith("_ESCALATED")) return "warning";
  return "info";
}
