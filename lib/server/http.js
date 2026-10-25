import "server-only";
import { NextResponse } from "next/server";

/** Business-rule error that maps to a stable `code` and HTTP status in the envelope. */
export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Envelope used across the workspace: { status: 'success'|'error', message, data, meta? }
export function ok(data = null, { message = "OK", meta, status = 200 } = {}) {
  const body = { status: "success", message, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function fail(code, message, status = 400) {
  return NextResponse.json({ status: "error", code, message, data: null }, { status });
}

/** Wraps a route handler: maps AppError to the envelope and hides unexpected errors. */
export function handler(run) {
  return async (request, context) => {
    try {
      return await run(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error.code, error.message, error.status);
      }
      console.error("Unhandled route error:", error);
      return fail("INTERNAL_ERROR", "Terjadi kesalahan pada server.", 500);
    }
  };
}
