import RichText from "@/components/RichText";
import { toPoints } from "@/components/ListField";

export default function CandidateDetail({ candidate, onClose }) {
  const misi = toPoints(candidate.misi);
  const programKerja = toPoints(candidate.programKerja);

  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-5 sm:p-6 shadow-lg shadow-slate-200/50">

      {/* =========================
          HEADER
      ========================== */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
              Visi &amp; Misi Candidate
            </span>

            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Detail Paslon{" "}
              <span className="text-violet-600">
                {candidate.nomor}
              </span>
            </h2>
          </div>

          <span className="rounded-xl bg-violet-100 px-3.5 py-1 text-xs font-black text-violet-700">
            PASLON {candidate.nomor}
          </span>
        </div>

        {/* =========================
            CONTENT
        ========================== */}
        {/* Visi bisa panjang (banyak paragraf) → area isi bisa digulir */}
        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">

          {/* VISI */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Visi
            </h3>

            <RichText
              text={candidate.visi}
              className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm"
              empty={<p className="mt-1 text-xs italic text-slate-400 sm:text-sm">Visi belum diisi.</p>}
            />
          </div>

          {/* MISI */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Misi
            </h3>

            <ul className="mt-1.5 space-y-1 text-xs sm:text-sm text-slate-600">
              {misi.length > 0 ? (
                misi.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{m}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-slate-400">Misi belum diisi.</li>
              )}
            </ul>
          </div>

          {/* PROGRAM KERJA */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Program Kerja
            </h3>

            <ul className="mt-1.5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              {programKerja.length === 0 && <li className="italic text-slate-400">Program kerja belum diisi.</li>}
              {programKerja.map((program, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                    {index + 1}
                  </span>

                  <span className="leading-snug">
                    {program}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* =========================
          BUTTON
      ========================== */}
      <div className="mt-auto border-t border-slate-100 pt-3.5">
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl border border-violet-200 bg-white/80 py-2.5 font-bold text-violet-700 shadow-xs transition hover:bg-violet-50 hover:border-violet-300 active:scale-[0.98]"
        >
          Tutup Detail
        </button>
      </div>

    </div>
  );
}