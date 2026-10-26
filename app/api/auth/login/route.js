import { prisma } from "@/lib/server/db";
import { AppError, handler, ok } from "@/lib/server/http";
import { ensureBootstrap, roleOf, startStaffSession, verifyPassword } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 5;

export const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) throw new AppError("INVALID_CREDENTIALS", "Isi username dan password.", 400);

  await ensureBootstrap();

  const user = await prisma.user.findUnique({ where: { username } });
  const invalid = new AppError("INVALID_CREDENTIALS", "Username atau password salah.", 401);

  if (!user || !user.active) throw invalid;
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError("ACCOUNT_LOCKED", `Terlalu banyak percobaan. Coba lagi dalam ${LOCK_MINUTES} menit.`, 429);
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failures = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data:
        failures >= MAX_FAILURES
          ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
          : { failedLoginCount: failures },
    });
    throw invalid;
  }

  const role = roleOf(user);
  if (!role) throw new AppError("NO_ROLE", "Akun ini belum memiliki peran.", 403);

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await startStaffSession(user, request);

  return ok({
    session: { username: user.username, name: user.name, role, loggedInAt: new Date().toISOString() },
  });
});
