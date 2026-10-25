"use client";

import { Balloons, ConfettiBurst, FestiveBackdrop } from "@/components/Festive";

// Layar perayaan setelah suara terkirim — bilik direset otomatis setelah 3 detik
export default function VoteSuccess() {
  return (
    <div className="fixed inset-0 z-50 isolate flex items-center justify-center overflow-hidden font-body text-ink">
      <FestiveBackdrop confetti={40} />
      <Balloons />
      <ConfettiBurst count={56} />

      <div className="fx-pop-in relative mx-4 w-full max-w-md rounded-[2.5rem] bg-white/90 px-8 pb-8 pt-10 text-center shadow-[0_30px_80px_-35px_rgba(31,42,72,0.5)] ring-1 ring-emerald-100 backdrop-blur-xl">
        {/* Centang dengan gelombang */}
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="fx-ring absolute inset-0 rounded-full bg-mint/60" />
          <span className="fx-ring absolute inset-0 rounded-full bg-mint/50" style={{ "--delay": "0.7s" }} />
          <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-mint to-[#b9ead9] shadow-lg shadow-emerald-200/70">
            <svg viewBox="0 0 48 48" className="h-14 w-14" aria-hidden="true">
              <path
                className="fx-check"
                d="M12 25 L21 34 L37 15"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="fx-wiggle absolute -right-3 -top-1 text-3xl" aria-hidden="true">🎉</span>
          <span className="fx-wiggle absolute -left-4 bottom-0 text-2xl" style={{ "--delay": "-1s" }} aria-hidden="true">
            ⭐
          </span>
        </div>

        <h1 className="mt-7 font-display text-4xl font-bold leading-tight text-ink" aria-label="Suaramu tercatat!">
          {"Suaramu tercatat!".split("").map((char, i) => (
            <span key={i} aria-hidden="true" className="fx-bounce-letter" style={{ "--delay": `${i * 0.06}s` }}>
              {char === " " ? " " : char}
            </span>
          ))}
        </h1>

        <p className="mt-3 text-base text-slate-500">
          Terima kasih sudah ikut menentukan masa depan OSIS SMK Al Amanah 💙
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-mint-soft px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-mint/60">
          🗳️ Pilihanmu tetap rahasia
        </div>

        {/* Hitung mundur reset bilik */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-slate-400">Menyiapkan bilik untuk pemilih berikutnya…</p>
          <div className="mx-auto mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className="fx-progress h-full rounded-full bg-gradient-to-r from-violet-300 via-coral to-sun" style={{ "--dur": "3s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
