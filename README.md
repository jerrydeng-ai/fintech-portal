# Fintech Ops — Internal Tools Platform

A production-shaped **internal-tools platform** — not a single app. It hosts multiple internal applications (KYC Review, Refund Operations today; Feature Flag Admin, AML review, merchant onboarding and more planned) on shared infrastructure, demonstrating how an engineering team can use Devin to **replace a low-code internal-tools platform** (e.g. Microsoft Power Apps) with real, reviewable, tested code — without losing the "spin up a new tool quickly" advantage.

The codebase is deliberately split into:

```
Reusable platform capabilities   (auth, RBAC, audit, database, shell, shared UI)
            +
Application-specific logic       (modules: KYC, Refunds, future tools)
```

so that internal tool #N is mostly "write a module", not "build a platform". The platform work is paid once; every additional application gets cheaper.

Two applications ship in this repo as proof of the pattern:

- **KYC Review** (`/kyc`) — customers flagged by automated screening land in a review queue; an analyst approves / rejects / escalates; every decision lands in an immutable audit trail. HIGH-risk rejections require secondary (Compliance Manager) approval.
- **Refund Operations** (`/refunds`) — settled-card-transaction search, details and an audited refund action, built entirely on the shared platform without modifying the KYC module.

---

## Quick start

Requirements: Node.js 20+ (tested on 22) and npm. No database server needed.

```bash
npm install      # creates .env from .env.example and generates the Prisma client
npm run dev      # applies migrations, seeds 20 demo cases + 12 demo transactions (first run only), starts Next.js
```

Open http://localhost:3000. Use the user switcher (top right) to change persona — no passwords.

| User  | Role               | Can do                                              |
| ----- | ------------------ | --------------------------------------------------- |
| Alice | Compliance Analyst | View, approve, request rejection, escalate, view audit log |
| Bob   | Support Agent      | View customers and KYC cases only                   |
| Carol | Compliance Manager | Approve or deny secondary rejections, view audit log |
| Dana  | Compliance Manager | Same as Carol — lets a manager's own request be decided by a peer |

Other scripts:

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm test`          | Vitest suite (RBAC, workflow, API authorization, audit) against a throwaway SQLite DB |
| `npm run lint`      | ESLint                                                         |
| `npm run typecheck` | `tsc --noEmit`                                                 |
| `npm run build`     | Production build                                               |
| `npm run db:reset`  | Drop, re-migrate and re-seed the demo database                 |
| `npm run db:studio` | Prisma Studio                                                  |

See [DEMO.md](./DEMO.md) for a five-minute demo script.

---

## Architecture

```
            Company SSO (Okta / Auth0 / Entra ID)      ← demo: user switcher
                          │
                    platform/auth   ── AuthProvider → AuthenticatedUser
                          │
                    platform/rbac   ── roles → permissions, requirePermission()
                          │
              platform/shell        ── app shell, module registry, navigation
                          │
      ┌───────────────────┼────────────────────┐
  modules/kyc        modules/refunds    platform/audit      components/
  (business logic)   (business logic)   (append-only log)   (shared UI)
      │
  services   ── authorization + workflow rules + transactions
      │
  repository ── the only code that touches Prisma
      │
  platform/database ── Prisma client, transactions  →  SQLite (demo) / PostgreSQL
```

The **Architecture** page in the app (`/architecture`) renders the same picture, the request flow for approving a case, and what each new module reuses vs. implements.

### Directory layout

```
src/
  app/                    Next.js routes (pages + API). Thin: parse input, call a service.
    tool-registry.ts      Composition root — the list of registered tool modules
  modules/                ← APPLICATION-SPECIFIC (one per internal tool)
    kyc/
      types/              Domain types (statuses, risk levels, DTOs)
      services/           kyc-service (use cases), workflow (state machine), risk
      repository/         Prisma access for customers / cases / risk factors
      components/         Queue table, risk panel, review actions, badges
      module.ts           Registration manifest (name, nav items, permissions)
    refunds/              Same shape: types / repository / services / components / module.ts
  platform/               ← REUSABLE BY EVERY TOOL
    auth/                 AuthProvider interface, demo provider, session helpers, SessionProvider
    rbac/                 Roles, permissions, requirePermission(), <PermissionGate>
    audit/                Generic audit event recorder, repository, query service
    database/             Prisma client + runInTransaction
    shell/                AppShell, Sidebar, UserSwitcher, module navigation
  components/             ← REUSABLE UI
    table/                DataTable (sortable, generic)
    forms/                SearchInput, SelectFilter, TextAreaField
    feedback/             StatusBadge, ConfirmationDialog, AccessDenied
    layout/               PageHeader, Card, StatCard, DefinitionList
    audit/                AuditTimeline
  lib/                    Errors, API handler wrapper, formatting helpers
