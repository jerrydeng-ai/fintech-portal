"use client";

import { useState } from "react";
import { useSession } from "@/platform/auth/SessionProvider";

/**
 * Demo aid: sends the same request the Approve button would, straight to the API,
 * to prove the server enforces RBAC even when the UI is bypassed.
 */
export function BypassUiDemo({ caseId }: { caseId: string }) {
  const { user } = useSession();
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const response = await fetch(`/api/kyc/cases/${caseId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE", comment: "Approving via direct API call" }),
    });
    setResult({ status: response.status, body: JSON.stringify(await response.json(), null, 2) });
    setBusy(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-800">Security demo: bypass the UI</div>
      <p className="mt-1 text-xs text-slate-600">
        The Approve button is hidden for {user.name}, but hiding buttons is not security. Send the raw request anyway:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100">
        {`POST /api/kyc/cases/${caseId}/actions\n{ "action": "APPROVE" }`}
      </pre>
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send request as " + user.name}
      </button>
      {result && (
        <div className="mt-3">
          <div className={`text-sm font-semibold ${result.status === 403 ? "text-red-700" : "text-slate-800"}`}>
            HTTP {result.status} {result.status === 403 ? "Forbidden — rejected by the server" : ""}
          </div>
          <pre className="mt-1 overflow-x-auto rounded bg-white px-3 py-2 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200">
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}
