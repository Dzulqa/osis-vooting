import { AppError, handler, ok } from "@/lib/server/http";
import { requireSuperadmin } from "@/lib/server/auth";
import { clearVotes } from "@/lib/server/state";

export const dynamic = "force-dynamic";

// Kosongkan suara (mis. setelah simulasi). Superadmin saja, dengan konfirmasi ketik "KOSONGKAN".
export const POST = handler(async (request) => {
  const principal = await requireSuperadmin();
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "KOSONGKAN") {
    throw new AppError("CONFIRMATION_REQUIRED", 'Ketik "KOSONGKAN" untuk mengonfirmasi.', 400);
  }

  const result = await clearVotes({ principal });
  return ok(result, { message: `${result.cleared.votes} suara dikosongkan.` });
});
