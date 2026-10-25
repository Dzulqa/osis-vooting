import CandidatePhoto from "@/components/CandidatePhoto";

// Warna stiker nomor bergantian per paslon
const STICKERS = ["bg-sun text-ink", "bg-coral text-ink", "bg-mint text-ink", "bg-lilac text-ink"];
const PHOTO_BANDS = [
  "from-[#e4e9ff] to-[#efeaff]",
  "from-[#ffe4eb] to-[#fff0ea]",
  "from-[#dcf6ee] to-[#e9f6f7]",
  "from-[#fff3d6] to-[#ffe6ec]",
];

export default function CandidateCard({
  nomor,
  ketua,
  wakil,
  slogan,
  foto,
  onDetail,
  onVote,
}) {
  const tone = (Number(nomor) - 1 + STICKERS.length) % STICKERS.length || 0;

  return (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] bg-white/95 p-3.5 shadow-[0_18px_44px_-26px_rgba(31,42,72,0.4)] ring-1 ring-violet-100 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_50px_-24px_rgba(90,114,216,0.45)] hover:ring-violet-200 sm:p-4">
      {/* FOTO */}
      <div className={`relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${PHOTO_BANDS[tone]}`}>
        <CandidatePhoto
          src={foto}
          nomor={nomor}
          ketua={ketua}
          wakil={wakil}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />

        {/* NOMOR STIKER */}
        <div
          className={`absolute left-2.5 top-2.5 flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl font-display text-lg font-bold shadow-md ring-2 ring-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${STICKERS[tone]}`}
        >
          {nomor}
        </div>
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 text-lg opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100"
        >
          ✨
        </span>
      </div>

      {/* INFORMASI */}
      <div className="flex min-h-0 flex-1 flex-col px-0.5 pt-3">
        <h2 className="text-center font-display text-lg font-bold leading-tight text-ink">
          Paslon <span className="text-violet-600">{nomor}</span>
        </h2>

        <div className="mt-2 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold leading-tight text-slate-700 sm:text-sm">{ketua}</p>

          <div className="my-1.5 flex w-full items-center justify-center gap-2.5 px-6">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-200" />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-black text-violet-600 ring-1 ring-violet-100">
              &amp;
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-200" />
          </div>

          <p className="text-xs font-bold leading-tight text-slate-700 sm:text-sm">{wakil}</p>
        </div>

        {/* SLOGAN */}
        <div className="mt-3 flex min-h-[46px] items-center justify-center rounded-2xl bg-violet-50/70 px-3 py-1.5 text-center ring-1 ring-violet-100/80">
          <p className="line-clamp-2 text-center text-[10px] italic leading-relaxed text-slate-600 sm:text-[11px]">
            &ldquo;{slogan}&rdquo;
          </p>
        </div>

        {/* TOMBOL */}
        <div className="mt-auto space-y-2 pt-3.5">
          <button
            type="button"
            onClick={onDetail}
            className="w-full cursor-pointer rounded-2xl bg-white py-2 text-xs font-bold text-violet-700 ring-2 ring-violet-100 transition hover:bg-violet-50 hover:ring-violet-200 active:scale-[0.98] sm:text-sm"
          >
            👀 Lihat detail
          </button>

          <button
            type="button"
            onClick={onVote}
            className="fx-shine w-full cursor-pointer rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 py-2.5 font-display text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(90,114,216,0.7)] transition hover:brightness-105 active:scale-[0.98] sm:text-base"
          >
            Pilih paslon {nomor} 🗳️
          </button>
        </div>
      </div>
    </div>
  );
}
