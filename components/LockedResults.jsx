// Penanda hasil per paslon yang belum dihitung lewat "Hitung sekarang"

export function LockedMetric() {
  return (
    <div className="flex items-center gap-3" aria-label="Perolehan suara belum dihitung">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-xl ring-1 ring-violet-100">
        🔒
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">Belum dihitung</p>
        <div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full rounded-full bg-[repeating-linear-gradient(45deg,#e7ecfe_0_8px,#f4f6ff_8px_16px)]" />
        </div>
      </div>
    </div>
  );
}

export function LockedNotice({ compact = false, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-violet-200 bg-white/80 text-center sm:flex-row sm:text-left ${
        compact ? "p-6" : "p-6 sm:p-7"
      } ${className}`}
    >
      <span className="fx-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-3xl ring-1 ring-amber-100" style={{ "--dur": "4s" }}>
        🔒
      </span>
      <div className="flex-1">
        <p className="font-display text-lg font-semibold text-ink">Perolehan suara belum dihitung</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {compact
            ? "Log suara paslon ini terbuka setelah penghitungan resmi."
            : "Angka per paslon tetap dikunci sampai Ketua OSIS atau superadmin menekan “Hitung sekarang”."}
        </p>
      </div>
      {action}
    </div>
  );
}
