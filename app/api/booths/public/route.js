import { handler, ok } from "@/lib/server/http";
import { getCurrentBooths } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// Booth numbers only (no access codes), so the booth login screen works before anyone is signed in.
export const GET = handler(async () => {
  const { booths } = await getCurrentBooths();
  return ok({ booths: booths.map((b) => ({ id: b.id })) });
});
