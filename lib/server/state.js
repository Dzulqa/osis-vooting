import "server-only";
import { prisma } from "@/lib/server/db";
import { AppError } from "@/lib/server/http";
import { applyOp, baseKey, isSyncedKey, STATE_OP_TYPES } from "@/lib/stateOps";

const MAX_VALUE_BYTES = 2_000_000;

// ------------------------------------------------------------------ who may read / write what

const PUBLIC_READ = new Set([
  "osis_elections",
  "osis_current_election",
  "osis_custom_candidates",
  "osis_event_config",
]);
const BOOTH_READ = new Set([...PUBLIC_READ, "osis_booths"]);

export function canRead(principal, key) {
  if (!isSyncedKey(key)) return false;
  const base = baseKey(key);
  if (PUBLIC_READ.has(base)) return true;
  if (principal?.type === "booth") return BOOTH_READ.has(base);
  return principal?.type === "staff"; // every staff role can read the rest
}

// Who may change which key. Votes and the voted list are only written through castVote().
const WRITE_RULES = {
  osis_queue: { staff: ["ketua", "registrator", "caller"], kinds: ["set", ...STATE_OP_TYPES] },
  osis_booths: { staff: ["ketua", "caller"], kinds: ["patch"], boothSelf: true },
  osis_event_config: { staff: ["ketua"], kinds: ["set"] },
};

export function canWrite(principal, key, kind, op) {
  if (!principal || !isSyncedKey(key)) return false;
  const base = baseKey(key);

  if (principal.type === "staff" && principal.role === "superadmin") return true;

  const rule = WRITE_RULES[base];
  if (!rule || !rule.kinds.includes(kind)) return false;

  if (principal.type === "staff") return rule.staff.includes(principal.role);
  // A booth device may only update its own booth (status / assigned student)
  return Boolean(
    rule.boothSelf && principal.type === "booth" && op && String(op.id) === String(principal.boothId)
  );
}

// ------------------------------------------------------------------ reads

export async function readEntries(principal, since) {
  const rows = await prisma.stateEntry.findMany({
    where: since ? { updatedAt: { gte: since } } : undefined,
    orderBy: { updatedAt: "asc" },
  });
  return rows
    .filter((row) => canRead(principal, row.key))
    .map((row) => ({
      key: row.key,
      value: row.value,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    }));
}

// ------------------------------------------------------------------ writes

function parseList(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function assertSize(value) {
  if (typeof value !== "string" || Buffer.byteLength(value) > MAX_VALUE_BYTES) {
    throw new AppError("VALUE_TOO_LARGE", "Data terlalu besar.", 413);
  }
  try {
    JSON.parse(value);
  } catch {
    throw new AppError("INVALID_VALUE", "Nilai harus berupa JSON.", 400);
  }
}

/** Replace a whole value (last write wins). */
export async function setEntry(key, value, userId) {
  assertSize(value);
  const row = await prisma.stateEntry.upsert({
    where: { key },
    create: { key, value, version: 1, updatedById: userId ?? null },
    update: { value, version: { increment: 1 }, updatedById: userId ?? null },
  });
  return { key, version: row.version };
}

/** Make sure the rows exist (outside any transaction, so concurrent callers cannot deadlock on gap locks). */
async function ensureRows(keys) {
  await prisma.stateEntry.createMany({
    data: keys.map((key) => ({ key, value: "[]", version: 0 })),
    skipDuplicates: true,
  });
}

/** Lock existing rows so concurrent ops on the same list run one after another. */
async function lockRows(tx, keys) {
  const placeholders = keys.map(() => "?").join(",");
  await tx.$queryRawUnsafe(
    `SELECT \`key\` FROM StateEntry WHERE \`key\` IN (${placeholders}) ORDER BY \`key\` FOR UPDATE`,
    ...keys
  );
}

// MySQL can still abort one of two competing transactions (deadlock / lock wait); simply run it again.
async function transactional(run, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      return await prisma.$transaction(run, { maxWait: 5000, timeout: 10000 });
    } catch (error) {
      const retryable = ["P2034", "P2028"].includes(error.code) || /deadlock|lock wait/i.test(error.message || "");
      if (!retryable || i >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * i + Math.random() * 40));
    }
  }
}

/** Atomically change one list: append / remove / patch an element. */
export async function applyEntryOp(key, op, userId) {
  if (!STATE_OP_TYPES.includes(op?.type)) throw new AppError("INVALID_OP", "Operasi tidak dikenal.", 400);

  await ensureRows([key]);
  return transactional(async (tx) => {
    await lockRows(tx, [key]);
    const row = await tx.stateEntry.findUnique({ where: { key } });
    const next = applyOp(parseList(row.value), op);
    const value = JSON.stringify(next);
    assertSize(value);
    const saved = await tx.stateEntry.update({
      where: { key },
      data: { value, version: { increment: 1 }, updatedById: userId ?? null },
    });
    return { key, version: saved.version };
  });
}

/**
 * Casts one ballot. The server alone decides: the student must be the one currently assigned to this
 * booth, and may only vote once. Writes the (anonymous) vote and the voted list in one transaction.
 */
export async function castVote({ principal, candidateId, studentId, boothId }) {
  const currentRow = await prisma.stateEntry.findUnique({ where: { key: "osis_current_election" } });
  const electionId = Number(currentRow?.value);
  if (!electionId) throw new AppError("NO_ELECTION", "Belum ada pemilihan aktif.", 409);

  const effectiveBoothId = principal.type === "booth" ? principal.boothId : Number(boothId);
  const votesKey = `osis_votes@${electionId}`;
  const votedKey = `osis_voted@${electionId}`;

  await ensureRows([votedKey, votesKey]);
  return transactional(async (tx) => {
    await lockRows(tx, [votedKey, votesKey]);

    const boothsRow = await tx.stateEntry.findUnique({ where: { key: `osis_booths@${electionId}` } });
    const booth = parseList(boothsRow?.value).find((b) => Number(b.id) === effectiveBoothId);
    if (!booth) throw new AppError("BOOTH_NOT_FOUND", "Bilik tidak ditemukan.", 404);
    if (principal.type === "booth" && String(booth.student?.id) !== String(studentId)) {
      throw new AppError("NOT_YOUR_TURN", "Pemilih ini tidak sedang berada di bilik ini.", 409);
    }

    const candidatesRow = await tx.stateEntry.findUnique({ where: { key: `osis_custom_candidates@${electionId}` } });
    if (!parseList(candidatesRow?.value).some((c) => Number(c.id) === Number(candidateId))) {
      throw new AppError("CANDIDATE_NOT_FOUND", "Paslon tidak ditemukan.", 404);
    }

    const votedRow = await tx.stateEntry.findUnique({ where: { key: votedKey } });
    const voted = parseList(votedRow.value);
    if (voted.some((id) => String(id) === String(studentId))) {
      throw new AppError("ALREADY_VOTED", "Pemilih ini sudah menggunakan hak suaranya.", 409);
    }

    const votesRow = await tx.stateEntry.findUnique({ where: { key: votesKey } });
    const vote = {
      id: crypto.randomUUID(),
      candidateId: Number(candidateId),
      boothId: effectiveBoothId,
      createdAt: new Date().toISOString(),
    };

    await tx.stateEntry.update({
      where: { key: votedKey },
      data: { value: JSON.stringify([...voted, String(studentId)]), version: { increment: 1 } },
    });
    await tx.stateEntry.update({
      where: { key: votesKey },
      data: { value: JSON.stringify([...parseList(votesRow.value), vote]), version: { increment: 1 } },
    });
    return vote;
  });
}
