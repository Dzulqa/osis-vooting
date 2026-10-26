import { handler, ok } from "@/lib/server/http";
import { getPrincipal } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// What the browser is currently allowed to be: staff, a paired booth, or a public visitor.
export const GET = handler(async () => {
  const principal = await getPrincipal();
  if (!principal) return ok({ principal: null });
  if (principal.type === "booth") return ok({ principal: { type: "booth", boothId: principal.boothId } });
  return ok({
    principal: { type: "staff", username: principal.username, name: principal.name, role: principal.role },
  });
});
