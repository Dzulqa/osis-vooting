import crypto from "node:crypto";
import { AppError, handler, ok } from "@/lib/server/http";
import { getCurrentBooths, startBoothSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// Light brute-force guard: 6-digit codes, so cap attempts per client.
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function tooMany(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

export const POST = handler(async (request) => {
  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (tooMany(ip)) throw new AppError("TOO_MANY_ATTEMPTS", "Terlalu banyak percobaan. Tunggu satu menit.", 429);

  const body = await request.json().catch(() => ({}));
  const boothId = Number(body.boothId);
  const code = String(body.code || "").trim();

  const { booths } = await getCurrentBooths();
  const booth = booths.find((b) => Number(b.id) === boothId);
  if (!booth) throw new AppError("BOOTH_NOT_FOUND", "Bilik tidak ditemukan.", 404);

  const expected = Buffer.from(String(booth.accessCode || ""));
  const given = Buffer.from(code);
  if (!expected.length || expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    throw new AppError("INVALID_CODE", "Kode akses bilik salah.", 401);
  }

  await startBoothSession(boothId, booth.accessCode);
  return ok({ session: { boothId, accessCode: booth.accessCode, loggedInAt: new Date().toISOString() } });
});
