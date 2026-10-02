"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AuthenticatedUser } from "@/platform/auth/types";
import { ROLE_LABELS } from "@/platform/rbac/permissions";

const AVATAR_COLORS: Record<string, string> = {
  COMPLIANCE_ANALYST: "bg-blue-600",
  SUPPORT_AGENT: "bg-slate-500",
  ADMIN: "bg-violet-600",
};

/** Demo-only control. With real SSO this becomes a plain profile menu. */
export function UserSwitcher({ currentUser, users }: { currentUser: AuthenticatedUser; users: AuthenticatedUser[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function switchTo(userId: string) {
    setOpen(false);
    await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${AVATAR_COLORS[currentUser.role]}`}
        >
          {currentUser.name.charAt(0)}
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-medium text-slate-900">{currentUser.name}</span>
          <span className="block text-xs text-slate-500">{ROLE_LABELS[currentUser.role]}</span>
        </span>
        <span aria-hidden className="ml-1 text-xs text-slate-400">
          {pending ? "…" : "▼"}
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Switch user (demo only)
          </div>
          {users.map((user) => (
            <button
              key={user.id}
              role="menuitem"
              type="button"
              onClick={() => switchTo(user.id)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-50"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[user.role]}`}
              >
                {user.name.charAt(0)}
              </span>
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-medium text-slate-900">{user.name}</span>
                <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role]}</span>
              </span>
              {user.id === currentUser.id && <span className="text-xs font-medium text-blue-600">Current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
