import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { getCase } from "@/modules/kyc/services/kyc-service";
import { requireUser } from "@/platform/auth/session";

export const GET = withApiHandler(async (_request: Request, context: { params: Promise<{ caseId: string }> }) => {
  const actor = await requireUser();
  const { caseId } = await context.params;
  return NextResponse.json({ case: await getCase(actor, caseId) });
});
