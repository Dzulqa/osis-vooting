import { readCandidatePhoto } from "@/lib/server/uploads";

// Menyajikan foto paslon dari UPLOAD_DIR (bukan dari public/, yang tidak ikut terbaca setelah build)
export async function GET(_request, { params }) {
  const { file } = await params;
  const photo = await readCandidatePhoto(file);

  if (!photo) {
    return new Response("Foto tidak ditemukan", { status: 404 });
  }

  return new Response(photo.data, {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.data.length),
      // Nama file unik per upload, jadi aman di-cache selamanya
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
