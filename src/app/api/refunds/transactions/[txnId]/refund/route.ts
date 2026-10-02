import { NextResponse } from "next/server";
import { readJsonBody, withApiHandler } from "@/lib/api";
import { refundTransaction } from "@/modules/refunds/services/refund-service";
import { requireUser } from "@/platform/auth/session";

/** POST { comment: string } — issue a full refund. Requires refund:approve. */
export const POST = withApiHandler(async (request: Request, context: { params: Promise<{ txnId: string }> }) => {
  const actor = await requireUser();
  const { txnId } = await context.params;
  const result = await refundTransaction(actor, txnId, await readJsonBody(request));
  return NextResponse.json(result);
});
