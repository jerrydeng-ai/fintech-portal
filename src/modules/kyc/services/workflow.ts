import type { Permission } from "@/platform/rbac/permissions";
import type { CaseStatus, ReviewAction } from "../types";

/** Pure KYC workflow rules. Safe to import from client components (no server dependencies). */
export type ReviewActionConfig = {
  label: string;
  permission: Permission;
  targetStatus: CaseStatus;
  auditAction: string;
  requiresComment: boolean;
  allowedFrom: readonly CaseStatus[];
};

export const REVIEW_ACTION_CONFIG: Record<ReviewAction, ReviewActionConfig> = {
  APPROVE: {
    label: "Approve",
    permission: "kyc:approve",
    targetStatus: "APPROVED",
    auditAction: "KYC_APPROVED",
    requiresComment: false,
    allowedFrom: ["PENDING", "IN_REVIEW", "ESCALATED"],
  },
  REJECT: {
    label: "Reject",
    permission: "kyc:reject",
    targetStatus: "REJECTED",
    auditAction: "KYC_REJECTED",
    requiresComment: true,
    allowedFrom: ["PENDING", "IN_REVIEW", "ESCALATED"],
  },
  ESCALATE: {
    label: "Escalate",
    permission: "kyc:escalate",
    targetStatus: "ESCALATED",
    auditAction: "KYC_ESCALATED",
    requiresComment: true,
    allowedFrom: ["PENDING", "IN_REVIEW"],
  },
};

export const OPEN_STATUSES: readonly CaseStatus[] = ["PENDING", "IN_REVIEW", "ESCALATED"];

export function canTransition(from: CaseStatus, action: ReviewAction): boolean {
  return REVIEW_ACTION_CONFIG[action].allowedFrom.includes(from);
}
