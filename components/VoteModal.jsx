"use client";

import { BallotBox, Confetti } from "@/components/Festive";

export default function VoteModal({ candidate, onClose, onConfirm, isSubmitting }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a48]/30 p-4 backdrop-blur-md">
      <div className="fx-pop-in relative w-full max-w-md overflow-hidden rounded-[2.25rem] bg-white p-7 shadow-[0_30px_80px_-30px_rgba(31,42,72,0.55)] ring-1 ring-violet-100">
        {/* Header pastel */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-[#e4e9ff] via-[#efeaff] to-[#fde9f1]">
          <Confetti count={12} />
          <span className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[14px] border-white/50" />
        </div>

        {isSubmitting ? (
          // Animasi surat suara masuk kotak saat mengirim
          <div className="relative flex flex-col items-center py-4 text-center">
            <BallotBox className="h-44 w-44 drop-shadow-lg" />
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">Memasukkan suaramu…</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tunggu sebentar
              {[0, 1, 2].map((i) => (
                <span key={i} className="fx-dot" style={{ "--delay": `${i * 0.15}s` }}>.</span>
              ))}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Nomor Paslon */}
            <div className="relative mx-auto mt-2 flex h-20 w-20 items-center justify-center">
              <span className="fx-ring absolute inset-1 rounded-[1.75rem] bg-violet-200" />
              <span className="fx-wiggle relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-sun font-display text-3xl font-bold text-ink shadow-lg shadow-amber-200/70">
                {candidate.nomor}
              </span>
            </div>

            <div className="mt-5 text-center">
              <h2 className="font-display text-3xl font-bold text-ink">Yakin dengan pilihanmu? 🤔</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Kamu akan memilih <span className="font-bold text-violet-700">Paslon {candidate.nomor}</span>
              </p>
            </div>

            {/* Kandidat */}
            <div className="mt-5 rounded-[1.5rem] bg-violet-50/80 p-4 text-center ring-1 ring-violet-100">
              <p className="font-display text-lg font-semibold text-ink">{candidate.ketua}</p>
              <p className="my-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-violet-600 shadow-sm">
                &amp;
              </p>
              <p className="font-display text-lg font-semibold text-ink">{candidate.wakil}</p>
            </div>

            <p className="mt-4 flex items-start justify-center gap-2 rounded-2xl bg-sun-soft px-4 py-2.5 text-center text-xs font-semibold leading-relaxed text-amber-900 ring-1 ring-amber-100">
              <span aria-hidden="true">⚠️</span>
              Suara yang sudah dikirim tidak bisa diubah lagi.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-2xl bg-white px-4 py-3.5 font-bold text-slate-600 ring-2 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
              >
                Pikir lagi
              </button>

              <button
                onClick={onConfirm}
                className="fx-shine flex-[1.4] cursor-pointer rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-4 py-3.5 font-display text-lg font-bold text-white shadow-[0_12px_26px_-10px_rgba(90,114,216,0.7)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
              >
                Ya, pilih! 🗳️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
