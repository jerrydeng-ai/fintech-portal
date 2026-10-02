import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { listTransactions, parseTransactionQuery } from "@/modules/refunds/services/refund-service";
import { requireUser } from "@/platform/auth/session";

export const GET = withApiHandler(async (request: Request) => {
  const actor = await requireUser();
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const transactions = await listTransactions(actor, parseTransactionQuery(params));
  return NextResponse.json({ transactions });
});
