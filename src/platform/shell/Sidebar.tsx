"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavIcon, NavSection } from "./types";

const ICON_PATHS: Record<NavIcon, string> = {
  dashboard: "M3 3h6v8H3V3Zm8 0h6v5h-6V3ZM3 13h6v4H3v-4Zm8-3h6v7h-6v-7Z",
  queue: "M4 4h12v2H4V4Zm0 5h12v2H4V9Zm0 5h8v2H4v-2Z",
  audit: "M6 2h6l4 4v12H6V2Zm6 1.5V7h3.5L12 3.5ZM8 10h6v1.5H8V10Zm0 3h6v1.5H8V13Z",
  architecture: "M9 2h2v4H9V2ZM4 8h12v2H4V8Zm-1 4h4v6H3v-6Zm5 0h4v6H8v-6Zm5 0h4v6h-4v-6Z",
  refund: "M10 3a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V3Z",
  flag: "M4 2h2v16H4V2Zm3 1h9l-2 3.5L16 10H7V3Z",
};

function Icon({ name }: { name: NavIcon }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6 px-3 py-5">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section.title}</div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                      active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                    )}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
