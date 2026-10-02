import { StatusBadge, type BadgeTone } from "@/components/feedback/StatusBadge";
import { humanize } from "@/lib/format";
import type { CaseStatus, RiskLevel } from "../types";

const STATUS_TONES: Record<CaseStatus, BadgeTone> = {
  PENDING: "neutral",
  IN_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  ESCALATED: "warning",
  PENDING_SECONDARY_APPROVAL: "info",
};

const RISK_TONES: Record<RiskLevel, BadgeTone> = { LOW: "success", MEDIUM: "warning", HIGH: "danger" };

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <StatusBadge label={humanize(status)} tone={STATUS_TONES[status]} />;
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  return <StatusBadge label={humanize(level)} tone={RISK_TONES[level]} />;
}

const CHECK_TONES: Record<string, BadgeTone> = {
  VERIFIED: "success",
  VALID: "success",
  CLEAR: "success",
  PENDING: "neutral",
  UNDER_REVIEW: "info",
  UNVERIFIED: "warning",
  MISMATCH: "warning",
  LOW_QUALITY: "warning",
  EXPIRED: "danger",
  FAILED: "danger",
  POTENTIAL_MATCH: "danger",
};

export function VerificationBadge({ value }: { value: string }) {
  return <StatusBadge label={humanize(value)} tone={CHECK_TONES[value] ?? "neutral"} />;
}
