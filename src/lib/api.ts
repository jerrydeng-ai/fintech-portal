import { NextResponse } from "next/server";
import { AppError } from "./errors";

export type ApiErrorBody = { error: { code: string; message: string } };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** CSRF defence for cookie-authenticated mutations: an Origin header that doesn't match the host is rejected. */
function isCrossSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false; // same-origin browser requests may omit Origin
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

/** Wraps a route handler so domain errors become consistent JSON responses. */
export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    const request = args[0];
    if (request instanceof Request && !SAFE_METHODS.has(request.method) && isCrossSite(request)) {
      return NextResponse.json<ApiErrorBody>(
        { error: { code: "FORBIDDEN", message: "Cross-site requests are not allowed" } },
        { status: 403 },
      );
    }
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json<ApiErrorBody>(
          { error: { code: error.code, message: error.message } },
          { status: error.status },
        );
      }
      console.error(error);
      return NextResponse.json<ApiErrorBody>(
        { error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } },
        { status: 500 },
      );
    }
  };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
