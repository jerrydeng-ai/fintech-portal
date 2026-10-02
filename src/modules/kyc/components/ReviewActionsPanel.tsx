"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { TextAreaField } from "@/components/forms/TextAreaField";
import type { ApiErrorBody } from "@/lib/api";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { useSession } from "@/platform/auth/SessionProvider";
import { PermissionGate } from "@/platform/rbac/PermissionGate";
import { REVIEW_ACTION_CONFIG, actionLabel, canTransition, requiresSecondaryApproval } from "../services/workflow";
import { REVIEW_ACTIONS, type CaseStatus, type ReviewAction, type RiskLevel } from "../types";

const BUTTON_STYLES: Record<ReviewAction, string> = {
  APPROVE: "bg-emerald-600 text-white hover:bg-emerald-700",
  REJECT: "bg-red-600 text-white hover:bg-red-700",
  ESCALATE: "bg-amber-500 text-white hover:bg-amber-600",
  APPROVE_REJECTION: "bg-red-600 text-white hover:bg-red-700",
  DENY_REJECTION: "bg-slate-600 text-white hover:bg-slate-700",
};

const DIALOG_TONES: Record<ReviewAction, "primary" | "danger" | "warning"> = {
  APPROVE: "primary",
  REJECT: "danger",
  ESCALATE: "warning",
  APPROVE_REJECTION: "danger",
  DENY_REJECTION: "warning",
};

type Pending = { byId: string; byName: string; comment: string; fromStatus: CaseStatus } | null;

export function ReviewActionsPanel({
  caseId,
  customerName,
  status,
  riskLevel,
  version,
  pending,
}: {
  caseId: string;
  customerName: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  version: number;
  pending: Pending;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, permissions } = useSession();
  const canActOnAnything = REVIEW_ACTIONS.some((action) => permissions.includes(REVIEW_ACTION_CONFIG[action].permission));

  const config = pendingAction ? REVIEW_ACTION_CONFIG[pendingAction] : null;
  const commentMissing = Boolean(config?.requiresComment && !comment.trim());
  const twoStepReject = pendingAction === "REJECT" && requiresSecondaryApproval(riskLevel);
  const dialogTarget: CaseStatus | null = twoStepReject
    ? "PENDING_SECONDARY_APPROVAL"
    : pendingAction === "REJECT"
      ? "REJECTED"
      : pendingAction === "APPROVE_REJECTION"
        ? "REJECTED"
        : pendingAction === "DENY_REJECTION"
          ? (pending?.fromStatus ?? null)
          : (config?.targetStatus ?? null);

  function close() {
    setPendingAction(null);
    setComment("");
    setError(null);
  }

  async function submit() {
    if (!pendingAction) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/kyc/cases/${caseId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pendingAction, comment, expectedVersion: version }),
      });
      if (!response.ok) {
        const body: ApiErrorBody | null = await response.json().catch(() => null);
        setError(body?.error?.message ?? "The server rejected this decision. Please try again.");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Network error — the request could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const isClosed = !REVIEW_ACTIONS.some((action) => canTransition(status, action));

  return (
    <div className="space-y-3">
      {status === "PENDING_SECONDARY_APPROVAL" && pending ? (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Rejection requested by <strong>{pending.byName}</strong>
          {pending.comment ? ` — “${pending.comment}”` : ""}. Awaiting a Compliance Manager&rsquo;s decision.
        </p>
      ) : !canActOnAnything ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Your role can view this case but cannot take review decisions.
        </p>
      ) : isClosed ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">This case is closed. No further actions available.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {REVIEW_ACTIONS.map((action) => {
          const actionConfig = REVIEW_ACTION_CONFIG[action];
          const allowed = canTransition(status, action);
          const isSelfApproval = action === "APPROVE_REJECTION" && pending?.byId === user.id;
          const disabled = !allowed || isSelfApproval;
          const title = isSelfApproval
            ? "You cannot approve your own rejection request"
            : allowed
              ? undefined
              : `Not available for ${status} cases`;
          return (
            <PermissionGate key={action} permission={actionConfig.permission}>
              <button
                type="button"
                disabled={disabled}
                title={title}
                onClick={() => setPendingAction(action)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40",
                  BUTTON_STYLES[action],
                )}
              >
                {actionLabel(action, riskLevel)}
              </button>
            </PermissionGate>
          );
        })}
      </div>

      <ConfirmationDialog
        open={pendingAction !== null}
        title={pendingAction ? `${actionLabel(pendingAction, riskLevel)} KYC case for ${customerName}?` : ""}
        description={
          config && (
            <>
              {twoStepReject ? (
                <>
                  This is a <strong>HIGH</strong>-risk case: status will change to{" "}
                  <strong>Pending secondary approval</strong> and a Compliance Manager must approve the rejection before
                  it takes effect.
                </>
              ) : (
                <>
                  Status will change from <strong>{status}</strong> to{" "}
                  <strong>{dialogTarget ? humanize(dialogTarget) : "the previous status"}</strong>. This decision is
                  recorded permanently in the audit trail.
                </>
              )}
            </>
          )
        }
        confirmLabel={pendingAction ? `Confirm ${actionLabel(pendingAction, riskLevel).toLowerCase()}` : "Confirm"}
        tone={pendingAction ? DIALOG_TONES[pendingAction] : "primary"}
        confirmDisabled={commentMissing}
        busy={busy}
        error={error}
        onConfirm={submit}
        onCancel={close}
      >
        <TextAreaField
          label="Comment"
          value={comment}
          onChange={setComment}
          required={config?.requiresComment}
          maxLength={2000}
          placeholder={config?.requiresComment ? "Explain the reason for this decision…" : "Optional note for the audit trail…"}
          hint={config?.requiresComment ? "Required for this action." : undefined}
        />
      </ConfirmationDialog>
    </div>
  );
}
