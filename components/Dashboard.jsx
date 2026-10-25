"use client";

import { useEffect, useState } from "react";
import { Confetti, Reveal } from "@/components/Festive";

// ========================================
// SHELL — kanvas lembut untuk semua dashboard
// ========================================

export function DashboardShell({ children }) {
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#f7f8fd] pb-20 font-body text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Cahaya pastel di bagian atas */}
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-gradient-to-b from-[#eaf0ff] via-[#f3f1ff] to-transparent" />
        <div className="absolute -left-40 -top-24 h-[28rem] w-[28rem] rounded-full bg-violet-200/45 blur-[110px]" />
        <div className="absolute right-[-8rem] top-10 h-[24rem] w-[24rem] rounded-full bg-coral/25 blur-[110px]" />
        <div className="absolute left-1/2 top-64 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-sun/25 blur-[120px]" />
        <div className="absolute -left-24 top-[60rem] h-[26rem] w-[26rem] rounded-full bg-mint/20 blur-[120px]" />
        <div className="absolute -right-24 top-[90rem] h-[26rem] w-[26rem] rounded-full bg-lilac/30 blur-[120px]" />

        {/* Pola titik halus yang memudar ke bawah */}
        <div
          className="absolute inset-x-0 top-0 h-[40rem] opacity-60"
          style={{
            backgroundImage: "radial-gradient(#5a72d814 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>
      {children}
    </main>
  );
}

// ========================================
// HERO — header halaman dashboard
// ========================================

const HERO_THEMES = {
  violet: {
    bg: "from-[#e4e9ff] via-[#efeaff] to-[#fde9f1]",
    blobA: "bg-violet-300/50",
    blobB: "bg-coral/40",
    title: "text-violet-900",
    chip: "bg-white/80 text-violet-700 ring-violet-200/70",
    emojiTile: "bg-white/70 ring-violet-200/60",
  },
  sun: {
    bg: "from-[#fff3d6] via-[#fff1e6] to-[#ffe6ec]",
    blobA: "bg-sun/70",
    blobB: "bg-coral/40",
    title: "text-[#6b4a12]",
    chip: "bg-white/80 text-amber-800 ring-amber-200/70",
    emojiTile: "bg-white/70 ring-amber-200/60",
  },
  mint: {
    bg: "from-[#dcf6ee] via-[#e9f6f7] to-[#e4ecff]",
    blobA: "bg-mint/60",
    blobB: "bg-violet-200/60",
    title: "text-[#1d5a4a]",
    chip: "bg-white/80 text-emerald-800 ring-emerald-200/70",
    emojiTile: "bg-white/70 ring-emerald-200/60",
  },
  coral: {
    bg: "from-[#ffe4eb] via-[#fff0ea] to-[#fff6dc]",
    blobA: "bg-coral/55",
    blobB: "bg-sun/60",
    title: "text-[#7a2d43]",
    chip: "bg-white/80 text-rose-700 ring-rose-200/70",
    emojiTile: "bg-white/70 ring-rose-200/60",
  },
};

function HeroSparkle({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="currentColor" />
    </svg>
  );
}

export function DashboardHero({ theme = "violet", emoji, badge, title, description, aside }) {
  const t = HERO_THEMES[theme] || HERO_THEMES.violet;

  return (
    <div
      className={`fx-pop-in relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 shadow-[0_20px_50px_-28px_rgba(74,95,189,0.45)] ring-1 ring-white/80 sm:p-9 ${t.bg}`}
    >
      {/* Dekorasi */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute -right-16 -top-20 h-72 w-72 rounded-full blur-3xl ${t.blobA}`} />
        <div className={`absolute -bottom-24 left-1/4 h-64 w-64 rounded-full blur-3xl ${t.blobB}`} />
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full border-[18px] border-white/40" />
        <div className="absolute bottom-6 right-1/3 h-4 w-4 rounded-full border-[3px] border-white/80" />
        <div className="absolute left-[46%] top-6 h-2.5 w-2.5 rounded-full bg-white/90" />
        <HeroSparkle className="fx-sparkle absolute right-[38%] top-8 h-4 w-4 text-white" style={{ "--delay": "-0.4s" }} />
        <HeroSparkle className="fx-sparkle absolute bottom-8 left-[58%] h-3 w-3 text-white" style={{ "--delay": "-1.3s" }} />
        <Confetti count={10} />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 sm:gap-5">
          {emoji && (
            <span
              aria-hidden="true"
              className={`fx-float hidden h-20 w-20 shrink-0 select-none items-center justify-center rounded-[1.6rem] text-5xl shadow-sm ring-1 backdrop-blur sm:flex ${t.emojiTile}`}
              style={{ "--dur": "5s" }}
            >
              {emoji}
            </span>
          )}
          <div className="max-w-2xl">
            {badge && (
              <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold ring-1 backdrop-blur ${t.chip}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {badge}
              </span>
            )}
            <h1 className={`mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] ${t.title}`}>
              {title}
            </h1>
            {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{description}</p>}
          </div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}

// ========================================
// PANEL — kartu konten dengan aksen warna
// ========================================

const PANEL_ACCENTS = {
  violet: "from-violet-300 to-lilac",
  sun: "from-sun to-coral",
  coral: "from-coral to-lilac",
  mint: "from-mint to-violet-200",
};

export function Panel({ accent = "violet", delay = 0, className = "", innerClassName = "", children }) {
  return (
    <Reveal delay={delay} className={className}>
      <section
        className={`relative h-full overflow-hidden rounded-[1.75rem] bg-white/90 p-6 shadow-[0_12px_40px_-24px_rgba(31,42,72,0.25)] ring-1 ring-slate-200/60 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-24px_rgba(74,95,189,0.35)] sm:p-8 ${innerClassName}`}
      >
        <span aria-hidden="true" className={`absolute left-8 top-0 h-1.5 w-20 rounded-b-full bg-gradient-to-r ${PANEL_ACCENTS[accent]}`} />
        {children}
      </section>
    </Reveal>
  );
}

const ICON_TILES = {
  violet: "bg-violet-50 ring-violet-100",
  sun: "bg-sun-soft ring-amber-100",
  coral: "bg-coral-soft ring-rose-100",
  mint: "bg-mint-soft ring-emerald-100",
};

export function PanelTitle({ icon, title, subtitle, accent = "violet", right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl ring-1 ${ICON_TILES[accent]}`}>{icon}</span>
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ========================================
// BANNER — notifikasi hasil aksi
// ========================================

export function Banner({ notification, onClose }) {
  if (!notification) return null;

  const isSuccess = notification.type === "success";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-10">
      <div
        key={notification.message}
        role="status"
        className={`fx-pop-in flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5 shadow-lg ring-1 ${
          isSuccess
            ? "bg-mint-soft text-emerald-900 shadow-emerald-200/50 ring-mint/60"
            : "bg-sun-soft text-amber-900 shadow-amber-200/50 ring-sun/70"
        }`}
      >
        <p className="text-sm font-bold">{notification.message}</p>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-bold ring-1 ring-black/5 transition hover:bg-white"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ========================================
// STAT TILE — angka ringkasan dengan hitung naik
// ========================================

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Number(target) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || end === 0) {
      setValue(end);
      return;
    }

    let frame;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const STAT_THEMES = {
  violet: { icon: "bg-violet-100 ring-violet-200/70", blob: "bg-violet-200/60", bar: "from-violet-300 to-lilac", value: "text-violet-800" },
  sun: { icon: "bg-sun-soft ring-amber-200/70", blob: "bg-sun/50", bar: "from-sun to-coral", value: "text-amber-800" },
  coral: { icon: "bg-coral-soft ring-rose-200/70", blob: "bg-coral/40", bar: "from-coral to-lilac", value: "text-rose-700" },
  mint: { icon: "bg-mint-soft ring-emerald-200/70", blob: "bg-mint/45", bar: "from-mint to-violet-200", value: "text-emerald-800" },
};

export function StatTile({ icon, label, value, unit, note, color = "violet", delay = 0 }) {
  const t = STAT_THEMES[color] || STAT_THEMES.violet;
  const shown = useCountUp(value);

  return (
    <Reveal delay={delay}>
      <div className="group relative h-full overflow-hidden rounded-[1.6rem] bg-white/90 p-5 shadow-[0_12px_36px_-22px_rgba(31,42,72,0.3)] ring-1 ring-slate-200/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(74,95,189,0.4)]">
        <span aria-hidden="true" className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125 ${t.blob}`} />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ring-1 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 ${t.icon}`}>
            {icon}
          </span>
        </div>
        <p className={`relative mt-2 font-display text-4xl font-bold tabular-nums leading-tight ${t.value}`}>
          {typeof value === "number" ? shown : value}
          {unit && <span className="ml-1.5 text-sm font-semibold text-slate-400">{unit}</span>}
        </p>
        {note && <p className="relative mt-0.5 text-xs text-slate-500">{note}</p>}
        <span aria-hidden="true" className={`absolute inset-x-5 bottom-0 h-1 rounded-t-full bg-gradient-to-r opacity-70 transition-opacity group-hover:opacity-100 ${t.bar}`} />
      </div>
    </Reveal>
  );
}
