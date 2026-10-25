import { AppError, handler, ok } from "@/lib/server/http";
import { MAX_PHOTO_BYTES, saveCandidatePhoto } from "@/lib/server/uploads";

// Upload foto paslon → disimpan di UPLOAD_DIR/candidates, dibalas URL untuk ditampilkan
export const POST = handler(async (request) => {
  // Tolak kiriman dari situs lain (form lintas-origin)
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    throw new AppError("FORBIDDEN_ORIGIN", "Permintaan ditolak.", 403);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_PHOTO_BYTES + 64 * 1024) {
    throw new AppError("PHOTO_TOO_LARGE", "Ukuran foto maksimal 5 MB.", 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    throw new AppError("PHOTO_REQUIRED", "Kirim foto sebagai form-data dengan field 'file'.");
  }

  const photo = await saveCandidatePhoto(form.get("file"));
  return ok(photo, { message: "Foto paslon tersimpan.", status: 201 });
});
