"use client";

// Batas file yang boleh dipilih (sama dengan batas server)
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1400; // cukup tajam untuk kartu & layar bilik
const QUALITY = 0.86;

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

// Perkecil foto di browser sebelum dikirim (foto kamera bisa >5 MB)
async function compress(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

  // WebP bila didukung (lebih kecil, tetap mendukung transparansi), selain itu JPEG
  let blob = await canvasToBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg");

  // Jangan kirim versi yang malah lebih besar dari aslinya
  return blob && blob.size < file.size ? blob : file;
}

export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Mengunggah foto paslon ke server dan mengembalikan URL-nya.
 * Melempar Error dengan pesan siap tampil bila gagal.
 */
export async function uploadCandidatePhoto(file) {
  if (!file) throw new Error("Pilih foto terlebih dahulu.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Format foto harus JPG, PNG, atau WebP.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`Ukuran gambar maksimal 5 MB (file ini ${formatFileSize(file.size)}).`);
  }

  let payload = file;
  try {
    payload = await compress(file);
  } catch {
    // Gagal diproses di browser → kirim apa adanya, server tetap memvalidasi
  }

  const form = new FormData();
  form.append("file", payload, file.name);

  let res;
  try {
    res = await fetch("/api/uploads/candidates", { method: "POST", body: form });
  } catch {
    throw new Error("Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status !== "success") {
    throw new Error(body?.message || "Foto gagal diunggah. Coba lagi.");
  }
  return body.data.url;
}
