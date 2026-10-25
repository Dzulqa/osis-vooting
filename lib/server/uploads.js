import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/server/http";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Nama file selalu kita buat sendiri (UUID + ekstensi) → aman dari path traversal
const FILE_NAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Folder upload berada di luar folder rilis supaya deploy tidak menghapus foto.
// Dibaca langsung (bukan getEnv) agar upload tidak bergantung pada konfigurasi database.
function candidatesDir() {
  return path.resolve(process.env.UPLOAD_DIR || "./.uploads", "candidates");
}

// Jenis file ditentukan dari isi (magic bytes), bukan dari nama/Content-Type kiriman browser
function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function saveCandidatePhoto(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new AppError("PHOTO_REQUIRED", "Pilih file foto paslon terlebih dahulu.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new AppError("PHOTO_TOO_LARGE", "Ukuran foto maksimal 5 MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageType(buffer);
  if (!ext) {
    throw new AppError("PHOTO_INVALID_TYPE", "Format foto harus JPG, PNG, atau WebP.", 415);
  }

  const dir = candidatesDir();
  await mkdir(dir, { recursive: true });

  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, fileName), buffer, { flag: "wx" });

  return { fileName, url: `/api/media/candidates/${fileName}`, size: buffer.length };
}

export async function readCandidatePhoto(fileName) {
  if (!FILE_NAME_PATTERN.test(fileName || "")) return null;

  try {
    const data = await readFile(path.join(candidatesDir(), fileName));
    return { data, contentType: CONTENT_TYPES[fileName.split(".").pop()] };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
