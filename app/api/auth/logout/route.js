import { handler, ok } from "@/lib/server/http";
import { endStaffSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  await endStaffSession();
  return ok();
});
