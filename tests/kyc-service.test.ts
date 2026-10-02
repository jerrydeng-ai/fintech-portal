import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, ValidationError } from "@/lib/errors";
import { getCase, getCaseHistory, listCases, parseCaseQuery, performReviewAction } from "@/modules/kyc/services/kyc-service";
import { listAuditLog } from "@/platform/audit/audit-service";
import { prisma } from "@/platform/database/client";
import { alice, bob, carol } from "./helpers";

describe("KYC service authorization", () => {
  it("Support Agent can view KYC cases", async () => {
    const cases = await listCases(bob, {});
    expect(cases).toHaveLength(20);
    const detail = await getCase(bob, "KYC-2001");
    expect(detail.customerId).toBe("CUST-10231");
  });

  it("Support Agent cannot approve; case is unchanged and the denial is audited", async () => {
    await expect(performReviewAction(bob, "KYC-2004", { action: "APPROVE" })).rejects.toBeInstanceOf(ForbiddenError);
    expect((await getCase(alice, "KYC-2004")).status).toBe("PENDING");
    const history = await getCaseHistory(alice, "KYC-2004");
    expect(history[0]).toMatchObject({ action: "ACCESS_DENIED", userId: bob.id, metadata: { requiredPermission: "kyc:approve" } });
  });

  it("Support Agent cannot read the global audit log", async () => {
    await expect(listAuditLog(bob)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Compliance Analyst can approve KYC and an audit event is created atomically", async () => {
    const result = await performReviewAction(alice, "KYC-2001", { action: "APPROVE", comment: "Docs verified" });
    expect(result.case.status).toBe("APPROVED");
    expect(result.case.assignedAnalystName).toBe("Alice");

    const history = await getCaseHistory(alice, "KYC-2001");
    expect(history[0]).toMatchObject({
      action: "KYC_APPROVED",
      userId: alice.id,
      userName: "Alice",
      resourceType: "KYC_CASE",
      resourceId: "KYC-2001",
      previousState: { status: "PENDING" },
      newState: { status: "APPROVED" },
      metadata: { customerId: "CUST-10231", comment: "Docs verified" },
    });
  });

  it("Compliance Analyst can reject KYC, but only with a comment", async () => {
    await expect(performReviewAction(alice, "KYC-2005", { action: "REJECT" })).rejects.toBeInstanceOf(ValidationError);
    const result = await performReviewAction(alice, "KYC-2005", { action: "REJECT", comment: "Fraudulent document" });
    expect(result.case.status).toBe("REJECTED");
  });

  it("Admin can escalate", async () => {
    const result = await performReviewAction(carol, "KYC-2007", { action: "ESCALATE", comment: "Needs MLRO review" });
    expect(result.case.status).toBe("ESCALATED");
  });

  it("rejects invalid workflow transitions and stale versions without writing audit events", async () => {
    const before = await prisma.auditEvent.count();
    await expect(performReviewAction(alice, "KYC-2008", { action: "REJECT", comment: "x" })).rejects.toBeInstanceOf(ConflictError);
    await expect(
      performReviewAction(alice, "KYC-2010", { action: "APPROVE", expectedVersion: 99 }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await prisma.auditEvent.count()).toBe(before);
  });
});

describe("Queue filtering and audit pagination", () => {
  it("status=OPEN returns only open cases", async () => {
    const cases = await listCases(alice, parseCaseQuery({ status: "OPEN", riskLevel: "HIGH" }));
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.every((c) => ["PENDING", "IN_REVIEW", "ESCALATED", "PENDING_SECONDARY_APPROVAL"].includes(c.status))).toBe(true);
    expect(cases.every((c) => c.riskLevel === "HIGH")).toBe(true);
    const closed = await listCases(alice, parseCaseQuery({ status: "OPEN" }));
    expect(closed.some((c) => c.status === "APPROVED" || c.status === "REJECTED")).toBe(false);
  });

  it("audit log returns a total alongside each page", async () => {
    const { events, total } = await listAuditLog(alice, { limit: 3 });
    expect(events).toHaveLength(3);
    expect(total).toBeGreaterThan(3);
    const page2 = await listAuditLog(alice, { limit: 3, offset: 3 });
    expect(page2.events[0].eventId).not.toBe(events[0].eventId);
    expect(page2.total).toBe(total);
  });
});

describe("Audit trail immutability", () => {
  it("database rejects updates and deletes of audit events", async () => {
    const event = await prisma.auditEvent.findFirstOrThrow();
    await expect(prisma.auditEvent.update({ where: { id: event.id }, data: { action: "TAMPERED" } })).rejects.toThrow();
    await expect(prisma.auditEvent.delete({ where: { id: event.id } })).rejects.toThrow();
    await expect(prisma.$executeRaw`DELETE FROM "AuditEvent"`).rejects.toThrow();
    expect(await prisma.auditEvent.findUniqueOrThrow({ where: { id: event.id } })).toEqual(event);
  });
});
