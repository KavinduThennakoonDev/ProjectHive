import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";
import { getCurrentAdmin } from "@/lib/auth/session";
import type { AdminDTO } from "@/lib/types";
import { isObjectId, toFieldErrors } from "@/lib/validation/common";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function jsonError(status: number, message: string, fieldErrors?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: { message, fieldErrors } }, { status });
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "The request body must be valid JSON.");
  }
}

/** Reads and checks the `[id]` route parameter. Unknown formats are treated as not found. */
export async function readId(context: { params: Promise<{ id: string }> }, label: string): Promise<string> {
  const { id } = await context.params;
  if (!isObjectId(id)) throw new ApiError(404, `${label} not found.`);
  return id;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.message, error.fieldErrors);
  }
  if (error instanceof ZodError) {
    return jsonError(422, "Please check the highlighted fields.", toFieldErrors(error));
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return jsonError(404, "The record was not found.");
    if (error.code === "P2002") return jsonError(409, "A record with these details already exists.");
  }
  console.error("[api] Unexpected error:", error);
  return jsonError(500, "Something went wrong. Please try again.");
}

type Handler<C> = (request: NextRequest, context: C, admin: AdminDTO) => Promise<NextResponse>;

/** Wraps a route handler: requires a logged-in admin and converts thrown errors to JSON. */
export function withAuth<C = unknown>(handler: Handler<C>) {
  return async (request: NextRequest, context: C): Promise<NextResponse> => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) return jsonError(401, "Please log in to continue.");
      return await handler(request, context, admin);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/** Wraps a public route handler (login) with the same error handling. */
export function withErrorHandling<C = unknown>(handler: (request: NextRequest, context: C) => Promise<NextResponse>) {
  return async (request: NextRequest, context: C): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
