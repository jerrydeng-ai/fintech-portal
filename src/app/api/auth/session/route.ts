import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api";
import { UnauthenticatedError } from "@/lib/errors";
import { getSession } from "@/platform/auth/session";

export const GET = withApiHandler(async () => {
  const session = await getSession();
  if (!session) throw new UnauthenticatedError();
  return NextResponse.json(session);
});
