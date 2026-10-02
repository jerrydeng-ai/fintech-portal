import Link from "next/link";
import { cn } from "@/lib/cn";

const ACCENTS = {
  slate: "text-slate-900",
  blue: "text-blue-700",
  red: "text-red-700",
  amber: "text-amber-700",
  violet: "text-violet-700",
};

export function StatCard({
  label,
  value,
  hint,
  href,
  accent = "slate",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  accent?: keyof typeof ACCENTS;
}) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-3xl font-semibold tabular-nums", ACCENTS[accent])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
