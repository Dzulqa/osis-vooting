import { handler, ok } from "@/lib/server/http";
import { endBoothSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  await endBoothSession();
  return ok();
});
