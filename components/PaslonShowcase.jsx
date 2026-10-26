"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import CandidatePhoto from "@/components/CandidatePhoto";
import { Confetti } from "@/components/Festive";

// Tampilan presentasi paslon untuk layar besar (papan / proyektor)
const AUTOPLAY_MS = 15000;

const THEMES = [
  {
    stage: "from-[#e4e9ff] via-[#efeaff] to-[#fde9f1]",
    blobA: "bg-violet-300/50",
    blobB: "bg-coral/40",
    sticker: "bg-sun text-ink",
    accent: "text-violet-700",
    chip: "bg-violet-600 text-white",
    soft: "bg-white/70 ring-violet-200/70",
    bar: "from-violet-400 to-coral",
  },
  {
    stage: "from-[#ffe4eb] via-[#fff0ea] to-[#fff6dc]",
    blobA: "bg-coral/55",
    blobB: "bg-sun/60",
    sticker: "bg-violet-600 text-white",
    accent: "text-rose-700",
    chip: "bg-rose-500 text-white",
    soft: "bg-white/70 ring-rose-200/70",
    bar: "from-coral to-sun",
  },
  {
    stage: "from-[#dcf6ee] via-[#e9f6f7] to-[#e4ecff]",
    blobA: "bg-mint/60",
    blobB: "bg-violet-200/70",
    sticker: "bg-coral text-ink",
    accent: "text-emerald-700",
    chip: "bg-emerald-600 text-white",
    soft: "bg-white/70 ring-emerald-200/70",
    bar: "from-mint to-violet-300",
  },
  {
    stage: "from-[#fff3d6] via-[#fff1e6] to-[#ffe6ec]",
    blobA: "bg-sun/70",
    blobB: "bg-coral/40",
    sticker: "bg-mint text-ink",
    accent: "text-amber-700",
    chip: "bg-amber-500 text-white",
    soft: "bg-white/70 ring-amber-200/70",
    bar: "from-sun to-coral",
  },
];

