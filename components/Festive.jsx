"use client";

import { useEffect, useRef } from "react";

export const FESTIVE_COLORS = ["#7086e3", "#ffd98a", "#f9a8b8", "#8fdcc4", "#c9c3f5"];

// Pseudo-random deterministik (integer) agar hasil SSR & client identik
function seeded(index, salt) {
  let x = (index + 1) * 374761393 + salt * 668265263;
  x = (x ^ (x >>> 13)) * 1274126177;
  x = x ^ (x >>> 16);
  return (Math.abs(x) % 1000) / 1000;
}

// ========================================
// CONFETTI — partikel kertas jatuh
// ========================================

export function Confetti({ count = 28 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const shape = i % 3;
        const size = Math.round(6 + seeded(i, 1) * 8);
        const style = {
          left: `${Math.round(seeded(i, 2) * 100)}%`,
          width: shape === 2 ? size * 0.5 : size,
          height: shape === 1 ? size : size * (shape === 2 ? 2.2 : 0.6),
          background: FESTIVE_COLORS[i % FESTIVE_COLORS.length],
          borderRadius: shape === 1 ? "9999px" : "2px",
          "--dur": `${(7 + seeded(i, 3) * 7).toFixed(1)}s`,
          "--delay": `-${(seeded(i, 4) * 12).toFixed(1)}s`,
          "--drift": `${Math.round((seeded(i, 5) - 0.5) * 160)}px`,
          "--spin": `${Math.round(360 + seeded(i, 6) * 540)}deg`,
        };

        return <span key={i} className="fx-confetti absolute top-0 opacity-0" style={style} />;
      })}
    </div>
  );
}

// ========================================
// BUNTING — bendera segitiga khas pesta
// ========================================

