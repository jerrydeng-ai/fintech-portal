import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { listCases, parseCaseQuery } from "@/modules/kyc/services/kyc-service";
import { requireUser } from "@/platform/auth/session";

export const GET = withApiHandler(async (request: Request) => {
  const actor = await requireUser();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json({ cases: await listCases(actor, parseCaseQuery(params)) });
});
