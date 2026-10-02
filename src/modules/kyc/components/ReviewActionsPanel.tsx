"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { TextAreaField } from "@/components/forms/TextAreaField";
import type { ApiErrorBody } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useSession } from "@/platform/auth/SessionProvider";
import { PermissionGate } from "@/platform/rbac/PermissionGate";
import { REVIEW_ACTION_CONFIG, canTransition } from "../services/workflow";
import { REVIEW_ACTIONS, type CaseStatus, type ReviewAction } from "../types";

const BUTTON_STYLES: Record<ReviewAction, string> = {
  APPROVE: "bg-emerald-600 text-white hover:bg-emerald-700",
  REJECT: "bg-red-600 text-white hover:bg-red-700",
  ESCALATE: "bg-amber-500 text-white hover:bg-amber-600",
};

const DIALOG_TONES = { APPROVE: "primary", REJECT: "danger", ESCALATE: "warning" } as const;

export function ReviewActionsPanel({
  caseId,
  customerName,
  status,
  version,
}: {
  caseId: string;
  customerName: string;
  status: CaseStatus;
  version: number;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { permissions } = useSession();
  const canActOnAnything = REVIEW_ACTIONS.some((action) => permissions.includes(REVIEW_ACTION_CONFIG[action].permission));

  const config = pendingAction ? REVIEW_ACTION_CONFIG[pendingAction] : null;
  const commentMissing = Boolean(config?.requiresComment && !comment.trim());

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
      {!canActOnAnything ? (
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
          return (
            <PermissionGate key={action} permission={actionConfig.permission}>
              <button
                type="button"
                disabled={!allowed}
                title={allowed ? undefined : `Not available for ${status} cases`}
                onClick={() => setPendingAction(action)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40",
                  BUTTON_STYLES[action],
                )}
              >
                {actionConfig.label}
              </button>
            </PermissionGate>
          );
        })}
      </div>

      <ConfirmationDialog
        open={pendingAction !== null}
        title={config ? `${config.label} KYC case for ${customerName}?` : ""}
        description={
          config && (
            <>
              Status will change from <strong>{status}</strong> to <strong>{config.targetStatus}</strong>. This decision is
              recorded permanently in the audit trail.
            </>
          )
        }
        confirmLabel={config ? `Confirm ${config.label.toLowerCase()}` : "Confirm"}
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
