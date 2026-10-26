import { prisma } from "@/lib/server/db";
import { handler, ok } from "@/lib/server/http";
import { requireSuperadmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// The two fixed accounts: Superadmin and Ketua OSIS (passwords are never returned).
export const GET = handler(async () => {
  await requireSuperadmin();
  const [superadmin, ketua] = await Promise.all([
    prisma.user.findFirst({ where: { isSuperadmin: true }, orderBy: { id: "asc" } }),
    prisma.user.findFirst({ where: { staffRole: "KETUA", isSuperadmin: false }, orderBy: { id: "asc" } }),
  ]);
  const pick = (u) => (u ? { username: u.username, name: u.name } : null);
  return ok({ superadmin: pick(superadmin), ketua: pick(ketua) });
});
