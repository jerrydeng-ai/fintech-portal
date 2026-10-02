import { describe, expect, it } from "vitest";
import { PERMISSIONS, hasPermission } from "@/platform/rbac/permissions";
import { alice, bob, carol } from "./helpers";

describe("RBAC role → permission mapping", () => {
  it("Support Agent can view KYC cases but not take decisions or view audit", () => {
    expect(hasPermission(bob, "kyc:view")).toBe(true);
    expect(hasPermission(bob, "customer:view")).toBe(true);
    for (const p of ["kyc:approve", "kyc:reject", "kyc:escalate", "audit:view", "admin:manage"] as const) {
      expect(hasPermission(bob, p)).toBe(false);
    }
  });

  it("Compliance Analyst can review, decide and view audit but not administer", () => {
    for (const p of ["kyc:view", "kyc:approve", "kyc:reject", "kyc:escalate", "audit:view"] as const) {
      expect(hasPermission(alice, p)).toBe(true);
    }
    expect(hasPermission(alice, "admin:manage")).toBe(false);
  });

  it("Admin has all permissions", () => {
    for (const p of PERMISSIONS) expect(hasPermission(carol, p)).toBe(true);
  });
});
