"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavSection } from "./types";

/** Compact horizontal navigation for viewports below the sidebar breakpoint. */
export function MobileNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
      {sections.flatMap((section) =>
        section.items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.label}
            </Link>
          );
        }),
      )}
    </nav>
  );
}
