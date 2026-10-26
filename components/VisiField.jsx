"use client";

import { useState } from "react";
import RichText from "@/components/RichText";

// Kolom isi visi: boleh banyak paragraf & daftar, dengan pratinjau tampilan akhirnya
export default function VisiField({ value, onChange, rows = 7, autoFocus = false, id }) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-end gap-1 rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
        {[
          { key: false, label: "✏️ Tulis" },
          { key: true, label: "👀 Pratinjau" },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => setIsPreview(tab.key)}
            aria-pressed={isPreview === tab.key}
            className={`flex-1 rounded-md px-2 py-1 transition ${
              isPreview === tab.key ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isPreview ? (
        <div className="max-h-72 min-h-32 overflow-y-auto rounded-xl border border-violet-100 bg-violet-50/40 px-3.5 py-3">
          <RichText
            text={value}
            className="text-xs leading-relaxed text-slate-700"
            empty={<p className="text-xs italic text-slate-400">Belum ada isi visi.</p>}
          />
        </div>
      ) : (
        <textarea
          id={id}
          rows={rows}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Paragraf pertama visi...\n\nParagraf kedua...\n\n- Poin penting\n- Poin lain"}
          className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 outline-none focus:border-violet-500"
        />
      )}

      <div className="mt-1 flex items-start justify-between gap-3 text-[10px] text-slate-400">
        <p>
          Baris kosong = paragraf baru · awali dengan <code className="font-bold text-slate-500">-</code> untuk poin,{" "}
          <code className="font-bold text-slate-500">1.</code> untuk nomor
        </p>
        <span className="shrink-0 tabular-nums">{(value || "").length} karakter</span>
      </div>
    </div>
  );
}
