import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_USER_COOKIE } from "@/platform/auth/demo-users";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));

const { POST } = await import("@/app/api/kyc/cases/[caseId]/actions/route");
const { GET: getAuditLog } = await import("@/app/api/audit/route");

function actAs(userId: string) {
  cookieJar.set(DEMO_USER_COOKIE, userId);
}

function postAction(caseId: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/kyc/cases/${caseId}/actions`, { method: "POST", body: JSON.stringify(body) }),
    { params: Promise.resolve({ caseId }) },
  );
}

describe("API authorization (bypassing the UI)", () => {
  beforeEach(() => cookieJar.clear());

  it("Unauthorized API mutation rejected with 403", async () => {
    actAs("usr_bob");
    const response = await postAction("KYC-2013", { action: "APPROVE" });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("rejects unauthorized access to the global audit log", async () => {
    actAs("usr_bob");
    const response = await getAuditLog(new Request("http://localhost/api/audit"));
    expect(response.status).toBe(403);
  });

  it("accepts the same mutation from a Compliance Analyst", async () => {
    actAs("usr_alice");
    const response = await postAction("KYC-2013", { action: "APPROVE" });
    expect(response.status).toBe(200);
    expect((await response.json()).case.status).toBe("APPROVED");
  });

  it("rejects mutations carrying a cross-site Origin header", async () => {
    actAs("usr_alice");
    const response = await POST(
      new Request("http://localhost/api/kyc/cases/KYC-2016/actions", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
        body: JSON.stringify({ action: "APPROVE" }),
      }),
      { params: Promise.resolve({ caseId: "KYC-2016" }) },
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("returns 400 for invalid payloads", async () => {
    actAs("usr_alice");
    const response = await postAction("KYC-2015", { action: "DELETE_EVERYTHING" });
    expect(response.status).toBe(400);
  });
});
