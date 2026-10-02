import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditTimeline } from "@/components/audit/AuditTimeline";
import { AccessDenied } from "@/components/feedback/AccessDenied";
import { Card } from "@/components/layout/Card";
import { DefinitionList } from "@/components/layout/DefinitionList";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotFoundError } from "@/lib/errors";
import { formatDate, formatDateTime, humanize } from "@/lib/format";
import { RefundPanel } from "@/modules/refunds/components/RefundPanel";
import { TransactionStatusBadge } from "@/modules/refunds/components/RefundBadges";
import { getTransaction, getTransactionHistory } from "@/modules/refunds/services/refund-service";
import { requireUser } from "@/platform/auth/session";
import { hasPermission } from "@/platform/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function TransactionPage({ params }: { params: Promise<{ txnId: string }> }) {
  const user = await requireUser();
  if (!hasPermission(user, "refund:view")) return <AccessDenied permission="refund:view" />;

  const { txnId } = await params;
  const txn = await getTransaction(user, txnId).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const canViewAudit = hasPermission(user, "audit:view");
  const history = canViewAudit ? await getTransactionHistory(user, txnId) : [];

  return (
    <>
      <Link href="/refunds" className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← Back to transactions
      </Link>
      <PageHeader
        eyebrow={<span className="font-mono">{txn.id}</span>}
        title={`${txn.currency} ${(txn.amountCents / 100).toFixed(2)} · ${txn.customerName}`}
        description={`Settled ${formatDate(txn.createdAt)} · Merchant ref ${txn.merchantRef}`}
        actions={<TransactionStatusBadge status={txn.status} />}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Refund" description="Issue a full refund to the customer. Every refund is written to the audit trail.">
            <RefundPanel transaction={txn} />
          </Card>
          <Card title="Transaction">
            <DefinitionList
              items={[
                { label: "Customer", value: txn.customerName },
                { label: "Customer ID", value: <span className="font-mono">{txn.customerId}</span> },
                { label: "Transaction ID", value: <span className="font-mono">{txn.id}</span> },
                { label: "Merchant reference", value: <span className="font-mono">{txn.merchantRef}</span> },
                { label: "Method", value: humanize(txn.method) },
                { label: "Amount", value: `${txn.currency} ${(txn.amountCents / 100).toFixed(2)}` },
                { label: "Settled on", value: formatDateTime(txn.createdAt) },
              ]}
            />
          </Card>
          <Card title="Audit history" description="Immutable record of every action on this transaction.">
            {canViewAudit ? (
              <AuditTimeline events={history} />
            ) : (
              <p className="text-sm text-slate-500">
                Your role does not include <code className="font-mono text-xs">audit:view</code>, so transaction history is hidden.
              </p>
            )}
          </Card>
        </div>
        <Card title="Refund policy" className="h-fit">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Only <strong>settled</strong> transactions are refundable.</li>
            <li>Refunds are always <strong>full-amount</strong> in this prototype.</li>
            <li>A comment is required and stored in the audit event.</li>
            <li>Requires the <code className="font-mono text-xs">refund:approve</code> permission — denials are audited.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
