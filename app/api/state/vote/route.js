import { AppError, handler, ok } from "@/lib/server/http";
import { getPrincipal } from "@/lib/server/auth";
import { castVote } from "@/lib/server/state";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const principal = await getPrincipal();
  const allowed = principal && (principal.type === "booth" || principal.role === "superadmin");
  if (!allowed) throw new AppError("FORBIDDEN", "Hanya perangkat bilik yang dapat mencatat suara.", 403);

  const body = await request.json().catch(() => ({}));
  const vote = await castVote({
    principal,
    candidateId: body.candidateId,
    studentId: body.studentId,
    boothId: body.boothId,
  });
  return ok({ vote }, { status: 201 });
});
