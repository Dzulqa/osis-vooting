"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CandidatePhoto from "@/components/CandidatePhoto";
import { Bunting, Confetti, ConfettiBurst } from "@/components/Festive";

// Mode debat untuk layar papan: siapa yang bicara, sisa waktu dalam cincin besar,
// hitung mundur 3-2-1, peringatan 30 & 10 detik, lalu "Waktu habis!" yang dramatis.
// Dioperasikan moderator dari laptop yang tersambung ke papan (tidak disinkronkan ke server).

const SEGMENTS = [
  { id: "visi", label: "Pemaparan visi & misi", icon: "📣", seconds: 180 },
  { id: "jawab", label: "Menjawab pertanyaan", icon: "💬", seconds: 120 },
  { id: "tanggap", label: "Tanggapan", icon: "⚡", seconds: 60 },
  { id: "penutup", label: "Pernyataan penutup", icon: "🌟", seconds: 60 },
];

const STEP_MS = 15000;
const MIN_MS = 15000;
const MAX_MS = 30 * 60000;
const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

function formatClock(ms) {
  const total = Math.ceil(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function phaseOf(remaining, duration) {
  if (remaining <= 0) return "over";
  if (remaining <= 10000) return "final";
  if (remaining / duration <= 0.2 || remaining <= 30000) return "low";
  if (remaining / duration <= 0.5) return "mid";
  return "calm";
}

const PHASES = {
  calm: { ring: "#8fdcc4", glow: "rgba(143,220,196,0.45)", label: "Waktu tersisa", chip: "bg-mint text-ink" },
  mid: { ring: "#ffd98a", glow: "rgba(255,217,138,0.45)", label: "Waktu tersisa", chip: "bg-sun text-ink" },
  low: { ring: "#fda4af", glow: "rgba(253,164,175,0.5)", label: "⚡ Sebentar lagi!", chip: "bg-coral text-ink" },
  final: { ring: "#fb7185", glow: "rgba(251,113,133,0.6)", label: "🔥 Detik-detik terakhir!", chip: "bg-rose-500 text-white" },
  over: { ring: "#f43f5e", glow: "rgba(244,63,94,0.6)", label: "⏰ Waktu lewat", chip: "bg-rose-600 text-white" },
};

// Bunyi kecil lewat Web Audio (tanpa file): "tik" di 5 detik terakhir, "ding-ding-ding" saat habis
function useBeeper(enabled) {
  const ctxRef = useRef(null);

  const beep = useCallback(
    (frequency, duration = 0.12, delay = 0, volume = 0.18) => {
      if (!enabled || typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctxRef.current) ctxRef.current = new AudioCtx();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    },
    [enabled]
  );

  return useMemo(
    () => ({
      tick: () => beep(880, 0.08, 0, 0.12),
      go: () => beep(1320, 0.25, 0, 0.2),
      count: () => beep(660, 0.12, 0, 0.15),
      timeUp: () => [0, 0.28, 0.56].forEach((d, i) => beep(i === 2 ? 1046 : 784, 0.32, d, 0.25)),
    }),
    [beep]
  );
}

export default function DebateStage({ candidates, startIndex = 0, onClose, onToggleFullscreen, isFullscreen }) {
  const total = candidates.length;
  const [speakerIndex, setSpeakerIndex] = useState(startIndex);
  const [segmentId, setSegmentId] = useState(SEGMENTS[0].id);
  const [duration, setDuration] = useState(SEGMENTS[0].seconds * 1000);

  // ready → countin → running ⇄ paused
  const [status, setStatus] = useState("ready");
  const [remainingAtPause, setRemainingAtPause] = useState(SEGMENTS[0].seconds * 1000);
  const [endsAt, setEndsAt] = useState(0);
  const [countInStart, setCountInStart] = useState(0);
  const [now, setNow] = useState(0);
  const [timeUpAt, setTimeUpAt] = useState(0);

  const [finished, setFinished] = useState([]); // indeks paslon yang sudah bicara di segmen ini
  const [question, setQuestion] = useState("");
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  const sound = useBeeper(soundOn);
  const lastSecondRef = useRef(null);

  const speaker = candidates[speakerIndex];
  const segment = SEGMENTS.find((s) => s.id === segmentId) || SEGMENTS[0];

  const remaining = status === "running" ? endsAt - now : remainingAtPause;
  const phase = status === "ready" ? "calm" : phaseOf(remaining, duration);
  const look = PHASES[phase];
  const progress = Math.max(0, Math.min(1, remaining / duration));
  const countInNumber = status === "countin" ? 3 - Math.floor((now - countInStart) / 1000) : null;
  const showStamp = timeUpAt > 0 && now - timeUpAt < 4500;

  // Satu jam internal: menggerakkan hitung mundur, bunyi, dan momen "waktu habis"
  useEffect(() => {
    if (status !== "running" && status !== "countin" && !showStamp) return undefined;

    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);

      if (status === "countin") {
        const step = Math.floor((t - countInStart) / 1000);
        if (step !== lastSecondRef.current) {
          lastSecondRef.current = step;
          if (step < 3) sound.count();
          else if (step === 3) sound.go();
        }
        if (t - countInStart >= 4000) {
          lastSecondRef.current = null;
          setEndsAt(t + remainingAtPause);
          setStatus("running");
        }
        return;
      }

      if (status === "running") {
        const left = endsAt - t;
        const second = Math.ceil(left / 1000);
        if (second !== lastSecondRef.current) {
          lastSecondRef.current = second;
          if (second > 0 && second <= 5) sound.tick();
          if (second === 0) {
            sound.timeUp();
            setTimeUpAt(t);
          }
        }
      }
    }, 100);

    return () => clearInterval(id);
  }, [status, countInStart, endsAt, remainingAtPause, showStamp, sound]);

  // ---------------------------------------------------------------- aksi moderator

  const resetTimer = useCallback(
    (ms = duration) => {
      setStatus("ready");
      setRemainingAtPause(ms);
      setTimeUpAt(0);
      lastSecondRef.current = null;
    },
    [duration]
  );

  const startOrPause = useCallback(() => {
    const t = Date.now();
    setNow(t);
    if (status === "running") {
      setRemainingAtPause(endsAt - t);
      setStatus("paused");
    } else if (status === "paused") {
      setEndsAt(t + remainingAtPause);
      setStatus("running");
    } else if (status === "ready") {
      lastSecondRef.current = null;
      setCountInStart(t);
      setStatus("countin");
    } else if (status === "countin") {
      resetTimer();
    }
  }, [status, endsAt, remainingAtPause, resetTimer]);

  const pickSpeaker = useCallback(
    (i) => {
      setSpeakerIndex(((i % total) + total) % total);
      resetTimer();
    },
    [total, resetTimer]
  );

  const nextSpeaker = useCallback(() => {
    setFinished((done) => (done.includes(speakerIndex) ? done : [...done, speakerIndex]));
    pickSpeaker(speakerIndex + 1);
  }, [speakerIndex, pickSpeaker]);

  const pickSegment = useCallback(
    (seg) => {
      setSegmentId(seg.id);
      setDuration(seg.seconds * 1000);
      setFinished([]);
      resetTimer(seg.seconds * 1000);
    },
    [resetTimer]
  );

  const adjust = useCallback(
    (delta) => {
      if (status === "ready") {
        const next = Math.min(MAX_MS, Math.max(MIN_MS, duration + delta));
        setDuration(next);
        setRemainingAtPause(next);
      } else if (status === "running") {
        setEndsAt((e) => e + delta);
        if (endsAt + delta - Date.now() > 0) setTimeUpAt(0);
      } else if (status === "paused") {
        setRemainingAtPause((r) => r + delta);
        if (remainingAtPause + delta > 0) setTimeUpAt(0);
      }
    },
    [status, duration, endsAt, remainingAtPause]
  );

  // Keyboard untuk moderator (diabaikan saat mengetik pertanyaan)
  useEffect(() => {
    function onKey(e) {
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if (typing) {
        if (e.key === "Escape") document.activeElement.blur();
        return;
      }
      const key = e.key.toLowerCase();
      if (e.key === " ") {
        e.preventDefault();
        startOrPause();
      } else if (key === "r") resetTimer();
      else if (key === "n") nextSpeaker();
      else if (e.key === "ArrowRight") pickSpeaker(speakerIndex + 1);
      else if (e.key === "ArrowLeft") pickSpeaker(speakerIndex - 1);
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        adjust(STEP_MS);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        adjust(-STEP_MS);
      } else if (key === "h") setShowControls((v) => !v);
      else if (key === "m") setSoundOn((v) => !v);
      else if (key === "f") onToggleFullscreen?.();
      else if (e.key === "Escape" && !document.fullscreenElement) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startOrPause, resetTimer, nextSpeaker, pickSpeaker, speakerIndex, adjust, onToggleFullscreen, onClose]);

  if (!speaker) return null;

  const isOver = status !== "ready" && remaining <= 0;
  const speaking = status === "running";
  const digits = isOver ? `+${formatClock(remaining)}` : formatClock(remaining);

  return (
    <div
      className="absolute inset-0 z-30 isolate flex flex-col overflow-hidden bg-[#1b2242] font-body text-white"
      style={{ "--spot": look.glow }}
    >
      {/* PANGGUNG: lampu sorot, konfeti, bendera */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3a4a8f_0%,#1b2242_60%)]" />
        <div
          className="absolute left-[8%] top-[-20%] h-[140%] w-[34vw] origin-top -rotate-[14deg] opacity-70 blur-2xl transition-colors duration-700"
          style={{ background: "linear-gradient(to bottom, var(--spot), transparent 75%)" }}
        />
        <div
          className="absolute right-[8%] top-[-20%] h-[140%] w-[34vw] origin-top rotate-[14deg] opacity-50 blur-2xl transition-colors duration-700"
          style={{ background: "linear-gradient(to bottom, var(--spot), transparent 75%)" }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(#ffffff1a 1.3px, transparent 1.3px)", backgroundSize: "28px 28px" }}
        />
        <Confetti count={14} />
        {phase === "final" || phase === "over" ? (
          <div className="fx-alarm absolute inset-0 shadow-[inset_0_0_14vw_rgba(244,63,94,0.55)]" />
        ) : null}
      </div>
      <Bunting flags={22} className="-mb-6 shrink-0 opacity-90" />

      {/* BAR ATAS */}
      <header className="relative flex shrink-0 items-center justify-between gap-3 px-[3vw] pt-[1vh]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-4 py-1.5 text-[clamp(0.75rem,0.95vw,1.05rem)] font-black uppercase tracking-[0.2em] text-ink shadow-lg">
            🎤 Debat Kandidat
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold ring-1 ring-white/20 backdrop-blur">
            {segment.icon} {segment.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            aria-pressed={soundOn}
            title="Bunyi (M)"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg ring-1 ring-white/20 transition hover:bg-white/20"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Layar penuh (F)"
            className="hidden rounded-full bg-white/10 px-4 py-2 text-xs font-bold ring-1 ring-white/20 transition hover:bg-white/20 sm:block"
          >
            {isFullscreen ? "🗗 Keluar layar penuh" : "⛶ Layar penuh"}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Kembali ke tampilan paslon"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-lg transition hover:scale-105"
          >
            ✕ Tutup debat
          </button>
        </div>
      </header>

      {/* ISI: pembicara | timer */}
      <main className="relative grid min-h-0 flex-1 items-center gap-[3vw] px-[4vw] py-[2vh] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* PEMBICARA */}
        <section key={speaker.id} className="fx-pop-in flex min-h-0 flex-col items-center">
          <div className="relative">
            <div
              className={`relative h-[min(46vh,30vw)] w-[min(38vh,25vw)] overflow-hidden rounded-[2.5rem] bg-white ring-8 transition-[box-shadow] duration-700 ${
                speaking ? "fx-nudge" : ""
              }`}
              style={{ boxShadow: `0 0 0 8px ${look.ring}, 0 0 80px 10px ${look.glow}` }}
            >
              <CandidatePhoto src={speaker.foto} nomor={speaker.nomor} ketua={speaker.ketua} wakil={speaker.wakil} />
            </div>
            <span className="absolute -left-[1.5vw] top-[2vh] flex h-[clamp(3.5rem,min(6vw,11vh),7rem)] w-[clamp(3.5rem,min(6vw,11vh),7rem)] -rotate-12 items-center justify-center rounded-[1.75rem] bg-sun font-display text-[clamp(1.75rem,min(3.2vw,6vh),4rem)] font-bold text-ink shadow-xl ring-4 ring-white">
              {speaker.nomor}
            </span>

            {/* Status bicara */}
            <div className="absolute -bottom-[2.5vh] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2 text-[clamp(0.8rem,1vw,1.15rem)] font-black text-ink shadow-xl">
              {speaking ? (
                <>
                  <span aria-hidden="true" className="flex h-5 items-end gap-[3px]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="fx-equalizer w-1.5 rounded-full bg-rose-500"
                        style={{ height: "100%", "--delay": `${i * 0.12}s`, "--dur": `${0.7 + (i % 3) * 0.2}s` }}
                      />
                    ))}
                  </span>
                  Sedang berbicara
                </>
              ) : status === "paused" ? (
                <>⏸️ Dijeda</>
              ) : status === "countin" ? (
                <>🎬 Bersiap…</>
              ) : (
                <>🎙️ Giliran berikutnya</>
              )}
            </div>
          </div>

          <div className="mt-[5vh] text-center">
            <p className="font-display text-[clamp(1.4rem,min(2.6vw,4.6vh),3.4rem)] font-bold leading-tight">
              {speaker.ketua} <span className="text-sun">&amp;</span> {speaker.wakil}
            </p>
            {speaker.slogan && (
              <p className="mx-auto mt-[1vh] line-clamp-1 max-w-[40vw] text-[clamp(0.85rem,min(1.15vw,2vh),1.4rem)] italic text-white/70">
                &ldquo;{speaker.slogan}&rdquo;
              </p>
            )}
          </div>
        </section>

        {/* TIMER */}
        <section className="flex min-h-0 flex-col items-center justify-center">
          <div className={`relative aspect-square w-[min(58vh,40vw)] ${phase === "final" && speaking ? "fx-heartbeat" : ""}`}>
            <div
              aria-hidden="true"
              className="absolute inset-[8%] rounded-full blur-3xl transition-colors duration-700"
              style={{ background: look.glow }}
            />
            <svg viewBox="0 0 200 200" className="relative h-full w-full -rotate-90">
              <circle cx="100" cy="100" r={RING_R} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
              {Array.from({ length: 60 }, (_, i) => (
                <line
                  key={i}
                  x1="100"
                  y1="4"
                  x2="100"
                  y2={i % 5 === 0 ? 11 : 8}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={i % 5 === 0 ? 1.4 : 0.7}
                  transform={`rotate(${i * 6} 100 100)`}
                />
              ))}
              <circle
                cx="100"
                cy="100"
                r={RING_R}
                fill="none"
                stroke={look.ring}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                style={{ transition: "stroke-dashoffset 120ms linear, stroke 700ms ease" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`rounded-full px-4 py-1 text-[clamp(0.75rem,min(1vw,1.8vh),1.2rem)] font-black uppercase tracking-[0.18em] ${look.chip}`}>
                {status === "ready" ? `${segment.icon} Siap mulai` : look.label}
              </span>
              <p
                key={phase === "final" ? digits : "steady"}
                className={`mt-[1vh] font-display font-bold leading-none tabular-nums text-[clamp(4rem,min(10vw,17vh),13rem)] ${
                  phase === "final" ? "fx-digit text-rose-300" : isOver ? "text-rose-300" : "text-white"
                }`}
                style={{ textShadow: `0 0 40px ${look.glow}` }}
              >
                {digits}
              </p>
              <p className="mt-[1vh] text-[clamp(0.75rem,min(1vw,1.8vh),1.15rem)] font-semibold text-white/60">
                dari {formatClock(duration)} menit
              </p>
            </div>

            {/* 3-2-1 */}
            {countInNumber !== null && countInNumber >= 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#1b2242]/85 backdrop-blur-sm">
                <span
                  key={countInNumber}
                  className="fx-count-in font-display text-[clamp(5rem,min(14vw,24vh),18rem)] font-bold leading-none text-sun"
                >
                  {countInNumber > 0 ? countInNumber : "Mulai!"}
                </span>
              </div>
            )}

            {/* WAKTU HABIS */}
            {showStamp && (
              <>
                <ConfettiBurst count={40} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="fx-stamp rounded-[1.5rem] border-[6px] border-white bg-rose-500 px-[2vw] py-[1.5vh] text-center font-display text-[clamp(2rem,min(4.6vw,8vh),5.5rem)] font-bold uppercase leading-none text-white shadow-[0_20px_60px_-10px_rgba(244,63,94,0.8)]">
                    ⏰ Waktu
                    <br />
                    habis!
                  </span>
                </div>
              </>
            )}
          </div>

          {question.trim() && (
            <div className="fx-rise mt-[3vh] w-full max-w-[44vw] rounded-[1.75rem] bg-white px-[2vw] py-[2vh] text-ink shadow-2xl">
              <p className="text-[clamp(0.7rem,0.9vw,1rem)] font-black uppercase tracking-[0.25em] text-violet-600">❓ Pertanyaan</p>
              <p className="mt-1 line-clamp-3 font-display text-[clamp(1rem,min(1.6vw,2.8vh),2rem)] font-semibold leading-snug">
                {question}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* URUTAN BICARA */}
      <div className="relative flex shrink-0 flex-wrap items-center justify-center gap-2 px-[3vw] pb-[1.5vh]">
        <span className="mr-1 text-[clamp(0.7rem,0.85vw,0.95rem)] font-bold uppercase tracking-[0.2em] text-white/50">Urutan</span>
        {candidates.map((c, i) => {
          const isCurrent = i === speakerIndex;
          const isDone = finished.includes(i) && !isCurrent;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pickSpeaker(i)}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[clamp(0.75rem,0.9vw,1rem)] font-bold transition ${
                isCurrent
                  ? "bg-white text-ink shadow-lg"
                  : isDone
                  ? "bg-white/10 text-white/50 ring-1 ring-white/15"
                  : "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-display ${
                  isCurrent ? "bg-sun text-ink" : isDone ? "bg-mint/70 text-ink" : "bg-white/20"
                }`}
              >
                {isDone ? "✓" : c.nomor}
              </span>
              {isCurrent ? (speaking ? "Bicara" : "Giliran") : isDone ? "Selesai" : "Menunggu"}
            </button>
          );
        })}
      </div>

      {/* PANEL MODERATOR */}
      {showControls ? (
        <footer className="relative shrink-0 px-[2vw] pb-[2vh]">
          {isEditingQuestion && (
            <div className="mx-auto mb-2 max-w-4xl rounded-2xl bg-white p-3 text-ink shadow-2xl">
              <label htmlFor="debate-question" className="text-xs font-bold text-slate-500">
                Pertanyaan yang tampil di papan (kosongkan untuk menyembunyikan)
              </label>
              <textarea
                id="debate-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                autoFocus
                placeholder="Contoh: Apa program pertama kalian untuk kegiatan ekstrakurikuler?"
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setQuestion("")} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">
                  Hapus
                </button>
                <button type="button" onClick={() => setIsEditingQuestion(false)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700">
                  Selesai
                </button>
              </div>
            </div>
          )}

          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 rounded-[1.5rem] bg-white/95 p-2 text-ink shadow-2xl">
            <div className="flex flex-wrap gap-1">
              {SEGMENTS.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => pickSegment(seg)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    seg.id === segmentId ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {seg.icon} {seg.label} · {seg.seconds / 60}′
                </button>
              ))}
            </div>

            <span className="hidden h-8 w-px bg-slate-200 md:block" />

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => adjust(-STEP_MS)} title="Kurangi 15 detik (↓)" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                −15d
              </button>
              <button type="button" onClick={() => adjust(STEP_MS)} title="Tambah 15 detik (↑)" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                +15d
              </button>
            </div>

            <span className="hidden h-8 w-px bg-slate-200 md:block" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startOrPause}
                title="Mulai / jeda (Spasi)"
                className={`min-w-28 rounded-xl px-4 py-2 text-sm font-black text-white shadow-sm transition ${
                  status === "running" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {status === "running" ? "⏸ Jeda" : status === "paused" ? "▶ Lanjut" : status === "countin" ? "✕ Batal" : "▶ Mulai"}
              </button>
              <button type="button" onClick={() => resetTimer()} title="Ulang waktu (R)" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                ↺ Ulang
              </button>
              <button
                type="button"
                onClick={nextSpeaker}
                title="Paslon berikutnya (N)"
                className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100"
              >
                ⏭ Berikutnya
              </button>
              <button
                type="button"
                onClick={() => setIsEditingQuestion((v) => !v)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isEditingQuestion || question.trim() ? "bg-sun-soft text-amber-800 ring-1 ring-amber-200" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ❓ Pertanyaan
              </button>
              <button type="button" onClick={() => setShowControls(false)} title="Sembunyikan panel (H)" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-100">
                Sembunyikan
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-white/40">
            Spasi mulai/jeda · R ulang · N berikutnya · ←→ pilih paslon · ↑↓ ±15 detik · H panel · M bunyi · F layar penuh
          </p>
        </footer>
      ) : (
        <button
          type="button"
          onClick={() => setShowControls(true)}
          className="absolute bottom-3 right-3 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60 ring-1 ring-white/15 transition hover:bg-white/20"
        >
          ⚙ Panel moderator (H)
        </button>
      )}
    </div>
  );
}
