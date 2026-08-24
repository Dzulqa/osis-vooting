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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white p-3 shadow-md transition hover:shadow-lg">

      {/* FOTO */}
      <div className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 aspect-[16/10]">

        <img
          src={foto}
          alt={`Paslon ${nomor}`}
          className="h-full w-full object-cover object-top"
        />

        {/* NOMOR */}
        <div className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-md sm:h-9 sm:w-9">
          {nomor}
        </div>
      </div>

      {/* INFORMASI */}
      <div className="flex min-h-0 flex-1 flex-col px-1 pt-2">

        {/* PASLON */}
        <h2 className="text-center text-base font-black leading-tight mt-2 mb-2 text-slate-900 sm:text-lg">
          Paslon{" "}
          <span className="text-violet-600">
            {nomor}
          </span>
        </h2>

        {/* NAMA */}
        <div className="mt-1 flex items-center justify-center gap-1 text-center flex-wrap">

          <p className="text-xs font-bold leading m-tight text-slate-800 sm:text-sm">
            {ketua}
          </p>

          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-black text-violet-600">
            &
          </span>

          <p className="text-xs font-bold leading-tight text-slate-800 sm:text-sm">
            {wakil}
          </p>

        </div>

        {/* SLOGAN */}
        <div className="mt-2 rounded-xl bg-violet-50/70 px-2.5 py-1.5">

          <p className="line-clamp-2 text-center text-[10px] italic leading-relaxed text-slate-600 sm:text-[11px] mt-2">
            “{slogan}”
          </p>

        </div>

        {/* BUTTON */}
        <div className="mt-auto space-y-1.5 pt-2">

          <button
            type="button"
            onClick={onDetail}
            className="w-full cursor-pointer rounded-xl border border-violet-200 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-50 sm:text-sm"
          >
            Lihat Detail
          </button>

          <button
            type="button"
            onClick={onVote}
            className="w-full cursor-pointer rounded-xl bg-violet-600 py-2 text-xs font-extrabold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98] sm:text-sm"
          >
            Pilih Paslon {nomor}
          </button>

        </div>
      </div>
    </div>
  );
}