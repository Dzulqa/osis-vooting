"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const GAP = 6; // jarak panel dari tombol
const EDGE = 8; // jarak aman dari tepi layar
const SEARCH_HEIGHT = 53; // tinggi kotak cari di atas daftar
const LIST_MAX = 240;
const LIST_MIN = 96;

/**
 * Select dengan fitur cari.
 *
 * options: [{ value, label, sublabel?, badge?, keywords? }]
 * Pencarian mencocokkan label, sublabel, dan keywords (tanpa membedakan huruf besar/kecil).
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ada hasil.",
  loading = false,
  disabled = false,
  required = false,
  className = "",
  id,
}) {
  const autoId = useId();
  const listId = `${id || autoId}-list`;
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const panelRef = useRef(null);
  const placementRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [position, setPosition] = useState(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      [o.label, o.sublabel, o.keywords].some((t) => String(t || "").toLowerCase().includes(q))
    );
  }, [options, query]);

  // Panel dirender di body (portal) agar tidak terpotong kartu ber-overflow-hidden.
  // Buka ke bawah bila muat; bila ruang bawah sempit dan atas lebih lega, buka ke atas.
  const updatePosition = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - GAP - EDGE;
    const spaceAbove = rect.top - GAP - EDGE;
    const wanted = SEARCH_HEIGHT + Math.min(LIST_MAX, Math.max(filtered.length, 1) * 40 + 8);

    // Sisi dipilih sekali saat dibuka; hanya pindah bila sisi itu jadi terlalu sempit (mis. setelah scroll)
    let placement = placementRef.current;
    const tooTight = (side) => (side === "bottom" ? spaceBelow : spaceAbove) < SEARCH_HEIGHT + LIST_MIN;
    if (!placement || (tooTight(placement) && !tooTight(placement === "bottom" ? "top" : "bottom"))) {
      placement = spaceBelow >= wanted || spaceBelow >= spaceAbove ? "bottom" : "top";
      placementRef.current = placement;
    }
    const room = placement === "bottom" ? spaceBelow : spaceAbove;
    const listMax = Math.max(LIST_MIN, Math.min(LIST_MAX, room - SEARCH_HEIGHT));

    setPosition({
      placement,
      left: rect.left,
      width: rect.width,
      top: placement === "bottom" ? rect.bottom + GAP : undefined,
      bottom: placement === "top" ? viewportHeight - rect.top + GAP : undefined,
      listMax,
    });
  }, [filtered.length]);

  useLayoutEffect(() => {
    if (!open) {
      placementRef.current = null;
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    let frame;
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePosition);
    }
    function handleOutside(e) {
      const inTrigger = rootRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inTrigger && !inPanel) setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("resize", schedule);
    // capture: ikut bergeser saat kontainer mana pun di-scroll
    window.addEventListener("scroll", schedule, true);
    searchRef.current?.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, updatePosition]);

  function openList() {
    if (disabled) return;
    setQuery("");
    setCursor(Math.max(0, options.findIndex((o) => String(o.value) === String(value))));
    setOpen(true);
  }

  function choose(option) {
    onChange(option.value, option);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[cursor]) choose(filtered[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        className={TRIGGER_CLASS}
      >
        <span className={`truncate ${selected ? "" : "text-slate-400"}`}>
          {loading ? "Memuat data Sinar..." : selected ? selected.label : placeholder}
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-400">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {/* Memberi validasi "wajib diisi" bawaan browser pada form */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={selected ? "1" : ""}
          onChange={() => {}}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
        />
      )}

      {open && position && createPortal(
        <div
          ref={panelRef}
          data-placement={position.placement}
          className={`fixed z-[70] flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${
            position.placement === "top"
              ? "flex-col-reverse origin-bottom animate-[searchSelectUp_140ms_ease-out]"
              : "flex-col origin-top animate-[searchSelectDown_140ms_ease-out]"
          }`}
          style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom }}
        >
          <div
            className={`border-slate-100 p-2 ${position.placement === "top" ? "border-t" : "border-b"}`}
          >
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-violet-500"
            />
          </div>
          <ul id={listId} role="listbox" className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight: position.listMax }}>
            {filtered.length === 0 && (
              <li className="px-3.5 py-3 text-center text-xs text-slate-400">{emptyText}</li>
            )}
            {filtered.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setCursor(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  ref={(node) => {
                    if (node && index === cursor) node.scrollIntoView({ block: "nearest" });
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-xs ${
                    index === cursor ? "bg-violet-50" : ""
                  } ${isSelected ? "font-bold text-violet-700" : "text-slate-800"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="block truncate text-[11px] font-normal text-slate-500">
                        {option.sublabel}
                      </span>
                    )}
                  </span>
                  {option.badge && (
                    <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {option.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
