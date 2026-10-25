"use client";

import { useEffect, useMemo, useState } from "react";
import { Confetti, ConfettiBurst } from "@/components/Festive";
import CandidatePhoto from "@/components/CandidatePhoto";

// Urutan acara: hitung mundur → surat suara dibuka satu per satu → jeda dramatis → pengumuman.
// Setelah pengumuman, angka mengikuti data langsung sehingga suara baru tetap masuk.
const COUNTDOWN = [3, 2, 1];
const COUNTDOWN_STEP = 900;
const SUSPENSE_MS = 2200;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Lambat di awal, cepat di tengah, melambat lagi di akhir → menegangkan
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function pickWinner(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0 || entries[0][1] === 0) return { winnerId: null, tiedIds: [] };
  const top = entries[0][1];
  const tied = entries.filter(([, c]) => c === top).map(([id]) => Number(id));
  return tied.length === 1 ? { winnerId: tied[0], tiedIds: [] } : { winnerId: null, tiedIds: tied };
}

// "+n" melayang setiap kali angka paslon bertambah
function GainBadge({ value }) {
  const [state, setState] = useState({ last: value, gain: 0, key: 0 });

  if (value !== state.last) {
    setState({ last: value, gain: value - state.last, key: state.key + 1 });
  }

  if (state.gain <= 0) return null;

  return (
    <span
      key={state.key}
      aria-hidden="true"
      className="fx-plus-one absolute left-full top-0 ml-7 whitespace-nowrap rounded-full bg-mint px-2 py-0.5 text-sm font-bold text-ink shadow-md"
    >
      +{state.gain}
    </span>
  );
}

const STICKERS = ["bg-sun text-ink", "bg-coral text-ink", "bg-mint text-ink", "bg-lilac text-ink"];

