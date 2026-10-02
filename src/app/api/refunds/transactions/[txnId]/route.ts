import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { getTransaction } from "@/modules/refunds/services/refund-service";
import { requireUser } from "@/platform/auth/session";

export const GET = withApiHandler(async (_request: Request, context: { params: Promise<{ txnId: string }> }) => {
  const actor = await requireUser();
  const { txnId } = await context.params;
  return NextResponse.json({ transaction: await getTransaction(actor, txnId) });
});
