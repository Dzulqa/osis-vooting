import { prisma } from "@/lib/server/db";
import { AppError, handler, ok } from "@/lib/server/http";
import { COMMITTEE_ROLES, hashPassword, requireSuperadmin, validatePassword } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

async function findMember(id) {
  const user = await prisma.user.findFirst({
    where: { id: Number(id), staffRole: { in: COMMITTEE_ROLES }, isSuperadmin: false },
  });
  if (!user) throw new AppError("NOT_FOUND", "Panitia tidak ditemukan.", 404);
  return user;
}

export const DELETE = handler(async (_request, { params }) => {
  await requireSuperadmin();
  const user = await findMember((await params).id);
  await prisma.user.delete({ where: { id: user.id } });
  return ok(null, { message: "Panitia dihapus" });
});

// Reset a committee member's password
export const PATCH = handler(async (request, { params }) => {
  await requireSuperadmin();
  const user = await findMember((await params).id);
  const body = await request.json().catch(() => ({}));
  validatePassword(body.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.password), failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  return ok(null, { message: "Password diperbarui" });
});
