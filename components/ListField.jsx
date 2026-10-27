"use client";

// Kolom daftar poin (misi / program kerja): satu poin per baris, dengan nomor otomatis di pratinjau
export function toPoints(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function ListField({ value, onChange, rows = 5, placeholder, autoFocus = false, id }) {
  const points = toPoints(value);

  return (
    <div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 outline-none focus:border-violet-500"
      />
      <p className="mt-1 text-[10px] text-slate-400">
        Satu poin per baris (tekan Enter untuk poin berikutnya) · {points.length} poin
      </p>
      {points.length > 0 && (
        <ol className="mt-2 space-y-1 rounded-xl bg-violet-50/50 px-3 py-2">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                {i + 1}
              </span>
              <span className="leading-snug">{p}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
