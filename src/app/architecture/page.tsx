import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/cn";

type Layer = { name: string; detail: string; path: string; reusable: boolean };

const LAYERS: Layer[] = [
  { name: "Company SSO", detail: "Okta / Auth0 / Entra ID (demo: user switcher)", path: "external", reusable: true },
  { name: "Auth", detail: "AuthProvider interface → current user", path: "src/platform/auth", reusable: true },
  { name: "RBAC", detail: "Roles → permissions, requirePermission(), <PermissionGate>", path: "src/platform/rbac", reusable: true },
  { name: "Internal Tool Platform", detail: "App shell, navigation registry, error handling", path: "src/platform/shell", reusable: true },
];

const BRANCHES: Layer[] = [
  { name: "KYC Module", detail: "Review queue & case decisions", path: "src/modules/kyc", reusable: false },
  { name: "Audit Service", detail: "Append-only events for any resource", path: "src/platform/audit", reusable: true },
  { name: "Shared UI", detail: "DataTable, dialogs, badges, forms", path: "src/components", reusable: true },
];

const KYC_STACK: Layer[] = [
  { name: "Services", detail: "Authorization + workflow + transactions", path: "modules/kyc/services", reusable: false },
  { name: "Repositories", detail: "Only layer that touches Prisma", path: "modules/kyc/repository", reusable: false },
  { name: "Database", detail: "Prisma · SQLite (demo) / PostgreSQL", path: "src/platform/database", reusable: true },
];

function Box({ layer, className }: { layer: Layer; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-center shadow-sm",
        layer.reusable ? "border-blue-200 bg-blue-50" : "border-emerald-200 bg-emerald-50",
        className,
      )}
    >
      <div className={cn("text-sm font-semibold", layer.reusable ? "text-blue-900" : "text-emerald-900")}>{layer.name}</div>
      <div className="mt-0.5 text-xs text-slate-600">{layer.detail}</div>
      <div className="mt-1 font-mono text-[10px] text-slate-400">{layer.path}</div>
    </div>
  );
}

function Connector() {
  return <div className="mx-auto h-5 w-px bg-slate-300" />;
}

const REQUEST_FLOW = [
  ["UI component", "ReviewActionsPanel calls POST /api/kyc/cases/:id/actions"],
  ["API route", "requireUser() resolves identity via the AuthProvider"],
  ["Service", "requirePermission(actor, 'kyc:approve') — denials are audited"],
  ["Service", "Workflow rules: is PENDING → APPROVED allowed? comment required?"],
  ["Transaction", "Repository updates the case (optimistic version check) + audit event inserted"],
  ["Database", "Commit both or neither; audit rows protected by DB triggers"],
];

const FUTURE_TOOLS = [
  ["Refund Operations", "refund:view, refund:approve", "REFUND_APPROVED"],
  ["Feature Flag Admin", "flag:view, flag:change", "FEATURE_FLAG_CHANGED"],
  ["AML Investigation", "aml:view, aml:file_sar", "AML_SAR_FILED"],
  ["Merchant Onboarding", "merchant:view, merchant:approve", "MERCHANT_APPROVED"],
  ["Payment Reconciliation", "ledger:view, ledger:adjust", "LEDGER_ADJUSTMENT_CREATED"],
  ["Account Controls", "account:freeze", "ACCOUNT_FROZEN"],
];

export default function ArchitecturePage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Architecture"
        description="The KYC Review Queue is the first tool on a shared internal-tools platform. Blue pieces are reusable platform capabilities; green pieces are KYC-specific business logic."
        actions={
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-blue-200 bg-blue-50" /> Reusable platform
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-emerald-200 bg-emerald-50" /> App-specific
            </span>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="System layers" className="xl:col-span-3">
          <div className="mx-auto max-w-2xl py-2">
            {LAYERS.map((layer) => (
              <div key={layer.name}>
                <Box layer={layer} className="mx-auto max-w-md" />
                <Connector />
              </div>
            ))}
            <div className="mx-auto h-px w-2/3 bg-slate-300" />
            <div className="grid grid-cols-3 gap-4">
              {BRANCHES.map((layer) => (
                <div key={layer.name}>
                  <Connector />
                  <Box layer={layer} />
                  {layer.name === "KYC Module" &&
                    KYC_STACK.map((inner) => (
                      <div key={inner.name}>
                        <Connector />
                        <Box layer={inner} />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card title="Request flow: approving a case">
            <ol className="space-y-3">
              {REQUEST_FLOW.map(([step, detail], index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{step}</div>
                    <div className="text-xs text-slate-600">{detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Roadmap: same platform, more tools">
            <pre className="font-mono text-sm leading-6 text-slate-800">
              {`Today
 └── KYC Review Queue

Future
 ├── Refund Operations
 ├── Feature Flag Admin
 ├── AML Investigation
 ├── Merchant Onboarding
 ├── Payment Reconciliation
 └── Account Controls`}
            </pre>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="What tool #2 reuses for free">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              ["Authentication", "getCurrentUser() / requireUser() — SSO swap is one file"],
              ["RBAC", "Add permissions to the catalogue; guard services with requirePermission()"],
              ["Audit logging", "recordAuditEvent(tx, {...}) inside the same transaction"],
              ["Database utilities", "Prisma client, runInTransaction(), DbClient type"],
              ["Application shell", "Register a ToolModule — nav, user menu, layout appear automatically"],
              ["Shared components", "DataTable, SearchInput, SelectFilter, ConfirmationDialog, AuditTimeline, PermissionGate…"],
              ["API conventions", "withApiHandler() maps domain errors to 400/401/403/404/409"],
            ].map(([name, detail]) => (
              <li key={name} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong className="font-semibold text-slate-900">{name}</strong> — {detail}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="What tool #2 writes itself">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Tool</th>
                <th className="pb-2">New permissions</th>
                <th className="pb-2">Audit events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FUTURE_TOOLS.map(([tool, perms, event]) => (
                <tr key={tool}>
                  <td className="py-2 font-medium text-slate-900">{tool}</td>
                  <td className="py-2 font-mono text-xs text-slate-600">{perms}</td>
                  <td className="py-2 font-mono text-xs text-slate-600">{event}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Each tool adds a <code className="font-mono">src/modules/&lt;tool&gt;</code> folder (types, repository, services,
            components), a module manifest, and pages. Everything above the module line is already built and tested.
          </p>
        </Card>
      </div>
    </>
  );
}
