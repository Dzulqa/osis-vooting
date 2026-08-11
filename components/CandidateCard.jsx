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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white p-3.5 sm:p-4 shadow-md hover:shadow-lg transition">

      {/* ==================================
          FOTO PASLON (ASPECT 4:3 MATCHING ORIGINAL PHOTO)
      =================================== */}

      <div className="relative shrink-0 overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3] w-full">

        <img
          src={foto}
          alt={`Paslon ${nomor}`}
          className="h-full w-full object-cover object-top"
        />

        {/* NOMOR */}

        <div className="absolute left-3 top-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-violet-600 text-sm sm:text-base font-black text-white shadow-md">
          {nomor}
        </div>

      </div>

      {/* ==================================
          INFORMASI PASLON
      =================================== */}

      <div className="flex min-h-0 flex-1 flex-col px-1 pt-2.5">

        {/* NAMA PASLON */}

        <h2 className="text-center text-base sm:text-lg font-black leading-tight text-slate-900">
          Paslon{" "}
          <span className="text-violet-600">
            {nomor}
          </span>
        </h2>

        {/* KETUA & WAKIL */}

        <div className="mt-1.5 flex items-center justify-center gap-1.5 text-center flex-wrap">

          <p className="text-xs sm:text-sm font-bold leading-tight text-slate-800">
            {ketua}
          </p>

          <span className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-600">
            &
          </span>

          <p className="text-xs sm:text-sm font-bold leading-tight text-slate-800">
            {wakil}
          </p>

        </div>

        {/* SLOGAN */}

        <div className="mt-2.5 rounded-xl bg-violet-50/70 px-3 py-2">

          <p className="text-center text-[11px] sm:text-xs leading-relaxed text-slate-600 line-clamp-2 italic">
            “{slogan}”
          </p>

        </div>

        {/* ==================================
            BUTTON
        =================================== */}

        <div className="mt-auto pt-3 space-y-2">

          <button
            type="button"
            onClick={onDetail}
            className="w-full cursor-pointer rounded-xl border border-violet-200 py-2 text-xs sm:text-sm font-bold text-violet-600 transition hover:bg-violet-50"
          >
            Lihat Detail
          </button>

          <button
            type="button"
            onClick={onVote}
            className="w-full cursor-pointer rounded-xl bg-violet-600 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98]"
          >
            Pilih Paslon {nomor}
          </button>

        </div>

      </div>

    </div>
  );
}