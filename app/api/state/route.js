import { AppError, handler, ok } from "@/lib/server/http";
import { getPrincipal } from "@/lib/server/auth";
import { applyEntryOp, canWrite, readEntries, setEntry } from "@/lib/server/state";

export const dynamic = "force-dynamic";

// Everything this caller may read, optionally only what changed since `since` (ISO time).
export const GET = handler(async (request) => {
  const principal = await getPrincipal();
  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  if (since && Number.isNaN(since.getTime())) throw new AppError("INVALID_SINCE", "Parameter since tidak valid.", 400);

  const entries = await readEntries(principal, since);
  return ok({ serverTime: new Date().toISOString(), entries, principal: principal?.type ?? null });
});

// Body: { key, value }                    replace the value (JSON text)
//       { key, op: { type, ... } }        atomic append / remove / patch on a list
export const POST = handler(async (request) => {
  const principal = await getPrincipal();
  if (!principal) throw new AppError("UNAUTHENTICATED", "Silakan login terlebih dahulu.", 401);

  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  const userId = principal.type === "staff" ? principal.userId : null;

  if (body.op) {
    if (!canWrite(principal, key, body.op.type, body.op)) {
      throw new AppError("FORBIDDEN", "Anda tidak berhak mengubah data ini.", 403);
    }
    return ok(await applyEntryOp(key, body.op, userId));
  }

  if (!canWrite(principal, key, "set")) {
    throw new AppError("FORBIDDEN", "Anda tidak berhak mengubah data ini.", 403);
  }
  return ok(await setEntry(key, body.value, userId));
});
