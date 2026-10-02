# Five-minute demo script

Setup (before the demo): `npm install && npm run dev`, open http://localhost:3000.
To start from a clean slate later: `npm run db:reset`.

---

## 1. The problem (30 s)

"Compliance reviews flagged customers today in a low-code app. It works, but access control is a checkbox, the audit trail is a spreadsheet, and every new tool starts from zero. This is the same tool as real code — written with Devin — on top of a reusable platform."

## 2. Dashboard and queue — as Alice, Compliance Analyst (60 s)

1. **Dashboard**: queue stats, open high-risk cases, recent audit activity.
2. **Review Queue** (`/kyc`): 20 flagged customers.
   - Type `Sokolov` in search, clear it.
   - Filter **Risk = High**, **Status = Pending**. Note the URL updates — filters are shareable links.
   - Sort by **Risk Score**.

## 3. Review and decide (90 s)

1. Open **Marcus Ellery-Vance** (KYC-2001, score 82, Pending).
2. Walk the page: identity and KYC verification results, sanctions/PEP screening, risk score with contributing factors, audit history.
3. Click **Reject** → note the comment is required → enter "Source of funds not evidenced" → confirm.
4. Status becomes **Rejected**; a `KYC_REJECTED` event appears in the history with actor, timestamp, `PENDING → REJECTED` and the comment. The action buttons are gone — closed cases can't be re-decided.

## 4. RBAC — switch to Bob, Support Agent (60 s)

1. Switch user → **Bob**. The **Audit Log** link disappears from the sidebar.
2. Open **Hannah Okafor** (KYC-2004). Bob can see the case but has no decision buttons.
3. "Hiding a button isn't security." In the **Security demo: bypass the UI** panel click **Send request as Bob**. The server returns **403 FORBIDDEN** — the check lives in the service layer, not the UI.
4. Equivalent from a terminal:
   ```bash
   curl -X POST localhost:3000/api/kyc/cases/KYC-2004/actions \
     -H 'content-type: application/json' -b demo_user_id=usr_bob \
     -d '{"action":"APPROVE"}'
   ```

## 5. Audit trail — switch to Carol, Admin (45 s)

1. Switch to **Carol** → **Audit Log**.
2. Top rows: Bob's `ACCESS_DENIED` attempt and Alice's `KYC_REJECTED`. Filter by **Action** or **User**.
3. "Rows are append-only: the code has no update/delete path, and database triggers reject edits even with raw SQL. The decision and its audit event commit in one transaction."

## 6. The platform story (45 s)

1. Open **Architecture**. Blue = reusable platform (auth, RBAC, audit, shell, shared UI, database). Green = KYC-specific (module, services, repositories).
2. "Tool #2 — say Refund Operations — adds permissions, a model, a module folder and one line in `tool-registry.ts`. Auth, RBAC, audit, layout, tables and tests come for free."
3. Optional: show `npm test` — authorization, workflow and audit tests all passing.
