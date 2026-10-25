"use client";

import { useId, useRef, useState } from "react";
import CandidatePhoto from "@/components/CandidatePhoto";
import { formatFileSize, uploadCandidatePhoto } from "@/lib/uploadCandidatePhoto";

/**
 * Pilih gambar paslon dari perangkat (maks. 5 MB), lalu otomatis diunggah ke server.
 * value = URL foto tersimpan; onChange(url) dipanggil setelah upload berhasil.
 */
export default function PhotoUpload({ value, onChange, required = false, compact = false, onUploadingChange }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null); // { name, size } file terakhir yang dipilih

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setPicked({ name: file.name, size: file.size });
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadCandidatePhoto(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed p-3 transition ${
          isDragging
            ? "border-violet-400 bg-violet-50"
            : error
              ? "border-rose-200 bg-rose-50/50"
              : "border-violet-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
        } ${isUploading ? "pointer-events-none" : ""}`}
      >
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl bg-violet-50 ring-1 ring-violet-100 ${
            compact ? "h-14 w-20" : "aspect-[16/10] w-28"
          }`}
        >
          {value ? (
            <CandidatePhoto src={value} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">📷</div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75">
              <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              value ? "bg-white text-violet-700 ring-1 ring-violet-200" : "bg-violet-600 text-white group-hover:bg-violet-700"
            }`}
          >
            📁 {isUploading ? "Mengunggah…" : value ? "Ganti gambar" : "Pilih gambar"}
          </span>
          <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-600">
            {picked ? `${picked.name} · ${formatFileSize(picked.size)}` : value ? "Gambar tersimpan ✓" : "Belum ada gambar dipilih"}
            {value && !isUploading && picked && !error && " ✓"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, atau WebP · maks. 5 MB · bisa juga diseret ke sini</p>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      {/* Validasi bawaan form: wajib sudah ada foto tersimpan */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value || ""}
          onChange={() => {}}
          ref={(el) => el?.setCustomValidity(value ? "" : "Unggah foto paslon terlebih dahulu.")}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px border-0 p-0 opacity-0"
        />
      )}

      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">⚠️ {error}</p>}
    </div>
  );
}

// Tombol kecil untuk mengganti foto paslon yang sudah terdaftar
export function PhotoReplaceButton({ onUploaded, onError }) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(e) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      onUploaded(await uploadCandidatePhoto(file));
    } catch (err) {
      onError?.(err.message);
    } finally {
      setIsUploading(false);
      input.value = "";
    }
  }

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50 ${
        isUploading ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {isUploading ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      ) : (
        "📷"
      )}
      {isUploading ? "Mengunggah…" : "Ganti foto"}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        disabled={isUploading}
      />
    </label>
  );
}