prisma/                   Schema, migrations, seed data
tests/                    Vitest suites
```

### Layering rules

| Layer       | Responsibility                                                      | Must not             |
| ----------- | ------------------------------------------------------------------- | -------------------- |
| Components  | Rendering and user interaction                                      | Contain business rules or call Prisma |
| API routes / pages | Resolve the current user, parse input, call a service, map errors (`withApiHandler`) | Make authorization decisions themselves |
| Services    | Authorization (`requirePermission`), input validation, workflow rules, transactions, audit | Render UI |
| Repositories| Read/write the database, map rows to DTOs                           | Know about users or permissions |

---

## Authentication

`src/platform/auth` defines a small contract:

```ts
interface AuthProvider {
  readonly name: string;
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
```

The demo ships `demoAuthProvider`, which reads a `demo_user_id` cookie set by the user switcher (`POST /api/auth/switch`). Everything else in the app calls `getCurrentUser()` / `requireUser()` and never touches the cookie.

> **Demo only.** A cookie anyone can set is not authentication. In production, implement `AuthProvider` against your IdP (Okta, Auth0, Entra ID via OIDC — e.g. NextAuth/Auth.js or the vendor SDK), map IdP groups to roles, delete the switcher route, and change `getAuthProvider()` in `session.ts`. No module code changes.
>
> As a safety net, the demo provider and the `/api/auth/switch` route are **automatically disabled when `NODE_ENV=production`** unless `DEMO_AUTH="true"` is set explicitly — an accident or a forgotten build can't silently ship password-less admin access. API mutations also require a same-site `Origin` (CSRF defence for cookie-based sessions) and the demo cookie is `Secure` in production.

## Authorization (RBAC)

Defined once in `src/platform/rbac/permissions.ts`:

| Permission     | Support Agent | Compliance Analyst | Compliance Manager | Admin |
| -------------- | :-----------: | :----------------: | :----------------: | :---: |
| `customer:view`| ✓             | ✓                  | ✓                  | ✓     |
| `kyc:view`     | ✓             | ✓                  | ✓                  | ✓     |
| `kyc:approve`  |               | ✓                  | ✓                  | ✓     |
| `kyc:reject`   |               | ✓                  | ✓                  | ✓     |
| `kyc:escalate` |               | ✓                  | ✓                  | ✓     |
| `kyc:approve_rejection` |    |                    | ✓                  | ✓     |
| `refund:view`  | ✓             | ✓                  | ✓                  | ✓     |
| `refund:approve` |            | ✓                  | ✓                  | ✓     |
| `audit:view`   |               | ✓                  | ✓                  | ✓     |
| `admin:manage` |               |                    |                    | ✓     |

- **Server side is authoritative.** Every service function starts with `requirePermission(actor, permission)`, which throws `ForbiddenError` (HTTP 403). This runs no matter how the request arrives — UI, `curl`, or a script.
- Denied privileged mutations are themselves audited as `ACCESS_DENIED`.
- **UI checks are UX only.** `<PermissionGate>`, `useCan()` and the permission-aware sidebar hide controls the user can't use. The case page includes a "Security demo: bypass the UI" panel for users without approval rights to prove that hiding a button is not the security boundary.

## Audit logging

`src/platform/audit` is resource-agnostic. A record is:

```ts
{
  id, timestamp,
  actorId, actorName, actorRole,
  action,              // e.g. KYC_APPROVED, REFUND_APPROVED, FEATURE_FLAG_CHANGED
  resourceType,        // e.g. KYC_CASE, REFUND, FEATURE_FLAG
  resourceId,
  previousState, newState,   // JSON snapshots
  metadata                   // JSON: comment, customer ID, risk score, ...
}
```

Guarantees:

1. **Atomic with the change.** Services write the business change and its audit event inside one `runInTransaction` — both commit or neither does.
2. **Append-only in code.** The audit repository exposes `insert` and queries only; there is no update or delete function.
3. **Append-only in the database.** The migration installs `BEFORE UPDATE` / `BEFORE DELETE` triggers on `AuditEvent` that abort. `tests/kyc-service.test.ts` verifies that even raw SQL can't modify history.
4. **Concurrency-safe.** Cases carry a `version`; a decision on a stale version fails with 409 instead of silently overwriting another analyst's decision.

Views: per-case history on the review page (`AuditTimeline`) and a global, filterable log at `/audit` (requires `audit:view`).

## Database

Prisma models (`prisma/schema.prisma`):

- `User` — id, name, email, role
- `Customer` — identity, country, DOB, account creation date
- `KycCase` — status, risk score/level, reason flagged, verification results (identity, document, address, sanctions, PEP), assigned analyst, decision fields, `version`
- `RiskFactor` — label, weight, description per case
- `AuditEvent` — see above

The demo uses **SQLite** so it runs with zero setup. To move to **PostgreSQL**:

1. Change `provider = "sqlite"` to `"postgresql"` and set `DATABASE_URL`.
2. Optionally promote enum-like `String` columns to Prisma `enum`s and audit `String` JSON columns to `Json` (the repositories already convert at the boundary, so callers don't change).
3. Regenerate the migration (`prisma migrate dev`) and port the immutability triggers to PL/pgSQL — or, better, revoke `UPDATE`/`DELETE` on `AuditEvent` from the application role.

Only `platform/database` and the repositories know Prisma exists.

## Testing

```bash
npm test
```

The test setup creates `prisma/test.db`, migrates and seeds it, then runs:

| Suite                         | Covers |
| ----------------------------- | ------ |
| `tests/rbac.test.ts`          | Role → permission mapping; admin has everything |
| `tests/kyc-service.test.ts`   | Support Agent can view but not approve/reject/escalate; Analyst can approve and reject; comment rules; invalid transitions; stale-version conflict; audit event written with the change; audit rows immutable at the DB level |
| `tests/refund-service.test.ts` | Refund action gated by `refund:approve`; `REFUND_APPROVED` audit event; invalid/duplicate refund handling |
| `tests/secondary-approval.test.ts` | HIGH-risk `REJECT` files a request (`KYC_REJECTION_REQUESTED`, `PENDING_SECONDARY_APPROVAL`); manager approve → `REJECTED` / deny → prior status; requester can't self-approve; LOW/MEDIUM unchanged |
| `tests/api-authorization.test.ts` | Calls the real route handlers as each user: unauthorized mutation → 403 + `ACCESS_DENIED` audit; unauthorized audit-log read → 403; authorized mutation → 200; invalid payload → 400 |

## Adding another application

This is the pay-off of the platform split. Refund Operations — a real second tool, ~600 lines in `src/modules/refunds/` plus routes and tests — was added without touching the KYC module. The same checklist applies to tool #3, #4, …

What you **reuse unchanged**: SSO/auth, RBAC engine and guards, audit recorder and the global audit log, transactions, app shell + navigation, DataTable / filters / badges / confirmation dialog / audit timeline, API error handling, test harness.

What you **write** (six steps):

| Step | Work | Typical effort |
| ---- | ---- | -------------- |
| 1. Permissions | Add `refund:view`, `refund:approve` to `permissions.ts` and map them to roles | Minutes |
| 2. Schema | A `Refund`/`Transaction` model + migration | Minutes |
| 3. Module | `src/modules/refunds/` — `types`, `repository`, `services` (call `requirePermission` and `recordAuditEvent` with `resourceType: "REFUND"`, `action: "REFUND_APPROVED"`), `components`, `module.ts` | The bulk of the work — business logic only |
| 4. Routes | `src/app/refunds/...` pages and `src/app/api/refunds/...` handlers using `withApiHandler` | Mostly mechanical — follows the KYC pattern |
| 5. Register | Add `refundsModule` to `TOOL_MODULES` in `src/app/tool-registry.ts`. Navigation, permission-gated links and audit log filters pick it up automatically | One line |
| 6. Tests | Copy the authorization suite pattern | Small — the harness is shared |

**Estimated effort for a comparable tool** (list → details → one audited action):

- With an AI engineer like Devin: **one session** — a single working session (~1–2 hours elapsed) produced the Refund Operations module, routes, seed data and tests in this repo, ready for human review.
- Hand-written: roughly **1–2 engineering days**, almost all of it step 3–4 — the platform pieces (auth, RBAC, audit, shell, components) cost nothing per app.
- What scales is steps 1–6; what doesn't scale is platform work, and it's already done.

## Demo limitations and production changes

| Area          | Demo                                   | Production |
| ------------- | -------------------------------------- | ---------- |
| Authentication| Cookie-based user switcher             | OIDC/SAML via company IdP; short-lived sessions; group → role mapping |
| Database      | SQLite file, triggers for immutability | Managed PostgreSQL; DB role without UPDATE/DELETE on audit; backups/PITR |
| CSRF          | Same-site `Origin` check on mutations + `SameSite=Lax` cookie | SameSite=Strict or token-based CSRF for high-sensitivity tools |
| Audit         | Same database as app data              | Additionally stream to WORM storage / SIEM; retention policy |
| Data          | 20 fictional customers                 | Real screening feed (webhook/queue) creating cases |
| Assignment    | Pre-seeded analysts                    | Claim/assign workflow, SLAs, four-eyes approval for high risk |
| Ops           | `npm run dev`                          | CI (lint/typecheck/test/build), container image, secrets manager, observability, rate limiting, CSRF protection for mutations |

All customer data in this repository is fictional.


## What's new in this version

- **Refund Operations (`/refunds`)** — a second internal tool built entirely on the shared platform: transaction search, details, a refund action gated by `refund:approve`, and `REFUND_APPROVED` audit events. The KYC module was not modified to add it.
- **Two-step rejection for HIGH-risk cases** — a `REJECT` on a HIGH-risk case files a request (`PENDING_SECONDARY_APPROVAL`, audited as `KYC_REJECTION_REQUESTED`); a Compliance Manager (Carol) approves (`KYC_REJECTION_APPROVED` → `REJECTED`) or denies (`KYC_REJECTION_DENIED` → prior status). Requesters cannot approve their own requests. LOW/MEDIUM rejections are unchanged.
- **`/production-readiness`** — an honest split between what the prototype demonstrates and the platform ownership responsibilities that remain for production.
- **CI** — `.github/workflows/ci.yml` runs install, Prisma generate, lint, typecheck, tests and a production build on every push/PR.
