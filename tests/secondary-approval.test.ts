import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { getCase, getCaseHistory, performReviewAction } from "@/modules/kyc/services/kyc-service";
import { alice, carol } from "./helpers";

// Seed map used here: KYC-2018 LOW PENDING, KYC-2017 MEDIUM PENDING, KYC-2015/2019 HIGH PENDING,
// KYC-2002 HIGH IN_REVIEW, KYC-2009 HIGH ESCALATED, KYC-2011 MEDIUM IN_REVIEW — none are mutated by other test files.

describe("LOW/MEDIUM-risk rejection is unchanged", () => {
  it("LOW-risk rejection closes immediately", async () => {
    const result = await performReviewAction(alice, "KYC-2018", { action: "REJECT", comment: "Expired document" });
    expect(result.case.status).toBe("REJECTED");
    expect(result.case.pending).toBeNull();
    expect(result.auditEvent.action).toBe("KYC_REJECTED");
  });

  it("MEDIUM-risk rejection closes immediately", async () => {
    const result = await performReviewAction(alice, "KYC-2017", { action: "REJECT", comment: "Low quality ID" });
    expect(result.case.status).toBe("REJECTED");
    expect(result.case.pending).toBeNull();
    expect(result.auditEvent.action).toBe("KYC_REJECTED");
  });
});

describe("HIGH-risk rejection requires secondary approval", () => {
  it("analyst files a request instead of rejecting", async () => {
    const result = await performReviewAction(alice, "KYC-2015", { action: "REJECT", comment: "Address mismatch requires additional verification." });
    expect(result.case.status).toBe("PENDING_SECONDARY_APPROVAL");
    expect(result.case.pending).toMatchObject({ action: "REJECT", byId: alice.id, byName: "Alice", fromStatus: "PENDING" });
    expect(result.auditEvent.action).toBe("KYC_REJECTION_REQUESTED");
  });

  it("analyst cannot self-approve their own rejection request", async () => {
    await performReviewAction(alice, "KYC-2019", { action: "REJECT", comment: "Sanctions fuzzy match" });
    await expect(performReviewAction(alice, "KYC-2019", { action: "APPROVE_REJECTION" })).rejects.toBeInstanceOf(ForbiddenError);
    expect((await getCase(alice, "KYC-2019")).status).toBe("PENDING_SECONDARY_APPROVAL");
  });

  it("manager can approve the rejection; audit events are recorded", async () => {
    await performReviewAction(alice, "KYC-2002", { action: "REJECT", comment: "Sanctions match" });
    const result = await performReviewAction(carol, "KYC-2002", { action: "APPROVE_REJECTION" });
    expect(result.case.status).toBe("REJECTED");
    expect(result.case.pending).toBeNull();
    expect(result.auditEvent.action).toBe("KYC_REJECTION_APPROVED");

    const history = await getCaseHistory(carol, "KYC-2002");
    expect(history.slice(0, 2).map((e) => e.action)).toEqual(["KYC_REJECTION_APPROVED", "KYC_REJECTION_REQUESTED"]);
    expect(history[0].metadata).toMatchObject({ requestedBy: "Alice" });
  });

  it("manager can deny the request and the case returns to its prior status", async () => {
    await performReviewAction(alice, "KYC-2009", { action: "REJECT", comment: "Synthetic identity" });
    const result = await performReviewAction(carol, "KYC-2009", { action: "DENY_REJECTION", comment: "Evidence is circumstantial" });
    expect(result.case.status).toBe("ESCALATED");
    expect(result.case.pending).toBeNull();
    expect(result.auditEvent.action).toBe("KYC_REJECTION_DENIED");
  });

  it("secondary-approval actions need the manager permission and a pending request", async () => {
    await expect(performReviewAction(alice, "KYC-2011", { action: "APPROVE_REJECTION" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(performReviewAction(carol, "KYC-2011", { action: "APPROVE_REJECTION" })).rejects.toBeInstanceOf(ConflictError);
  });
});