function toList(value) {
  if (Array.isArray(value)) return value.filter((item) => String(item).trim());
  if (typeof value === "string") return value.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

// Ukuran huruf visi menyesuaikan panjang teks agar tetap terbaca dari jauh
function visiSizeClass(text) {
  const length = (text || "").length;
  if (length <= 120) return "text-[calc(var(--fit,1)*clamp(1.5rem,min(3.2vw,5.6vh),4rem))]";
  if (length <= 260) return "text-[calc(var(--fit,1)*clamp(1.3rem,min(2.4vw,4.3vh),3rem))]";
  if (length <= 480) return "text-[calc(var(--fit,1)*clamp(1.15rem,min(1.9vw,3.4vh),2.25rem))]";
  return "text-[calc(var(--fit,1)*clamp(1rem,min(1.5vw,2.7vh),1.75rem))]";
}

export default function PaslonShowcase({ candidates, startIndex = 0, onClose, onIndexChange }) {
  const rootRef = useRef(null);
  const [index, setIndex] = useState(startIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const total = candidates.length;
  const candidate = candidates[index];
  const theme = THEMES[index % THEMES.length];
  const misi = toList(candidate?.misi);
  const programKerja = toList(candidate?.programKerja);

  const showIndex = useCallback(
    (next) => {
      setIndex(next);
      onIndexChange?.(next); // di luar updater: memperbarui URL tidak boleh terjadi saat render
    },
    [onIndexChange]
  );

  const go = useCallback((step) => showIndex((index + step + total) % total), [index, total, showIndex]);

  // Papan tidak bisa di-scroll: kecilkan huruf visi/misi/program sampai semuanya muat
  // Skala dipasang di seluruh kolom kanan (slogan ikut mengecil), luapan diukur di kotak visi
  const fitRef = useRef(null);
  const measureRef = useRef(null);
  useLayoutEffect(() => {
    const node = fitRef.current;
    const measure = measureRef.current;
    if (!node || !measure) return;

    function fit() {
      let scale = 1;
      node.style.setProperty("--fit", "1");
      while (measure.scrollHeight > measure.clientHeight + 1 && scale > 0.6) {
        scale -= 0.03;
        node.style.setProperty("--fit", scale.toFixed(2));
      }
    }

    fit();
    window.addEventListener("resize", fit);
    document.addEventListener("fullscreenchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      document.removeEventListener("fullscreenchange", fit);
    };
  }, [index, candidates]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    onClose();
  }, [onClose]);

  // Keyboard: ← → ganti paslon, F layar penuh, Esc tutup
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "Escape" && !document.fullscreenElement) close();
    }
    function handleFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [go, toggleFullscreen, close]);

  // Putar otomatis untuk papan informasi
  useEffect(() => {
    if (!isAutoplay || total < 2) return;
    const timer = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [isAutoplay, index, total, go]);

  if (!candidate) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Paslon ${candidate.nomor}: ${candidate.ketua} dan ${candidate.wakil}`}
      className={`fixed inset-0 z-[90] isolate flex flex-col overflow-hidden bg-gradient-to-br font-body text-ink transition-colors duration-700 ${theme.stage}`}
    >
      {/* Dekorasi panggung */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full blur-[120px] ${theme.blobA}`} />
        <div className={`absolute -bottom-48 -right-32 h-[40rem] w-[40rem] rounded-full blur-[120px] ${theme.blobB}`} />
        <div className="absolute -right-24 top-16 h-[26rem] w-[26rem] rounded-full border-[40px] border-white/35" />
        <span className="absolute -bottom-[0.2em] right-[2vw] select-none font-display text-[38vh] font-bold leading-none text-white/45">
          {candidate.nomor}
        </span>
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: "radial-gradient(#5a72d814 1.3px, transparent 1.3px)", backgroundSize: "26px 26px" }}
        />
        <Confetti count={18} />
      </div>

      {/* Bar atas */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-[3vw] pt-[2.5vh]">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-4 py-1.5 text-[clamp(0.75rem,0.9vw,1rem)] font-bold shadow-sm ${theme.chip}`}>
            Paslon {candidate.nomor}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-[clamp(0.7rem,0.85vw,0.95rem)] font-semibold text-slate-600 ring-1 ring-white backdrop-blur">
            {index + 1} / {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsAutoplay((on) => !on)}
              aria-pressed={isAutoplay}
              className="hidden rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-ink shadow-sm ring-1 ring-white backdrop-blur transition hover:bg-white sm:block"
            >
              {isAutoplay ? "⏸ Jeda" : "▶ Putar otomatis"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-ink shadow-sm ring-1 ring-white backdrop-blur transition hover:bg-white sm:block"
          >
            {isFullscreen ? "🗗 Keluar layar penuh" : "⛶ Layar penuh"}
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-lg font-bold text-white shadow-lg transition hover:scale-105"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Isi */}
      <main
        key={candidate.id}
        className="grid min-h-0 flex-1 gap-[3vw] overflow-y-auto px-[3vw] py-[3vh] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:overflow-hidden"
      >
        {/* Foto & nama */}
        <section className="fx-pop-in flex min-h-0 flex-col">
          <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-[2.5rem] bg-white shadow-[0_40px_80px_-40px_rgba(31,42,72,0.55)] ring-8 ring-white/80 lg:min-h-0">
            <CandidatePhoto src={candidate.foto} nomor={candidate.nomor} ketua={candidate.ketua} wakil={candidate.wakil} />
            <span
              className={`absolute left-[1.5vw] top-[1.5vw] flex h-[clamp(4rem,7vw,8rem)] w-[clamp(4rem,7vw,8rem)] -rotate-6 items-center justify-center rounded-[1.75rem] font-display text-[clamp(2rem,3.6vw,4.5rem)] font-bold shadow-xl ring-4 ring-white ${theme.sticker}`}
            >
              {candidate.nomor}
            </span>
          </div>

          {/* Kartu profil: posisi, nama, kelas — sedikit menumpuk foto */}
          <div className="relative z-10 -mt-[7vh] grid grid-cols-2 gap-[1.2vw] px-[1.2vw]">
            {[
              { role: "Calon Ketua", icon: "👑", name: candidate.ketua, kelas: candidate.ketuaKelas, lead: true },
              { role: "Calon Wakil", icon: "🤝", name: candidate.wakil, kelas: candidate.wakilKelas, lead: false },
            ].map((person) => (
              <div
                key={person.role}
                className="relative overflow-hidden rounded-[1.75rem] bg-white/95 px-[1.4vw] pb-[2vh] pt-[1.8vh] shadow-[0_24px_50px_-28px_rgba(31,42,72,0.55)] ring-1 ring-white backdrop-blur"
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.bar}`} />
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[clamp(0.65rem,min(0.85vw,1.5vh),1rem)] font-bold uppercase tracking-[0.14em] ${
                    person.lead ? theme.chip : `ring-1 ${theme.soft} ${theme.accent}`
                  }`}
                >
                  <span aria-hidden="true" className="text-[1.15em] normal-case">{person.icon}</span>
                  {person.role}
                </span>
                <p className="mt-[1.2vh] line-clamp-2 font-display text-[clamp(1.1rem,min(1.75vw,3.1vh),2.4rem)] font-bold leading-tight">
                  {person.name}
                </p>
                <p className="mt-[0.8vh] inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[clamp(0.7rem,min(0.9vw,1.6vh),1.1rem)] font-semibold text-slate-600">
                  <span aria-hidden="true">🎓</span>
                  {person.kelas || "Kelas belum diisi"}
                </p>
              </div>
            ))}
            <span
              aria-hidden="true"
              className={`absolute left-1/2 top-1/2 flex h-[clamp(2.25rem,3vw,3.5rem)] w-[clamp(2.25rem,3vw,3.5rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-[clamp(1rem,1.4vw,1.75rem)] font-bold shadow-lg ring-4 ring-white ${theme.sticker}`}
            >
              &amp;
            </span>
          </div>
        </section>

        {/* Slogan & visi */}
        <section ref={fitRef} className="fx-rise flex min-h-0 flex-col gap-[calc(var(--fit,1)*2.5vh)]" style={{ "--delay": "120ms" }}>
          {candidate.slogan && (
            <figure className="relative flex items-center gap-[1.2vw] overflow-hidden rounded-[1.75rem] bg-white/85 py-[1.8vh] pl-[1.6vw] pr-[2vw] shadow-[0_20px_44px_-30px_rgba(31,42,72,0.5)] ring-1 ring-white backdrop-blur">
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-2 bg-gradient-to-b ${theme.bar}`} />
              <span
                aria-hidden="true"
                className={`flex h-[clamp(2.5rem,min(3.4vw,6vh),4rem)] w-[clamp(2.5rem,min(3.4vw,6vh),4rem)] shrink-0 items-center justify-center overflow-hidden rounded-2xl font-display text-[clamp(3rem,min(4.6vw,8vh),5.5rem)] leading-none ${theme.sticker}`}
              >
                <span className="translate-y-[0.22em]">&ldquo;</span>
              </span>
              <div className="min-w-0">
                <figcaption className={`text-[clamp(0.65rem,min(0.8vw,1.4vh),0.95rem)] font-bold uppercase tracking-[0.3em] ${theme.accent}`}>
                  Slogan
                </figcaption>
                <blockquote className="mt-0.5 line-clamp-2 font-display text-[calc(var(--fit,1)*clamp(1.05rem,min(1.75vw,3.1vh),2.2rem))] font-semibold italic leading-snug">
                  {candidate.slogan}
                </blockquote>
              </div>
            </figure>
          )}

          <div className="flex min-h-0 flex-1 flex-col rounded-[2.25rem] bg-white/80 p-[2.2vw] shadow-[0_30px_60px_-40px_rgba(31,42,72,0.45)] ring-1 ring-white backdrop-blur">
            <p className={`text-[clamp(0.75rem,0.95vw,1.1rem)] font-bold uppercase tracking-[0.3em] ${theme.accent}`}>Visi</p>
            <div ref={measureRef} className="mt-[1.5vh] min-h-0 flex-1 overflow-y-auto pr-2">
              <p className={`font-display font-medium leading-snug ${visiSizeClass(candidate.visi)}`}>
                {candidate.visi || "Visi pasangan calon belum diisi oleh panitia."}
              </p>

              <div
                className={`mt-[calc(var(--fit,1)*3vh)] grid gap-x-[2.5vw] gap-y-[3vh] ${
                  misi.length > 0 && programKerja.length > 0 ? "xl:grid-cols-[1.25fr_1fr]" : ""
                }`}
              >
              {misi.length > 0 && (
                <div>
                  <p className={`text-[clamp(0.75rem,0.95vw,1.1rem)] font-bold uppercase tracking-[0.3em] ${theme.accent}`}>Misi</p>
                  <ol className="mt-[1.5vh] space-y-[1.2vh]">
                    {misi.map((item, i) => (
                      <li key={i} className="flex items-start gap-[1vw] text-[calc(var(--fit,1)*clamp(0.95rem,min(1.3vw,2.3vh),1.6rem))] leading-snug">
                        <span
                          className={`mt-0.5 flex h-[1.8em] w-[1.8em] shrink-0 items-center justify-center rounded-xl font-display text-[0.8em] font-bold ${theme.sticker}`}
                        >
                          {i + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {programKerja.length > 0 && (
                <div>
                  <p className={`text-[clamp(0.75rem,0.95vw,1.1rem)] font-bold uppercase tracking-[0.3em] ${theme.accent}`}>
                    Program kerja
                  </p>
                  <div className="mt-[1.5vh] flex flex-wrap gap-[0.8vw]">
                    {programKerja.map((item, i) => (
                      <span
                        key={i}
                        className={`rounded-2xl px-[1.1vw] py-[0.8vh] text-[calc(var(--fit,1)*clamp(0.85rem,min(1.1vw,2vh),1.4rem))] font-semibold ring-1 ${theme.soft}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Navigasi bawah */}
      {total > 1 && (
        <footer className="relative flex shrink-0 items-center justify-center gap-4 px-[3vw] pb-[2.5vh]">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Paslon sebelumnya"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-xl font-bold shadow-md ring-1 ring-white transition hover:-translate-x-0.5 hover:bg-white"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            {candidates.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => showIndex(i)}
                aria-label={`Paslon ${c.nomor}`}
                aria-current={i === index}
                className={`h-3 rounded-full transition-all duration-300 ${i === index ? "w-10 bg-ink" : "w-3 bg-ink/25 hover:bg-ink/40"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Paslon berikutnya"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-xl font-bold shadow-md ring-1 ring-white transition hover:translate-x-0.5 hover:bg-white"
          >
            →
          </button>

          {/* Sisa waktu putar otomatis */}
          {isAutoplay && (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/40">
              <span
                key={`${index}-progress`}
                className={`fx-progress block h-full bg-gradient-to-r ${theme.bar}`}
                style={{ "--dur": `${AUTOPLAY_MS}ms` }}
              />
            </span>
          )}
        </footer>
      )}
    </div>
  );
}
