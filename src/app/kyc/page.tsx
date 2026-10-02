import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { AccessDenied } from "@/components/feedback/AccessDenied";
import { KycQueueTable } from "@/modules/kyc/components/KycQueueTable";
import { getQueueStats, listCases, parseCaseQuery } from "@/modules/kyc/services/kyc-service";
import { requireUser } from "@/platform/auth/session";
import { hasPermission } from "@/platform/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function KycQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "kyc:view")) return <AccessDenied permission="kyc:view" />;

  const query = parseCaseQuery(await searchParams);
  const [cases, stats] = await Promise.all([listCases(user, query), getQueueStats(user)]);

  return (
    <>
      <PageHeader
        eyebrow="KYC Reviews"
        title="KYC Review Queue"
        description="Customers flagged by automated screening for manual review. Click a row to open the case."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={stats.pending} href="/kyc?status=PENDING" />
        <StatCard label="In Review" value={stats.inReview} href="/kyc?status=IN_REVIEW" accent="blue" />
        <StatCard label="High Risk (open)" value={stats.highRiskOpen} href="/kyc?riskLevel=HIGH&status=OPEN" accent="red" />
        <StatCard label="Escalated" value={stats.escalated} href="/kyc?status=ESCALATED" accent="amber" />
      </div>
      <KycQueueTable cases={cases} query={query} />
    </>
  );
}
