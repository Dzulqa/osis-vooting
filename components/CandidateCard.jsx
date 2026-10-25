/* eslint-disable @next/next/no-img-element */

export default function CandidateCard({
  nomor,
  ketua,
  wakil,
  slogan,
  foto,
  visi,
  misi,
  programKerja,
  onDetail,
  onVote,
}) {
  return (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-4 sm:p-4.5 shadow-md shadow-slate-200/50 transition-colors duration-200 hover:border-violet-300">

      {/* FOTO DENGAN SOFT SHADOW & ELEGANT FRAME */}
      <div className="relative w-full shrink-0 overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50/40 via-white to-violet-50/20 aspect-[16/10] shadow-[0_4px_16px_-4px_rgba(6,63,204,0.12)] ring-1 ring-violet-500/10 transition-colors duration-200 group-hover:border-violet-400/80">

        <img
          src={foto}
          alt={`Paslon ${nomor}`}
          className="h-full w-full object-cover object-top"
        />

        {/* NOMOR EMBLEM */}
        <div className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-sm font-black text-white shadow-md shadow-violet-600/30 ring-2 ring-white/90 sm:h-9 sm:w-9">
          {nomor}
        </div>
      </div>

      {/* INFORMASI */}
      <div className="flex min-h-0 flex-1 flex-col px-0.5 pt-3">

        {/* PASLON */}
        <h2 className="mt-1 text-center text-base font-black leading-tight text-slate-900 sm:text-lg">
          Paslon{" "}
          <span className="text-violet-600 font-extrabold">
            {nomor}
          </span>
        </h2>

        {/* NAMA DENGAN SPACING LEGA */}
        <div className="mt-2.5 flex flex-col items-center justify-center text-center">

          <p className="text-xs sm:text-sm font-bold leading-tight text-slate-800">
            {ketua}
          </p>

          <div className="my-2 flex w-full items-center justify-center gap-2.5 px-6">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-violet-300/80" />
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-black text-violet-700 shadow-xs ring-1 ring-violet-200/80">
              &
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-violet-200 to-violet-300/80" />
          </div>

          <p className="text-xs sm:text-sm font-bold leading-tight text-slate-800">
            {wakil}
          </p>

        </div>

        {/* SLOGAN DENGAN MIN-HEIGHT UNIFORM */}
        <div className="mt-3 flex min-h-[46px] items-center justify-center rounded-xl border border-violet-100/80 bg-violet-50/70 px-3 py-1.5 text-center">

          <p className="line-clamp-2 text-center text-[10px] italic leading-relaxed text-slate-600 sm:text-[11px]">
            “{slogan}”
          </p>

        </div>

        {/* BUTTON DENGAN SPACING PAS */}
        <div className="mt-auto space-y-2 pt-3.5">

          <button
            type="button"
            onClick={onDetail}
            className="w-full cursor-pointer rounded-xl border border-violet-200 bg-white/70 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 hover:border-violet-300 active:scale-[0.98] sm:text-sm"
          >
            Lihat Detail
          </button>

          <button
            type="button"
            onClick={onVote}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 py-2.5 text-xs font-extrabold text-white shadow-md shadow-violet-600/25 transition hover:from-violet-700 hover:to-violet-800 hover:shadow-lg hover:shadow-violet-600/35 active:scale-[0.98] sm:text-sm"
          >
            Pilih Paslon {nomor}
          </button>

        </div>
      </div>
    </div>
  );
}