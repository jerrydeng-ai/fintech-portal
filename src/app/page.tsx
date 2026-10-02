import Link from "next/link";
import { AuditTimeline } from "@/components/audit/AuditTimeline";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { CaseStatusBadge, RiskLevelBadge } from "@/modules/kyc/components/KycBadges";
import { getQueueStats, listCases } from "@/modules/kyc/services/kyc-service";
import { listAuditLog } from "@/platform/audit/audit-service";
import { requireUser } from "@/platform/auth/session";
import { hasPermission } from "@/platform/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const canViewKyc = hasPermission(user, "kyc:view");
  const canViewAudit = hasPermission(user, "audit:view");

  const [stats, highRisk, recentEvents] = await Promise.all([
    canViewKyc ? getQueueStats(user) : null,
    canViewKyc ? listCases(user, { riskLevel: "HIGH", sortBy: "riskScore", sortDir: "desc" }) : [],
    canViewAudit ? listAuditLog(user, { limit: 6 }) : [],
  ]);
  const openHighRisk = highRisk.filter((c) => c.status !== "APPROVED" && c.status !== "REJECTED").slice(0, 5);

  return (
    <>
      <PageHeader title={`Good day, ${user.name}`} description="Compliance Operations overview across your internal tools." />
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Pending" value={stats.pending} href="/kyc?status=PENDING" hint="Awaiting first review" />
          <StatCard label="In Review" value={stats.inReview} href="/kyc?status=IN_REVIEW" accent="blue" />
          <StatCard label="High Risk (open)" value={stats.highRiskOpen} href="/kyc?riskLevel=HIGH" accent="red" />
          <StatCard label="Escalated" value={stats.escalated} href="/kyc?status=ESCALATED" accent="amber" />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="High-risk cases needing attention"
          actions={
            <Link href="/kyc" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Open queue →
            </Link>
          }
        >
          {openHighRisk.length === 0 ? (
            <p className="text-sm text-slate-500">No open high-risk cases.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {openHighRisk.map((c) => (
                <li key={c.id}>
                  <Link href={`/kyc/${c.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                    <span className="w-10 text-right text-lg font-semibold tabular-nums text-red-700">{c.riskScore}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-900">{c.customerName}</span>
                      <span className="block text-xs text-slate-500">{c.reasonFlagged}</span>
                    </span>
                    <RiskLevelBadge level={c.riskLevel} />
                    <CaseStatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2" title="Recent audit activity">
          {canViewAudit ? (
            <AuditTimeline events={recentEvents} showResource />
          ) : (
            <p className="text-sm text-slate-500">
              Your role does not include <code className="font-mono text-xs">audit:view</code>.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
