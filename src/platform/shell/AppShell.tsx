import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "@/platform/auth/session";
import type { AuthenticatedUser } from "@/platform/auth/types";
import { buildNavigation } from "./navigation";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import type { ToolModule } from "./types";
import { UserSwitcher } from "./UserSwitcher";

export function AppShell({
  session,
  switchableUsers,
  modules,
  children,
}: {
  session: Session;
  switchableUsers: AuthenticatedUser[];
  modules: readonly ToolModule[];
  children: ReactNode;
}) {
  const sections = buildNavigation(modules, session.permissions);
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 bg-slate-900 md:block">
        <Link href="/" className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 text-sm font-bold text-white">F</span>
          <span className="text-base font-semibold text-white">Fintech Ops</span>
        </Link>
        <Sidebar sections={sections} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="text-sm text-slate-500">
            Internal Tools Platform
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
              DEMO · auth: {session.authProvider}
            </span>
          </div>
          {switchableUsers.length > 0 && <UserSwitcher currentUser={session.user} users={switchableUsers} />}
        </header>
        <MobileNav sections={sections} />
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
