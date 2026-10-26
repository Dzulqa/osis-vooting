"use client";

import { useSyncExternalStore } from "react";
import { dismissToast, getServerToasts, getToasts, subscribeToasts } from "@/lib/toast";

const TONES = {
  success: { bar: "bg-emerald-400", ring: "ring-emerald-200", text: "text-emerald-900", icon: "✅" },
  warning: { bar: "bg-amber-400", ring: "ring-amber-200", text: "text-amber-900", icon: "⚠️" },
  error: { bar: "bg-rose-500", ring: "ring-rose-200", text: "text-rose-900", icon: "⛔" },
  info: { bar: "bg-violet-400", ring: "ring-violet-200", text: "text-ink", icon: "ℹ️" },
};

// Messages usually start with their own emoji; only add the type icon when they do not
const STARTS_WITH_EMOJI = /^\p{Extended_Pictographic}/u;

export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[110] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem]"
    >
      {toasts.map((t) => {
        const tone = TONES[t.type] || TONES.info;
        return (
          <div
            key={t.id}
            role={t.type === "error" || t.type === "warning" ? "alert" : "status"}
            className={`fx-pop-in pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl bg-white py-3 pl-5 pr-3 shadow-[0_18px_40px_-18px_rgba(31,42,72,0.45)] ring-1 ${tone.ring}`}
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${tone.bar}`} />
            {!STARTS_WITH_EMOJI.test(t.message) && <span aria-hidden="true">{tone.icon}</span>}
            <p className={`min-w-0 flex-1 text-sm font-semibold leading-snug ${tone.text}`}>{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Tutup notifikasi"
              className="-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
