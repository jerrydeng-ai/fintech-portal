"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "warning";
  confirmDisabled?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

const CONFIRM_TONES = {
  primary: "bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600",
  danger: "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600",
  warning: "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600",
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  confirmDisabled = false,
  busy = false,
  error,
  onConfirm,
  onCancel,
  children,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-full max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
        className="space-y-4 p-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <div className="mt-1 text-sm text-slate-600">{description}</div>}
        </div>
        {children}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={confirmDisabled || busy}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              CONFIRM_TONES[tone],
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
