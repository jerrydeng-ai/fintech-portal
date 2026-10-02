import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { AccessDenied } from "@/components/feedback/AccessDenied";
import { RefundQueueTable } from "@/modules/refunds/components/RefundQueueTable";
import { getTransactionStats, listTransactions, parseTransactionQuery } from "@/modules/refunds/services/refund-service";
import { requireUser } from "@/platform/auth/session";
import { hasPermission } from "@/platform/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function RefundOperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "refund:view")) return <AccessDenied permission="refund:view" />;

  const query = parseTransactionQuery(await searchParams);
  const [transactions, stats] = await Promise.all([listTransactions(user, query), getTransactionStats(user)]);

  return (
    <>
      <PageHeader
        eyebrow="Refund Operations"
        title="Refund Operations"
        description="Search settled card transactions and issue refunds. Every refund is approved and audited."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Settled" value={stats.settled} href="/refunds?status=SETTLED" hint="Eligible for refund" />
        <StatCard label="Refunded" value={stats.refunded} href="/refunds?status=REFUNDED" accent="blue" />
        <StatCard label="Refunded volume" value={`USD ${(stats.refundedCents / 100).toFixed(2)}`} accent="amber" />
      </div>
      <RefundQueueTable transactions={transactions} query={query} />
    </>
  );
}
