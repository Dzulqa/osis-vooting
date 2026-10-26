import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";
import { AppError } from "@/lib/server/http";

export const STAFF_COOKIE = "suara_session";
export const BOOTH_COOKIE = "suara_booth";

const STAFF_ROLES = ["KETUA", "REGISTRATOR", "CALLER", "SAKSI"];
export const COMMITTEE_ROLES = ["REGISTRATOR", "CALLER", "SAKSI"];

// ------------------------------------------------------------------ passwords

export function hashPassword(password) {
  return hash(password);
}

export async function verifyPassword(passwordHash, password) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("WEAK_PASSWORD", "Password minimal 8 karakter.", 400);
  }
  if (password.length > 128) throw new AppError("WEAK_PASSWORD", "Password terlalu panjang.", 400);
}

// ------------------------------------------------------------------ secrets

let cachedSecret;

/** HMAC key for booth tokens. SESSION_SECRET if set; otherwise generated once and kept in the database. */
async function getSecret() {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return (cachedSecret = fromEnv);

  const KEY = "__secret";
  await prisma.stateEntry.createMany({
    data: [{ key: KEY, value: crypto.randomBytes(32).toString("hex") }],
    skipDuplicates: true,
  });
  const row = await prisma.stateEntry.findUnique({ where: { key: KEY } });
  return (cachedSecret = row.value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ------------------------------------------------------------------ cookies

async function setCookie(name, value, maxAgeSeconds) {
  const store = await cookies();
  store.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().AUTH_COOKIE_SECURE,
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

async function clearCookie(name) {
  const store = await cookies();
  store.set(name, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ------------------------------------------------------------------ staff sessions

export function roleOf(user) {
  if (user.isSuperadmin) return "superadmin";
  return user.staffRole ? user.staffRole.toLowerCase() : null;
}

export async function startStaffSession(user, request) {
  const { SESSION_TTL_HOURS } = getEnv();
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 3600_000),
      ip: (request.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64) || null,
      userAgent: (request.headers.get("user-agent") || "").slice(0, 255) || null,
    },
  });
  await setCookie(STAFF_COOKIE, token, SESSION_TTL_HOURS * 3600);
}

export async function endStaffSession() {
  const store = await cookies();
  const token = store.get(STAFF_COOKIE)?.value;
  if (token) {
    await prisma.authSession.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await clearCookie(STAFF_COOKIE);
}

async function staffFromCookie() {
  const store = await cookies();
  const token = store.get(STAFF_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;
  const role = roleOf(session.user);
  if (!role) return null;

  return {
    type: "staff",
    userId: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role,
  };
}

// ------------------------------------------------------------------ booth devices

// Current election id and booth list live in the shared state
async function readState(key) {
  const row = await prisma.stateEntry.findUnique({ where: { key } });
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

export async function getCurrentBooths() {
  let currentId = Number(await readState("osis_current_election"));
  if (!currentId) {
    // Not recorded yet: fall back to the newest election that has a booth list
    const rows = await prisma.stateEntry.findMany({
      where: { key: { startsWith: "osis_booths@" } },
      select: { key: true },
    });
    currentId = Math.max(0, ...rows.map((r) => Number(r.key.split("@")[1])).filter(Number.isFinite));
  }
  if (!currentId) return { electionId: null, booths: [] };
  const booths = (await readState(`osis_booths@${currentId}`)) || [];
  return { electionId: currentId, booths: Array.isArray(booths) ? booths : [] };
}

// The token carries a fingerprint of the access code, so regenerating a code logs the device out.
async function boothFingerprint(code) {
  return sha256(`${await getSecret()}:${code}`).slice(0, 16);
}

async function sign(payload) {
  return crypto.createHmac("sha256", await getSecret()).update(payload).digest("base64url");
}

export async function startBoothSession(boothId, accessCode) {
  const { BOOTH_TOKEN_TTL_DAYS } = getEnv();
  const expires = Date.now() + BOOTH_TOKEN_TTL_DAYS * 86400_000;
  const payload = `${boothId}.${expires}.${await boothFingerprint(accessCode)}`;
  await setCookie(BOOTH_COOKIE, `${payload}.${await sign(payload)}`, BOOTH_TOKEN_TTL_DAYS * 86400);
}

export async function endBoothSession() {
  await clearCookie(BOOTH_COOKIE);
}

async function boothFromCookie() {
  const store = await cookies();
  const token = store.get(BOOTH_COOKIE)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [boothId, expires, fingerprint, signature] = parts;
  const payload = `${boothId}.${expires}.${fingerprint}`;

  const expected = Buffer.from(await sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now()) return null;

  const { booths } = await getCurrentBooths();
  const booth = booths.find((b) => String(b.id) === boothId);
  if (!booth || !booth.accessCode) return null;
  if ((await boothFingerprint(booth.accessCode)) !== fingerprint) return null;

  return { type: "booth", boothId: Number(boothId) };
}

// ------------------------------------------------------------------ principal / guards

/** Who is calling: a staff member, a paired booth device, or nobody (public visitor). */
export async function getPrincipal() {
  return (await staffFromCookie()) || (await boothFromCookie()) || null;
}

export async function requireStaff() {
  const principal = await staffFromCookie();
  if (!principal) throw new AppError("UNAUTHENTICATED", "Silakan login terlebih dahulu.", 401);
  return principal;
}

export async function requireSuperadmin() {
  const principal = await requireStaff();
  if (principal.role !== "superadmin") {
    throw new AppError("FORBIDDEN", "Hanya Superadmin yang dapat melakukan ini.", 403);
  }
  return principal;
}

// ------------------------------------------------------------------ first-run bootstrap

/**
 * Creates the superadmin and the Ketua OSIS account the first time the app runs on an empty
 * database, from SEED_SUPERADMIN_PASSWORD (and optional SEED_KETUA_PASSWORD) in the server .env.
 */
export async function ensureBootstrap() {
  if ((await prisma.user.count()) > 0) return;

  const env = getEnv();
  const password = env.SEED_SUPERADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new AppError(
      "NOT_CONFIGURED",
      "Akun awal belum dibuat: isi SEED_SUPERADMIN_PASSWORD (min. 8 karakter) di .env server.",
      503
    );
  }

  await prisma.user.create({
    data: {
      username: env.SEED_SUPERADMIN_USERNAME || "superadmin",
      name: "Pembina OSIS / Tim IT",
      passwordHash: await hashPassword(password),
      isSuperadmin: true,
      mustChangePassword: false,
    },
  });
  await prisma.user.create({
    data: {
      username: "ketua",
      name: "Ketua OSIS Saat Ini",
      passwordHash: await hashPassword(env.SEED_KETUA_PASSWORD || password),
      staffRole: "KETUA",
      mustChangePassword: false,
    },
  });
}

export { STAFF_ROLES };
