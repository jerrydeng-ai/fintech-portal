import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, ValidationError } from "@/lib/errors";
import {
  getTransactionHistory,
  listTransactions,
  parseTransactionQuery,
  refundTransaction,
} from "@/modules/refunds/services/refund-service";
import { alice, bob, carol } from "./helpers";

describe("Refund Operations service", () => {
  it("lists transactions for users with refund:view", async () => {
    const txns = await listTransactions(bob, {});
    expect(txns.length).toBeGreaterThan(0);
    const settled = await listTransactions(alice, parseTransactionQuery({ status: "SETTLED" }));
    expect(settled.every((t) => t.status === "SETTLED")).toBe(true);
  });

  it("issues a refund and writes the audit event atomically", async () => {
    const result = await refundTransaction(alice, "TXN-9001", { comment: "Customer disputed the charge" });
    expect(result.transaction.status).toBe("REFUNDED");
    expect(result.transaction.refundedByName).toBe("Alice");
    expect(result.auditEvent).toMatchObject({
      action: "REFUND_APPROVED",
      resourceType: "TRANSACTION",
      resourceId: "TXN-9001",
      metadata: { amountCents: 12500, comment: "Customer disputed the charge" },
    });
    const history = await getTransactionHistory(carol, "TXN-9001");
    expect(history[0].action).toBe("REFUND_APPROVED");
  });

  it("requires a comment", async () => {
    await expect(refundTransaction(alice, "TXN-9002", { comment: "" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a second refund on an already-refunded transaction", async () => {
    await expect(refundTransaction(alice, "TXN-9006", { comment: "again" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("Support Agent cannot issue refunds; the denial is audited", async () => {
    await expect(refundTransaction(bob, "TXN-9002", { comment: "try" })).rejects.toBeInstanceOf(ForbiddenError);
    const history = await getTransactionHistory(carol, "TXN-9002");
    expect(history[0]).toMatchObject({ action: "ACCESS_DENIED", metadata: { requiredPermission: "refund:approve" } });
  });
});
