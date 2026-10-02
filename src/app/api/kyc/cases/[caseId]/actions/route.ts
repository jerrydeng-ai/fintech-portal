import { NextResponse } from "next/server";
import { readJsonBody, withApiHandler } from "@/lib/api";
import { performReviewAction } from "@/modules/kyc/services/kyc-service";
import { requireUser } from "@/platform/auth/session";

/** POST { action: "APPROVE" | "REJECT" | "ESCALATE", comment?: string, expectedVersion?: number } */
export const POST = withApiHandler(async (request: Request, context: { params: Promise<{ caseId: string }> }) => {
  const actor = await requireUser();
  const { caseId } = await context.params;
  const result = await performReviewAction(actor, caseId, await readJsonBody(request));
  return NextResponse.json(result);
});
