import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

const DEMONSTRATED = [
  "Server-side authorization (RBAC permissions checked in services, not just the UI)",
  "Role-based access control (Support Agent / Compliance Analyst / Compliance Manager)",
  "Immutable audit trail — denials included, DB-level write protection",
  "Sensitive-action confirmation dialogs with required reasons",
  "Input validation and consistent API error mapping",
  "Two-step approval for HIGH-risk rejections",
  "Authorization and workflow tests in CI",
  "Modular architecture: reusable platform vs. per-tool business logic",
];

const PRODUCTION_GAPS = [
  "Enterprise SSO integration (Okta / Auth0 / Entra ID via OIDC)",
  "Secrets and key management (KMS / vault, rotation)",
  "Immutable audit storage (WORM / append-only export, e.g. S3 Object Lock)",
  "Audit retention policies aligned to regulation",
  "PII handling and data-governance review",
  "Formal security review / penetration test",
  "Dependency vulnerability scanning and patching SLA",
  "Monitoring, alerting and on-call ownership",
  "Backup, restore drills and disaster recovery",
  "Compliance validation (SOC 2, PCI-DSS scope assessment)",
];

export default function ProductionReadinessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Production Readiness"
        description="What this prototype demonstrates versus the responsibilities that come with owning a custom internal-tools platform."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Demonstrated in Prototype">
          <ul className="space-y-2.5">
            {DEMONSTRATED.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 font-semibold text-emerald-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Requires Production Implementation / Validation">
          <ul className="space-y-2.5">
            {PRODUCTION_GAPS.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 font-semibold text-amber-600">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-6 max-w-3xl text-sm text-slate-500">
        These gaps are not failures of the approach — they are the responsibilities a team accepts when it owns the
        platform instead of renting one. Each maps to a concrete engineering investment, priced against the
        alternative&rsquo;s licensing cost.
      </p>
    </>
  );
}
