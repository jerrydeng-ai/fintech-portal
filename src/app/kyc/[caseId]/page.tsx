import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditTimeline } from "@/components/audit/AuditTimeline";
import { Card } from "@/components/layout/Card";
import { DefinitionList } from "@/components/layout/DefinitionList";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/feedback/AccessDenied";
import { NotFoundError } from "@/lib/errors";
import { formatDate, humanize } from "@/lib/format";
import { BypassUiDemo } from "@/modules/kyc/components/BypassUiDemo";
import { CaseStatusBadge, VerificationBadge } from "@/modules/kyc/components/KycBadges";
import { ReviewActionsPanel } from "@/modules/kyc/components/ReviewActionsPanel";
import { RiskScorePanel } from "@/modules/kyc/components/RiskScorePanel";
import { getCase, getCaseHistory } from "@/modules/kyc/services/kyc-service";
import { requireUser } from "@/platform/auth/session";
import { hasPermission } from "@/platform/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function CaseReviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await requireUser();
  if (!hasPermission(user, "kyc:view")) return <AccessDenied permission="kyc:view" />;

  const { caseId } = await params;
  const kycCase = await getCase(user, caseId).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const canViewAudit = hasPermission(user, "audit:view");
  const history = canViewAudit ? await getCaseHistory(user, caseId) : [];
  const { customer, verification } = kycCase;

  return (
    <>
      <Link href="/kyc" className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← Back to queue
      </Link>
      <PageHeader
        eyebrow={<span className="font-mono">{kycCase.id}</span>}
        title={customer.fullName}
        description={kycCase.reasonFlagged}
        actions={<CaseStatusBadge status={kycCase.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Review decision" description="Approve, reject or escalate. Every decision is written to the audit trail.">
            <ReviewActionsPanel
              caseId={kycCase.id}
              customerName={customer.fullName}
              status={kycCase.status}
              version={kycCase.version}
            />
            {!hasPermission(user, "kyc:approve") && (
              <div className="mt-4">
                <BypassUiDemo caseId={kycCase.id} />
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Customer">
              <DefinitionList
                items={[
                  { label: "Name", value: customer.fullName },
                  { label: "Customer ID", value: <span className="font-mono">{customer.id}</span> },
                  { label: "Country", value: customer.country },
                  { label: "Date of birth", value: formatDate(customer.dateOfBirth) },
                  { label: "Account created", value: formatDate(customer.accountCreatedAt) },
                  { label: "Email", value: customer.email },
                  { label: "Assigned analyst", value: kycCase.assignedAnalystName ?? "Unassigned" },
                  { label: "Flagged on", value: formatDate(kycCase.createdAt) },
                ]}
              />
            </Card>
            <Card title="KYC information">
              <DefinitionList
                items={[
                  { label: "Identity verification", value: <VerificationBadge value={verification.identityVerification} /> },
                  { label: "Document type", value: humanize(verification.documentType) },
                  { label: "Document status", value: <VerificationBadge value={verification.documentStatus} /> },
                  { label: "Address verification", value: <VerificationBadge value={verification.addressVerification} /> },
                  { label: "Sanctions screening", value: <VerificationBadge value={verification.sanctionsScreening} /> },
                  { label: "PEP screening", value: <VerificationBadge value={verification.pepScreening} /> },
                ]}
              />
            </Card>
          </div>

          <Card title="Audit history" description="Immutable record of every action on this case.">
            {canViewAudit ? (
              <AuditTimeline events={history} />
            ) : (
              <p className="text-sm text-slate-500">
                Your role does not include <code className="font-mono text-xs">audit:view</code>, so case history is hidden.
              </p>
            )}
          </Card>
        </div>

        <Card title="Risk assessment" className="h-fit">
          <RiskScorePanel score={kycCase.riskScore} level={kycCase.riskLevel} factors={kycCase.riskFactors} />
        </Card>
      </div>
    </>
  );
}