export default function VoteCountShow({ candidateStats, academicYear, onClose, onRevealed }) {
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("countdown"); // countdown | counting | suspense | reveal
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [counted, setCounted] = useState(0);

  // Surat suara dibekukan saat penghitungan dimulai, lalu diacak urutannya
  const ballots = useMemo(
    () => shuffle(candidateStats.flatMap((s) => s.votesLog.map(() => s.candidate.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runId]
  );

  useEffect(() => {
    const timers = [];
    let frame;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    queueMicrotask(() => {
      setCounted(0);
      setCountdownIndex(0);

      if (reduceMotion || ballots.length === 0) {
        setCounted(ballots.length);
        setPhase("reveal");
        return;
      }

      setPhase("countdown");
      COUNTDOWN.forEach((_, i) => timers.push(setTimeout(() => setCountdownIndex(i), i * COUNTDOWN_STEP)));

      timers.push(
        setTimeout(() => {
          setPhase("counting");
          const duration = Math.min(9000, Math.max(3200, ballots.length * 260));
          const start = performance.now();

          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            setCounted(Math.round(ballots.length * easeInOutCubic(progress)));
            if (progress < 1) {
              frame = requestAnimationFrame(tick);
            } else {
              setPhase("suspense");
              timers.push(setTimeout(() => setPhase("reveal"), SUSPENSE_MS));
            }
          }
          frame = requestAnimationFrame(tick);
        }, COUNTDOWN.length * COUNTDOWN_STEP)
      );
    });

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [ballots]);

  // Esc untuk menutup + kunci scroll halaman di belakang
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const isLive = phase === "reveal";

  // Hasil resmi terbuka untuk semua penonton begitu pengumuman tampil
  useEffect(() => {
    if (isLive) onRevealed?.();
  }, [isLive, runId, onRevealed]);

  // Angka yang tampil: hasil hitungan berjalan, atau data langsung setelah pengumuman
  const counts = useMemo(() => {
    const result = Object.fromEntries(candidateStats.map((s) => [s.candidate.id, 0]));
    if (isLive) {
      candidateStats.forEach((s) => {
        result[s.candidate.id] = s.count;
      });
    } else {
      ballots.slice(0, counted).forEach((id) => {
        result[id] = (result[id] || 0) + 1;
      });
    }
    return result;
  }, [candidateStats, ballots, counted, isLive]);

  const shownTotal = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const { winnerId, tiedIds } = pickWinner(counts);
  const leaderNow = phase === "counting" || phase === "suspense" ? winnerId : null;
  const winner = isLive ? candidateStats.find((s) => s.candidate.id === winnerId)?.candidate : null;
  const hasVotes = isLive && shownTotal > 0;
  const columns = candidateStats.length >= 3 ? "lg:grid-cols-3" : candidateStats.length === 2 ? "sm:grid-cols-2" : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Penghitungan suara"
      className="fixed inset-0 z-[80] isolate overflow-y-auto bg-gradient-to-br from-[#1c2340] via-[#262b55] to-[#2f2552] font-body text-white"
    >
      {/* Sorotan panggung */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-violet-400/25 blur-[120px]" />
        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-coral/20 blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-sun/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(#ffffff22 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />
        {hasVotes && winner && (
          <>
            <Confetti count={70} />
            <ConfettiBurst count={70} />
          </>
        )}
      </div>

      {/* Tombol atas */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold ring-1 ring-white/15 backdrop-blur">
          {isLive ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-mint" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-mint" />
              </span>
              Live — suara baru langsung masuk
            </>
          ) : (
            <>🗳️ Penghitungan suara {academicYear}</>
          )}
        </span>
        <div className="flex gap-2">
          {isLive && shownTotal > 0 && (
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              ↻ Hitung ulang
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-lg transition hover:-translate-y-0.5"
          >
            Tutup ✕
          </button>
        </div>
      </div>

      {/* HITUNG MUNDUR */}
      {phase === "countdown" && (
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-violet-200">Penghitungan dimulai dalam</p>
          <span
            key={countdownIndex}
            className="fx-countdown mt-4 font-display text-[9rem] font-bold leading-none text-sun drop-shadow-[0_10px_40px_rgba(255,217,138,0.45)] sm:text-[12rem]"
          >
            {COUNTDOWN[countdownIndex]}
          </span>
          <p className="mt-4 text-sm text-white/60">{ballots.length} surat suara siap dibuka</p>
        </div>
      )}

      {phase !== "countdown" && (
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
          {/* JUDUL FASE */}
          <div className="mb-10 text-center">
            {phase === "counting" && (
              <>
                <h2 className="font-display text-4xl font-bold sm:text-5xl">Membuka surat suara…</h2>
                <div className="mx-auto mt-5 max-w-md">
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-300 via-coral to-sun"
                      style={{ width: `${ballots.length ? (counted / ballots.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold tabular-nums text-white/70">
                    {counted} / {ballots.length} surat suara dihitung
                  </p>
                </div>
              </>
            )}

            {phase === "suspense" && (
              <>
                <p className="fx-drumroll inline-block text-5xl">🥁</p>
                <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Dan pemenangnya adalah…</h2>
              </>
            )}

            {isLive && winner && (
              <div className="fx-slam">
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-sun">🏆 Pemenang 🏆</p>
                <h2 className="mt-2 font-display text-5xl font-bold leading-tight sm:text-6xl">Paslon {winner.nomor}</h2>
                <p className="mt-2 text-lg font-semibold text-white/80">
                  {winner.ketua} &amp; {winner.wakil}
                </p>
              </div>
            )}

            {isLive && !winner && tiedIds.length > 0 && (
              <div className="fx-slam">
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-violet-200">🤝 Hasil sementara</p>
                <h2 className="mt-2 font-display text-5xl font-bold sm:text-6xl">Seri!</h2>
                <p className="mt-2 text-white/70">
                  {tiedIds.length} paslon memperoleh suara yang sama. Belum ada pemenang.
                </p>
              </div>
            )}

            {isLive && shownTotal === 0 && (
              <div className="fx-slam">
                <p className="text-6xl">📭</p>
                <h2 className="mt-3 font-display text-4xl font-bold">Belum ada suara</h2>
                <p className="mt-2 text-white/70">Layar ini tetap terbuka — suara yang masuk akan langsung terhitung.</p>
              </div>
            )}
          </div>

          {/* KARTU PASLON */}
          <div className={`grid gap-6 ${columns}`}>
            {candidateStats.map(({ candidate }, index) => {
              const value = counts[candidate.id] || 0;
              const pct = shownTotal > 0 ? (value / shownTotal) * 100 : 0;
              const isWinner = isLive && winnerId === candidate.id;
              const isTied = isLive && tiedIds.includes(candidate.id);
              const isLeading = leaderNow === candidate.id;
              const dimmed = isLive && winnerId !== null && !isWinner;

              return (
                <div
                  key={candidate.id}
                  className={`relative transition-all duration-700 ${
                    isWinner ? "z-10 sm:scale-[1.05]" : dimmed ? "scale-[0.95] opacity-55 saturate-50" : ""
                  } ${phase === "suspense" ? "fx-drumroll" : ""}`}
                >
                  {/* Sinar di belakang pemenang */}
                  {isWinner && (
                    <div
                      aria-hidden="true"
                      className="fx-rays pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] rounded-full opacity-60"
                      style={{
                        background:
                          "repeating-conic-gradient(from 0deg, rgba(255,217,138,0.35) 0deg 10deg, transparent 10deg 24deg)",
                        maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
                        WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
                      }}
                    />
                  )}
                  {isWinner && (
                    <span aria-hidden="true" className="fx-crown-drop absolute -top-12 left-1/2 z-20 text-6xl drop-shadow-lg">
                      👑
                    </span>
                  )}

                  <div
                    className={`overflow-hidden rounded-[2rem] bg-white text-ink shadow-2xl ring-4 transition-all duration-500 ${
                      isWinner
                        ? "fx-glow-pulse ring-sun"
                        : isTied
                          ? "ring-violet-300"
                          : isLeading
                            ? "ring-sun/70"
                            : "ring-white/10"
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#e4e9ff] to-[#fde9f1]">
                      <CandidatePhoto src={candidate.foto} nomor={candidate.nomor} ketua={candidate.ketua} wakil={candidate.wakil} />
                      <span
                        className={`absolute left-4 top-4 flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl font-display text-xl font-bold shadow-lg ring-2 ring-white ${
                          STICKERS[index % STICKERS.length]
                        }`}
                      >
                        {candidate.nomor}
                      </span>
                      {isLeading && (
                        <span className="fx-pop-in absolute right-4 top-4 rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink shadow-md">
                          🔥 Memimpin
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="truncate font-display text-lg font-semibold">
                        {candidate.ketua} &amp; {candidate.wakil}
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="relative font-display text-6xl font-bold tabular-nums leading-none text-violet-700">
                          <span key={value} className="fx-bump inline-block">
                            {value}
                          </span>
                          <GainBadge value={value} />
                        </p>
                        <p className="pb-1 text-2xl font-bold tabular-nums text-slate-400">{pct.toFixed(1)}%</p>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                            isWinner ? "bg-gradient-to-r from-sun to-coral" : "bg-gradient-to-r from-violet-300 to-violet-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
