/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  getAcademicYear,
  getCandidatesList,
  getEventConfig,
  subscribeVotingStorage,
} from "@/lib/votingStorage";
import { BallotBox, Bunting, Confetti, FestiveBackdrop, Reveal } from "@/components/Festive";

function formatSchedule(value) {
  if (!value) return "Belum dijadwalkan";
  return new Date(value).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCountdown(target, now) {
  const diff = Math.max(0, new Date(target) - now);
  return {
    hari: Math.floor(diff / 86400000),
    jam: Math.floor((diff % 86400000) / 3600000),
    menit: Math.floor((diff % 3600000) / 60000),
    detik: Math.floor((diff % 60000) / 1000),
  };
}

// Tentukan fase event dari status + jadwal
function getEventPhase(config, now) {
  const start = config.startTime ? new Date(config.startTime) : null;
  const end = config.endTime ? new Date(config.endTime) : null;

  if (start && now < start) return "upcoming";
  if (end && now >= end) return "finished";
  return config.status === "open" ? "open" : "closed";
}

const COUNTDOWN_TILES = {
  hari: "bg-violet-600 text-white shadow-violet-400/25",
  jam: "bg-sun text-ink shadow-amber-300/40",
  menit: "bg-coral text-ink shadow-rose-300/40",
  detik: "bg-mint text-ink shadow-emerald-300/40",
};

const CARD_ACCENTS = [
  {
    band: "bg-violet-200",
    sticker: "bg-sun text-ink",
    ring: "ring-violet-100",
    back: "from-[#e4e9ff] via-[#efeaff] to-[#fde9f1]",
    label: "text-violet-700",
  },
  {
    band: "bg-coral",
    sticker: "bg-violet-600 text-white",
    ring: "ring-rose-100",
    back: "from-[#ffe4eb] via-[#fff0ea] to-[#fff6dc]",
    label: "text-rose-700",
  },
  {
    band: "bg-mint",
    sticker: "bg-coral text-ink",
    ring: "ring-emerald-100",
    back: "from-[#dcf6ee] via-[#e9f6f7] to-[#e4ecff]",
    label: "text-emerald-700",
  },
  {
    band: "bg-sun",
    sticker: "bg-mint text-ink",
    ring: "ring-amber-100",
    back: "from-[#fff3d6] via-[#fff1e6] to-[#ffe6ec]",
    label: "text-amber-700",
  },
];

const STEPS = [
  { icon: "📝", title: "Daftar ulang", text: "Datang ke meja pendaftaran dan tunjukkan kartu pelajar.", color: "bg-violet-600" },
  { icon: "⏳", title: "Tunggu dipanggil", text: "Duduk santai sampai namamu dipanggil petugas.", color: "bg-sun" },
  { icon: "🗳️", title: "Masuk bilik", text: "Masuk ke bilik yang ditunjuk, lalu pilih pasangan calon.", color: "bg-coral" },
  { icon: "🎉", title: "Suaramu tercatat", text: "Selesai! Setiap siswa hanya bisa memilih satu kali.", color: "bg-mint" },
];

export default function LandingPage() {
  const [eventConfig, setEventConfig] = useState({ status: "open", startTime: "", endTime: "" });
  const [candidates, setCandidates] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [now, setNow] = useState(null);
  const [flippedId, setFlippedId] = useState(null);

  // Di layar sentuh tidak ada hover → kartu dibalik dengan ketukan
  function handleCardTap(id) {
    if (window.matchMedia("(hover: hover)").matches) return;
    setFlippedId((current) => (current === id ? null : id));
  }

  useEffect(() => {
    function loadData() {
      setEventConfig(getEventConfig());
      setCandidates(getCandidatesList());
      setAcademicYear(getAcademicYear());
    }

    loadData();
    setNow(new Date());

    const timer = setInterval(() => setNow(new Date()), 1000);
    const unsubscribe = subscribeVotingStorage(loadData);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const phase = now ? getEventPhase(eventConfig, now) : null;
  const countdownTarget =
    phase === "upcoming" ? eventConfig.startTime : phase === "open" ? eventConfig.endTime : "";
  const countdown = countdownTarget && now ? getCountdown(countdownTarget, now) : null;

  return (
    <main className="flex-1 overflow-x-clip bg-white font-body text-ink">
      <Navbar />

      {/* HERO */}
      <section className="relative isolate">
        <FestiveBackdrop confetti={34} />
        <Bunting className="relative" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-32 lg:pt-10">
          <div className="text-center lg:text-left">
            <h1
              className="fx-rise font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-violet-700 sm:text-6xl lg:text-7xl"
              style={{ "--delay": "120ms" }}
            >
              Ayo pilih ketua OSIS-mu!
            </h1>

            <svg
              aria-hidden="true"
              viewBox="0 0 320 24"
              className="fx-rise mx-auto mt-2 h-5 w-64 sm:w-80 lg:mx-0"
              style={{ "--delay": "200ms" }}
            >
              <path
                className="fx-draw"
                d="M4 14 C 40 4, 70 22, 108 12 S 176 4, 214 14 S 282 22, 316 8"
                fill="none"
                stroke="#ffd98a"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>

            <p
              className="fx-rise mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0"
              style={{ "--delay": "260ms" }}
            >
              Pemilihan Ketua &amp; Wakil Ketua OSIS SMK Al Amanah
              {academicYear ? ` tahun ajaran ${academicYear}` : ""}. Satu siswa, satu suara, semuanya rahasia.
            </p>

            <div
              className="fx-rise mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
              style={{ "--delay": "340ms" }}
            >
              <a
                href="#paslon"
                className="rounded-full bg-sun px-6 py-3 text-sm font-extrabold text-ink shadow-lg shadow-amber-300/40 transition hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
              >
                Kenali pasangan calon
              </a>
              <a
                href="#alur"
                className="rounded-full border-2 border-ink/10 bg-white/80 px-6 py-3 text-sm font-bold text-ink backdrop-blur transition hover:-translate-y-1 hover:border-violet-300 active:translate-y-0"
              >
                Cara memilih
              </a>
            </div>

            {/* COUNTDOWN */}
            {countdown && (
              <div className="fx-rise mt-10" style={{ "--delay": "440ms" }}>
                <p className="text-sm font-semibold text-slate-600">
                  {phase === "upcoming" ? "Pemungutan suara dimulai dalam" : "Pemungutan suara berakhir dalam"}
                </p>
                <div className="mx-auto mt-3 grid max-w-md grid-cols-4 gap-2.5 sm:gap-3 lg:mx-0">
                  {Object.entries(countdown).map(([unit, value], i) => (
                    <div
                      key={unit}
                      className={`overflow-hidden rounded-2xl px-2 py-3 text-center shadow-lg ${COUNTDOWN_TILES[unit]}`}
                      style={{ rotate: `${i % 2 === 0 ? -2 : 2}deg` }}
                    >
                      <p className="font-display text-3xl font-bold tabular-nums sm:text-4xl">
                        <span key={value} className="fx-digit">
                          {String(value).padStart(2, "0")}
                        </span>
                      </p>
                      <p className="text-xs font-semibold opacity-85">{unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JADWAL */}
            <div
              className="fx-rise mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-2 lg:mx-0"
              style={{ "--delay": "520ms" }}
            >
              <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-soft text-lg">🚩</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Dibuka</p>
                  <p className="mt-0.5 text-sm font-bold">{formatSchedule(eventConfig.startTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-lg">🏁</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Ditutup</p>
                  <p className="mt-0.5 text-sm font-bold">{formatSchedule(eventConfig.endTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ILUSTRASI KOTAK SUARA */}
          <div className="fx-pop-in relative mx-auto w-full max-w-sm lg:max-w-md" style={{ "--delay": "300ms" }}>
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-sun/50 via-coral/30 to-mint/40 blur-2xl" />
            <div className="absolute inset-0 m-auto h-[82%] w-[82%] rounded-full border-[3px] border-dashed border-violet-300/70" />
            <BallotBox className="relative w-full drop-shadow-xl" />
          </div>
        </div>

        {/* GELOMBANG PEMISAH */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 overflow-hidden">
          <svg className="fx-wave absolute bottom-0 left-0 h-16 w-[200%]" viewBox="0 0 2880 64" preserveAspectRatio="none">
            <path
              d="M0 32 Q 180 0 360 32 T 720 32 T 1080 32 T 1440 32 T 1800 32 T 2160 32 T 2520 32 T 2880 32 V64 H0 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* PASLON */}
      <section id="paslon" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-4xl font-bold text-violet-700 sm:text-5xl">Kenali pasangan calon</h2>
          <p className="mt-3 text-base text-slate-600">
            Baca visi mereka dulu sebelum hari pemilihan, supaya pilihanmu mantap.
          </p>
        </Reveal>

        {candidates.length === 0 ? (
          <Reveal className="mt-10 flex flex-col items-center rounded-[2rem] border-[3px] border-dashed border-violet-200 bg-sky/60 px-6 py-14 text-center">
            <span className="fx-float text-5xl" style={{ "--dur": "4s" }}>🎈</span>
            <p className="mt-4 font-display text-2xl font-semibold text-violet-700">Pasangan calon belum diumumkan</p>
            <p className="mt-1 text-sm text-slate-500">Cek lagi halaman ini setelah panitia mengumumkan daftar calon.</p>
          </Reveal>
        ) : (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate, index) => {
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              const isFlipped = flippedId === candidate.id;
              return (
                <Reveal key={candidate.id} delay={index * 120} className="h-full">
                  <article
                    tabIndex={0}
                    aria-label={`Paslon ${candidate.nomor}: ${candidate.ketua} dan ${candidate.wakil}`}
                    onClick={() => handleCardTap(candidate.id)}
                    className={`flip-card group h-full rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
                      isFlipped ? "is-flipped" : ""
                    }`}
                  >
                    <div className="flip-inner">
                      {/* DEPAN — foto & nama */}
                      <div
                        className={`flip-face flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_44px_-26px_rgba(31,42,72,0.35)] ring-1 ${accent.ring}`}
                      >
                        <div className={`relative aspect-[4/3] shrink-0 overflow-hidden ${accent.band}`}>
                          <Confetti count={8} />
                          {candidate.foto && (
                            <img
                              src={candidate.foto}
                              alt={`${candidate.ketua} dan ${candidate.wakil}`}
                              className="relative h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                          {/* Pudar ke putih agar foto menyatu dengan isi kartu */}
                          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white to-transparent" />
                          <span
                            className={`absolute left-4 top-4 flex h-14 w-14 -rotate-6 items-center justify-center rounded-2xl font-display text-2xl font-bold shadow-lg ring-2 ring-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${accent.sticker}`}
                          >
                            {candidate.nomor}
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base font-bold text-violet-700 shadow-md backdrop-blur transition-transform duration-500 group-hover:rotate-180"
                          >
                            ↻
                          </span>
                        </div>

                        <div className="relative flex flex-1 flex-col items-center px-6 pb-7 pt-2 text-center">
                          <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${accent.label}`}>
                            Paslon {candidate.nomor}
                          </p>

                          <p className="mt-2 font-display text-2xl font-bold leading-tight text-ink">{candidate.ketua}</p>

                          <div className="my-2 flex w-full max-w-[14rem] items-center gap-3">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-200" />
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 font-display text-sm font-bold text-violet-600 ring-1 ring-violet-100">
                              &amp;
                            </span>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-200" />
                          </div>

                          <p className="font-display text-2xl font-bold leading-tight text-ink">{candidate.wakil}</p>

                          {candidate.slogan && (
                            <div className="mt-auto flex w-full flex-col pt-5">
                              <p className="flex min-h-[4.25rem] w-full items-center justify-center rounded-2xl bg-violet-50/80 px-4 py-3 text-center text-sm font-semibold italic leading-relaxed text-violet-700 ring-1 ring-violet-100">
                                &ldquo;{candidate.slogan}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BELAKANG — visi */}
                      <div
                        className={`flip-face flip-back relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br p-7 shadow-[0_18px_44px_-26px_rgba(31,42,72,0.35)] ring-1 ${accent.ring} ${accent.back}`}
                      >
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                          <Confetti count={10} />
                          <span className="absolute -bottom-10 -right-4 select-none font-display text-[11rem] font-bold leading-none text-white/60">
                            {candidate.nomor}
                          </span>
                          <span className="absolute -left-10 -top-10 h-36 w-36 rounded-full border-[14px] border-white/45" />
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-11 w-11 rotate-6 items-center justify-center rounded-2xl font-display text-xl font-bold shadow-md ${accent.sticker}`}
                          >
                            {candidate.nomor}
                          </span>
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${accent.label}`}>Visi paslon</p>
                            <p className="text-sm font-semibold text-slate-600">
                              {candidate.ketua.split(" ")[0]} &amp; {candidate.wakil.split(" ")[0]}
                            </p>
                          </div>
                        </div>

                        <span aria-hidden="true" className={`mt-5 font-display text-6xl leading-none ${accent.label} opacity-40`}>
                          &ldquo;
                        </span>
                        <p className="-mt-4 font-display text-lg font-medium leading-relaxed text-ink sm:text-xl">
                          {candidate.visi || "Visi pasangan calon belum diisi oleh panitia."}
                        </p>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* ALUR */}
      <section id="alur" className="relative scroll-mt-20 overflow-hidden bg-sky py-16">
        <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sun/30 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-violet-700 sm:text-5xl">Cara memilih di TPS</h2>
            <p className="mt-3 text-base text-slate-600">Empat langkah, kurang dari lima menit.</p>
          </Reveal>

          <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-8 hidden border-t-[3px] border-dashed border-violet-300 lg:block" />
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 140} className="relative">
                <div className="group h-full rounded-[1.75rem] bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <span
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 ${step.color}`}
                  >
                    {step.icon}
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </span>
                  <p className="mt-5 font-display text-xl font-semibold">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
