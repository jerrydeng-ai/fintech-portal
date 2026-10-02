import { NextResponse } from "next/server";
import { AppError } from "./errors";

export type ApiErrorBody = { error: { code: string; message: string } };

/** Wraps a route handler so domain errors become consistent JSON responses. */
export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
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
