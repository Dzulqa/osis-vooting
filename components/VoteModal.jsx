"use client";

import Modal from "@/components/Modal";
import { BallotBox } from "@/components/Festive";

export default function VoteModal({ candidate, onClose, onConfirm, isSubmitting }) {
  if (!candidate) return null;

  if (isSubmitting) {
    // Animasi surat suara masuk kotak saat mengirim
    return (
      <Modal open dismissible={false} icon="🗳️" title="Memasukkan suaramu…" description="Tunggu sebentar, jangan tutup layar ini.">
        <div className="flex flex-col items-center py-2 text-center">
          <BallotBox className="h-44 w-44 drop-shadow-lg" />
          <p className="mt-1 text-sm text-slate-500">
            Mengirim
            {[0, 1, 2].map((i) => (
              <span key={i} className="fx-dot" style={{ "--delay": `${i * 0.15}s` }}>.</span>
            ))}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon="🤔"
      title="Yakin dengan pilihanmu?"
      description={`Kamu akan memilih Paslon ${candidate.nomor}. Suara yang sudah dikirim tidak bisa diubah lagi.`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-2xl bg-white px-5 py-3 font-bold text-slate-600 ring-2 ring-slate-200 transition hover:bg-slate-50"
          >
            Pikir lagi
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-autofocus
            className="fx-shine cursor-pointer rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 font-display text-lg font-bold text-white shadow-[0_12px_26px_-10px_rgba(90,114,216,0.7)] transition hover:brightness-105 active:scale-[0.98]"
          >
            Ya, pilih! 🗳️
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        {/* Nomor Paslon */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="fx-ring absolute inset-1 rounded-[1.75rem] bg-violet-200" />
          <span className="fx-wiggle relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-sun font-display text-3xl font-bold text-ink shadow-lg shadow-amber-200/70">
            {candidate.nomor}
          </span>
        </div>

        {/* Kandidat */}
        <div className="mt-5 w-full rounded-[1.5rem] bg-violet-50/80 p-4 ring-1 ring-violet-100">
          <p className="font-display text-lg font-semibold text-ink">{candidate.ketua}</p>
          <p className="my-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-violet-600 shadow-sm">
            &amp;
          </p>
          <p className="font-display text-lg font-semibold text-ink">{candidate.wakil}</p>
        </div>
      </div>
    </Modal>
  );
}
