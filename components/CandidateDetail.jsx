export default function CandidateDetail({ candidate, onClose }) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-y-auto rounded-3xl border border-violet-100 bg-white p-5 sm:p-6 lg:p-7 shadow-md">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-500">
              Visi & Misi Candidate
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Detail Paslon <span className="text-violet-600">{candidate.nomor}</span>
            </h2>
          </div>
          <span className="rounded-xl bg-violet-100 px-3.5 py-1 text-xs font-black text-violet-700">
            PASLON {candidate.nomor}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-violet-600">
              Visi
            </h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">
              {candidate.visi}
            </p>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-violet-600">
              Misi
            </h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">
              {candidate.misi}
            </p>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-violet-600">
              Program Kerja
            </h3>
            <ul className="mt-1.5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              {candidate.programKerja.map((program, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                    {index + 1}
                  </span>
                  <span className="leading-snug">{program}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl border border-violet-200 py-2.5 font-bold text-violet-600 transition hover:bg-violet-50 active:scale-[0.98]"
        >
          Tutup Detail
        </button>
      </div>
    </div>
  );
}