import { prisma } from "@/lib/server/db";
import { AppError, handler, ok } from "@/lib/server/http";
import { COMMITTEE_ROLES, hashPassword, requireSuperadmin, validatePassword } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const label = (role) => role.charAt(0) + role.slice(1).toLowerCase(); // REGISTRATOR -> Registrator

function toMember(user) {
  return { id: String(user.id), nama: user.name, username: user.username, role: label(user.staffRole) };
}

export const GET = handler(async () => {
  await requireSuperadmin();
  const users = await prisma.user.findMany({
    where: { staffRole: { in: COMMITTEE_ROLES }, isSuperadmin: false },
    orderBy: { createdAt: "asc" },
  });
  return ok({ members: users.map(toMember) });
});

export const POST = handler(async (request) => {
  await requireSuperadmin();
  const body = await request.json().catch(() => ({}));

  const name = String(body.nama || "").trim();
  const username = String(body.username || "").trim().toLowerCase();
  const role = String(body.role || "").toUpperCase();
  if (!name) throw new AppError("INVALID_NAME", "Nama panitia wajib diisi.", 400);
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
    throw new AppError("INVALID_USERNAME", "Username 3-64 karakter: huruf, angka, titik, minus, garis bawah.", 400);
  }
  if (!COMMITTEE_ROLES.includes(role)) throw new AppError("INVALID_ROLE", "Peran tidak valid.", 400);
  validatePassword(body.password);

  if (await prisma.user.findUnique({ where: { username } })) {
    throw new AppError("USERNAME_TAKEN", "Username sudah digunakan.", 409);
  }

  const user = await prisma.user.create({
    data: {
      username,
      name,
      staffRole: role,
      passwordHash: await hashPassword(body.password),
      mustChangePassword: false,
    },
  });
  return ok({ member: toMember(user) }, { status: 201, message: "Panitia ditambahkan" });
});
