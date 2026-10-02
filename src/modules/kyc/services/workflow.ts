import type { Permission } from "@/platform/rbac/permissions";
import type { CaseStatus, ReviewAction, RiskLevel } from "../types";

/** Pure KYC workflow rules. Safe to import from client components (no server dependencies). */
export type ReviewActionConfig = {
  label: string;
  permission: Permission;
  /** null when the target is resolved at runtime (DENY_REJECTION restores the prior status). */
  targetStatus: CaseStatus | null;
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
  APPROVE_REJECTION: {
    label: "Approve rejection",
    permission: "kyc:approve_rejection",
    targetStatus: "REJECTED",
    auditAction: "KYC_REJECTION_APPROVED",
    requiresComment: false,
    allowedFrom: ["PENDING_SECONDARY_APPROVAL"],
  },
  DENY_REJECTION: {
    label: "Deny rejection",
    permission: "kyc:approve_rejection",
    // Resolved at runtime from the pending request's original status.
    targetStatus: null,
    auditAction: "KYC_REJECTION_DENIED",
    requiresComment: true,
    allowedFrom: ["PENDING_SECONDARY_APPROVAL"],
  },
};

/** HIGH-risk rejections are two-step: the analyst files a request, a Compliance Manager decides. */
export function requiresSecondaryApproval(riskLevel: RiskLevel): boolean {
  return riskLevel === "HIGH";
}

export function actionLabel(action: ReviewAction, riskLevel: RiskLevel): string {
  if (action === "REJECT" && requiresSecondaryApproval(riskLevel)) return "Request rejection";
  return REVIEW_ACTION_CONFIG[action].label;
}

export const OPEN_STATUSES: readonly CaseStatus[] = ["PENDING", "IN_REVIEW", "ESCALATED", "PENDING_SECONDARY_APPROVAL"];

export function canTransition(from: CaseStatus, action: ReviewAction): boolean {
  return REVIEW_ACTION_CONFIG[action].allowedFrom.includes(from);
}
