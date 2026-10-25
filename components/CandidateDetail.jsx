export default function CandidateDetail({ candidate, onClose }) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-5 sm:p-6 shadow-lg shadow-slate-200/50">

      {/* =========================
          HEADER
      ========================== */}
      <div>
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
        <div className="mt-4 space-y-4">

          {/* VISI */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Visi
            </h3>

            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">
              {candidate.visi}
            </p>
          </div>

          {/* MISI */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Misi
            </h3>

            <ul className="mt-1.5 space-y-1 text-xs sm:text-sm text-slate-600">
              {Array.isArray(candidate.misi) ? (
                candidate.misi.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{m}</span>
                  </li>
                ))
              ) : (
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">{candidate.misi}</p>
              )}
            </ul>
          </div>

          {/* PROGRAM KERJA */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Program Kerja
            </h3>

            <ul className="mt-1.5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              {candidate.programKerja.map((program, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                    {index + 1}
                  </span>

                  <span className="leading-tight">
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