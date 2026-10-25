/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

// Foto paslon dengan cadangan: bila foto kosong / gagal dimuat, tampil kartu inisial
export default function CandidatePhoto({ src, nomor, ketua, wakil, className = "", imgClassName = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  const initials = [ketua, wakil]
    .filter(Boolean)
    .map((name) => name.trim().charAt(0).toUpperCase())
    .join("&");

  if (showImage) {
    return (
      <img
        src={src}
        alt={ketua && wakil ? `${ketua} dan ${wakil}` : `Paslon ${nomor}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={`h-full w-full object-cover object-top ${imgClassName} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Foto paslon ${nomor ?? ""} belum tersedia`}
      className={`@container flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#e4e9ff] via-[#efeaff] to-[#fde9f1] text-violet-700 ${className}`}
    >
      <span className="font-display text-[clamp(0.9rem,26cqw,3.5rem)] font-bold leading-none">{initials || nomor || "?"}</span>
      <span className="hidden text-[10px] font-semibold text-violet-500/80 @[7rem]:block">Foto belum ada</span>
    </div>
  );
}
