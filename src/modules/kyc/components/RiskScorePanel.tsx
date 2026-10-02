import { cn } from "@/lib/cn";
import type { RiskFactorDto, RiskLevel } from "../types";
import { RiskLevelBadge } from "./KycBadges";

const BAR_COLORS: Record<RiskLevel, string> = { LOW: "bg-emerald-500", MEDIUM: "bg-amber-500", HIGH: "bg-red-500" };
const TEXT_COLORS: Record<RiskLevel, string> = { LOW: "text-emerald-700", MEDIUM: "text-amber-700", HIGH: "text-red-700" };

export function RiskScorePanel({ score, level, factors }: { score: number; level: RiskLevel; factors: RiskFactorDto[] }) {
  const maxPoints = Math.max(...factors.map((f) => f.points), 1);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline gap-3">
          <span className={cn("text-4xl font-semibold tabular-nums", TEXT_COLORS[level])}>{score}</span>
          <span className="text-sm text-slate-500">/ 100</span>
          <RiskLevelBadge level={level} />
        </div>
        <div className="relative mt-3 h-2.5 rounded-full bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100">
          <div className={cn("h-2.5 rounded-full", BAR_COLORS[level])} style={{ width: `${score}%` }} />
          <div className="absolute inset-y-0 left-[40%] w-px bg-white" />
          <div className="absolute inset-y-0 left-[70%] w-px bg-white" />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>0 Low</span>
          <span className="pl-8">40 Medium</span>
          <span>70 High</span>
          <span>100</span>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contributing factors</h3>
        <ul className="space-y-2.5">
          {factors.map((factor) => (
            <li key={factor.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{factor.label}</span>
                <span className="font-mono font-semibold text-slate-900">+{factor.points}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${(factor.points / maxPoints) * 100}%` }} />
              </div>
              {factor.description && <p className="mt-1 text-xs text-slate-500">{factor.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
