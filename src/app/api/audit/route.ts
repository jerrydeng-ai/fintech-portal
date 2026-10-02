import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { listAuditLog } from "@/platform/audit/audit-service";
import { requireUser } from "@/platform/auth/session";

export const GET = withApiHandler(async (request: Request) => {
  const actor = await requireUser();
  const params = new URL(request.url).searchParams;
  const events = await listAuditLog(actor, {
    action: params.get("action") ?? undefined,
    resourceType: params.get("resourceType") ?? undefined,
    userId: params.get("userId") ?? undefined,
    limit: Math.min(Number(params.get("limit")) || 200, 500),
  });
  return NextResponse.json({ events });
});
