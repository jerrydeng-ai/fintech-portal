import { NextResponse } from "next/server";
import { readJsonBody, withApiHandler } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { DEMO_USER_COOKIE } from "@/platform/auth/demo-users";
import { findUserById } from "@/platform/auth/user-repository";
import { prisma } from "@/platform/database/client";

/** DEMO ONLY: password-less user switching. Remove when a real SSO provider is configured. */
export const POST = withApiHandler(async (request: Request) => {
  const body = await readJsonBody(request);
  const userId = body !== null && typeof body === "object" && "userId" in body ? body.userId : undefined;
  if (typeof userId !== "string") throw new ValidationError("userId is required");
  const user = await findUserById(prisma, userId);
  if (!user) throw new NotFoundError(`Unknown user ${userId}`);

  const response = NextResponse.json({ user });
  response.cookies.set(DEMO_USER_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
});
