import { prisma } from "@/lib/server/db";
import { AppError, handler, ok } from "@/lib/server/http";
import { hashPassword, requireSuperadmin, validatePassword } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// Change username and/or password of the superadmin or the ketua account. Blank password = keep.
export const PATCH = handler(async (request, { params }) => {
  await requireSuperadmin();
  const { who } = await params;
  if (!["superadmin", "ketua"].includes(who)) throw new AppError("NOT_FOUND", "Akun tidak dikenal.", 404);

  const user = await prisma.user.findFirst(
    who === "superadmin"
      ? { where: { isSuperadmin: true }, orderBy: { id: "asc" } }
      : { where: { staffRole: "KETUA", isSuperadmin: false }, orderBy: { id: "asc" } }
  );
  if (!user) throw new AppError("NOT_FOUND", "Akun belum dibuat.", 404);

  const body = await request.json().catch(() => ({}));
  const data = {};

  const username = String(body.username || "").trim().toLowerCase();
  if (username && username !== user.username) {
    if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
      throw new AppError("INVALID_USERNAME", "Username 3-64 karakter: huruf, angka, titik, minus, garis bawah.", 400);
    }
    if (await prisma.user.findUnique({ where: { username } })) {
      throw new AppError("USERNAME_TAKEN", "Username sudah digunakan.", 409);
    }
    data.username = username;
  }

  if (body.password) {
    validatePassword(body.password);
    data.passwordHash = await hashPassword(body.password);
    data.failedLoginCount = 0;
    data.lockedUntil = null;
  }

  if (Object.keys(data).length === 0) return ok(null, { message: "Tidak ada perubahan" });

  await prisma.user.update({ where: { id: user.id }, data });
  if (data.passwordHash) {
    await prisma.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  return ok({ username: data.username || user.username }, { message: "Akun diperbarui" });
});
