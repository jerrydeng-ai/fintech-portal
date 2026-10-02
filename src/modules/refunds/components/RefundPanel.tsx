"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { TextAreaField } from "@/components/forms/TextAreaField";
import type { ApiErrorBody } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useSession } from "@/platform/auth/SessionProvider";
import { PermissionGate } from "@/platform/rbac/PermissionGate";
import type { RefundTransactionDto } from "../types";

export function RefundPanel({ transaction }: { transaction: RefundTransactionDto }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { permissions } = useSession();

  if (transaction.status === "REFUNDED") {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        Refunded {transaction.refundedAt ? formatDateTime(transaction.refundedAt) : ""}
        {transaction.refundedByName ? ` by ${transaction.refundedByName}` : ""}
        {transaction.refundReason ? ` — “${transaction.refundReason}”` : ""}
      </p>
    );
  }

  if (!permissions.includes("refund:approve")) {
    return (
      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Your role can view this transaction but cannot issue refunds.
      </p>
    );
  }

  const commentMissing = !comment.trim();
  const amount = `${transaction.currency} ${(transaction.amountCents / 100).toFixed(2)}`;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/refunds/transactions/${transaction.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (!response.ok) {
        const body: ApiErrorBody | null = await response.json().catch(() => null);
        setError(body?.error?.message ?? "The server rejected this refund. Please try again.");
        return;
      }
      setOpen(false);
      setComment("");
      router.refresh();
    } catch {
      setError("Network error — the request could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PermissionGate permission="refund:approve">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          Refund {amount}
        </button>
      </PermissionGate>
      <ConfirmationDialog
        open={open}
        title={`Refund ${amount} to ${transaction.customerName}?`}
        description="The full settled amount will be returned to the customer. This decision is recorded permanently in the audit trail."
        confirmLabel="Confirm refund"
        tone="warning"
        confirmDisabled={commentMissing}
        busy={busy}
        error={error}
        onConfirm={submit}
        onCancel={() => setOpen(false)}
      >
        <TextAreaField
          label="Comment"
          value={comment}
          onChange={setComment}
          required
          maxLength={2000}
          placeholder="Reason for the refund…"
          hint="Required for this action."
        />
      </ConfirmationDialog>
    </div>
  );
}
