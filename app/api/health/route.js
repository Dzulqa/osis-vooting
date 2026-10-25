import { prisma } from "@/lib/server/db";
import { handler, ok, fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check: database unreachable:", error.message);
    return fail("DB_UNAVAILABLE", "Database tidak dapat dihubungi.", 503);
  }
  return ok({ db: "up", time: new Date().toISOString() });
});