export function Bunting({ flags = 18, className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-12 w-full overflow-hidden ${className}`}>
      <svg className="absolute inset-x-0 top-0 h-4 w-full" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M0 2 Q 50 9 100 2" fill="none" stroke="#1f2a48" strokeOpacity="0.25" strokeWidth="0.4" />
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-between px-1">
        {Array.from({ length: flags }, (_, i) => {
          // Ikuti lengkung tali
          const t = i / (flags - 1);
          const sag = Math.round(4 * 28 * t * (1 - t));
          return (
            <svg
              key={i}
              width="22"
              height="28"
              viewBox="0 0 22 28"
              className="fx-sway shrink-0"
              style={{ marginTop: sag / 2, animationDelay: `${(i % 6) * -0.5}s` }}
            >
              <polygon points="0,0 22,0 11,26" fill={FESTIVE_COLORS[i % FESTIVE_COLORS.length]} />
              <polygon points="0,0 22,0 11,8" fill="#ffffff" fillOpacity="0.25" />
            </svg>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// FLOATING SHAPES — bintang, lingkaran, squiggle
// ========================================

function Star({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 8.7l7.1-.6z"
        fill={color}
        stroke="#1f2a48"
        strokeOpacity="0.15"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Squiggle({ color, size }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 48 16" fill="none">
      <path d="M2 8c5-8 9 8 14 0s9 8 14 0 9 8 14 0" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const SHAPES = [
  { type: "star", color: "#ffd98a", size: 34, top: "12%", left: "6%", dur: 7 },
  { type: "ring", color: "#f9a8b8", size: 26, top: "22%", left: "88%", dur: 6 },
  { type: "squiggle", color: "#8fdcc4", size: 18, top: "70%", left: "4%", dur: 8 },
  { type: "star", color: "#f9a8b8", size: 22, top: "78%", left: "92%", dur: 6.5 },
  { type: "dot", color: "#c9c3f5", size: 16, top: "48%", left: "95%", dur: 5 },
  { type: "squiggle", color: "#ffd98a", size: 16, top: "88%", left: "40%", dur: 9 },
  { type: "ring", color: "#8fdcc4", size: 20, top: "6%", left: "55%", dur: 7.5 },
];

export function FloatingShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          className="fx-float absolute"
          style={{ top: shape.top, left: shape.left, "--dur": `${shape.dur}s`, "--delay": `${i * -0.9}s` }}
        >
          {shape.type === "star" && <Star color={shape.color} size={shape.size} />}
          {shape.type === "squiggle" && <Squiggle color={shape.color} size={shape.size} />}
          {shape.type === "ring" && (
            <span
              className="block rounded-full"
              style={{ width: shape.size, height: shape.size, border: `5px solid ${shape.color}` }}
            />
          )}
          {shape.type === "dot" && (
            <span className="block rounded-full" style={{ width: shape.size, height: shape.size, background: shape.color }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// BACKDROP — langit cerah + blob + partikel
// ========================================

export function FestiveBackdrop({ confetti = 28 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-sky via-white to-sun-soft" />
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sun/40 blur-3xl" />
      <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-coral/25 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-mint/25 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(#5a72d81a 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }}
      />
      <FloatingShapes />
      <Confetti count={confetti} />
    </div>
  );
}

// ========================================
// BALLOT BOX — kotak suara dengan surat suara masuk
// ========================================

export function BallotBox({ className = "" }) {
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label="Kotak suara OSIS">
      <defs>
        <clipPath id="ballot-slot-clip">
          <rect x="0" y="0" width="240" height="96" />
        </clipPath>
      </defs>

      {/* Bayangan */}
      <ellipse cx="120" cy="226" rx="86" ry="9" fill="#1f2a48" opacity="0.12" />

      <g className="fx-box-bounce" style={{ transformBox: "fill-box" }}>
        {/* Tutup */}
        <polygon points="40,110 200,110 182,82 58,82" fill="#8ea3ee" />
        <rect x="88" y="91" width="64" height="9" rx="4.5" fill="#3d4e98" />

        {/* Surat suara */}
        <g clipPath="url(#ballot-slot-clip)">
          <g className="fx-ballot">
            <rect x="98" y="26" width="44" height="58" rx="5" fill="#ffffff" stroke="#1f2a48" strokeOpacity="0.2" />
            <rect x="105" y="34" width="30" height="4" rx="2" fill="#d2dcfc" />
            <rect x="105" y="42" width="20" height="4" rx="2" fill="#d2dcfc" />
            <path d="M108 62l8 8 15-17" fill="none" stroke="#5cc7a6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* Badan kotak */}
        <rect x="40" y="108" width="160" height="112" rx="16" fill="#7086e3" />
        <rect x="40" y="138" width="160" height="16" fill="#ffd98a" />
        <circle cx="120" cy="186" r="22" fill="#ffffff" />
        <path
          d="M120 170l4.4 9.6 10.4 1-7.8 7 2.3 10.2-9.3-5.5-9.3 5.5 2.3-10.2-7.8-7 10.4-1z"
          fill="#f9a8b8"
        />
      </g>

      {/* Kilau */}
      {[
        { x: 28, y: 70, d: "0s", c: "#ffd98a" },
        { x: 206, y: 58, d: "-0.9s", c: "#f9a8b8" },
        { x: 214, y: 150, d: "-1.7s", c: "#8fdcc4" },
      ].map((s) => (
        <g key={s.x} transform={`translate(${s.x} ${s.y})`}>
          <path
            className="fx-sparkle"
            style={{ "--delay": s.d, transformOrigin: "center", transformBox: "fill-box" }}
            d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z"
            fill={s.c}
          />
        </g>
      ))}
    </svg>
  );
}

// ========================================
// CONFETTI BURST — ledakan kertas dari tengah
// ========================================

export function ConfettiBurst({ count = 42, className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + seeded(i, 7);
        const distance = 160 + seeded(i, 8) * 300;
        const size = Math.round(8 + seeded(i, 9) * 10);
        const shape = i % 3;
        const style = {
          width: shape === 2 ? size * 0.5 : size,
          height: shape === 1 ? size : size * (shape === 2 ? 2 : 0.6),
          background: FESTIVE_COLORS[i % FESTIVE_COLORS.length],
          borderRadius: shape === 1 ? "9999px" : "3px",
          "--x": `${Math.round(Math.cos(angle) * distance)}px`,
          "--y": `${Math.round(Math.sin(angle) * distance)}px`,
          "--spin": `${Math.round(240 + seeded(i, 10) * 480)}deg`,
          "--delay": `${Math.round(seeded(i, 11) * 180)}ms`,
        };

        return <span key={i} className="fx-burst absolute left-1/2 top-1/2" style={style} />;
      })}
    </div>
  );
}

// ========================================
// BALLOONS — balon melayang di sisi layar
// ========================================

const BALLOONS = [
  { color: "#f9a8b8", left: "4%", top: "18%", size: 56, dur: 6 },
  { color: "#8ea3ee", left: "10%", top: "52%", size: 44, dur: 7.5 },
  { color: "#ffd98a", left: "89%", top: "14%", size: 50, dur: 6.8 },
  { color: "#8fdcc4", left: "93%", top: "48%", size: 40, dur: 8 },
  { color: "#c9c3f5", left: "84%", top: "70%", size: 34, dur: 5.6 },
];

export function Balloons({ className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {BALLOONS.map((b, i) => (
        <svg
          key={i}
          viewBox="0 0 40 70"
          width={b.size}
          height={b.size * 1.75}
          className="fx-balloon absolute"
          style={{ left: b.left, top: b.top, "--dur": `${b.dur}s`, "--delay": `${i * -1.3}s` }}
        >
          <path d="M20 46 C 18 54, 24 58, 19 68" fill="none" stroke="#1f2a48" strokeOpacity="0.2" strokeWidth="1.2" />
          <ellipse cx="20" cy="22" rx="17" ry="21" fill={b.color} />
          <ellipse cx="13" cy="14" rx="4" ry="6.5" fill="#ffffff" fillOpacity="0.55" />
          <path d="M17 42 L23 42 L20 47 Z" fill={b.color} />
        </svg>
      ))}
    </div>
  );
}

// ========================================
// REVEAL — muncul saat masuk viewport
// ========================================

export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`fx-reveal ${className}`} style={{ "--delay": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
