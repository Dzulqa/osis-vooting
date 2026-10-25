/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Bunting, FestiveBackdrop } from "@/components/Festive";

// Kerangka halaman login: latar ceria, bendera, kartu yang "pop" saat dimuat
export default function AuthShell({ icon, title, subtitle, children, footer }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden font-body text-ink">
      <FestiveBackdrop confetti={26} />
      <Bunting className="relative" />

      <div className="relative flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6">
        <div className="fx-pop-in w-full max-w-md" style={{ "--delay": "80ms" }}>
          {/* Logo melayang di atas kartu */}
          <div className="relative z-10 mx-auto -mb-10 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg ring-4 ring-white/60">
            <img src="/logo/alamanah.png" alt="Logo SMK Al Amanah" className="h-10 w-10 object-contain" />
            <span className="fx-float flex h-12 w-12 items-center justify-center rounded-full bg-sun text-2xl shadow-inner" style={{ "--dur": "4s" }}>
              {icon}
            </span>
            <img src="/logo/osis.png" alt="Logo OSIS" className="h-12 w-12 object-contain" />
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-white/95 px-6 pb-7 pt-14 shadow-2xl shadow-violet-900/10 ring-1 ring-violet-100 backdrop-blur-xl sm:px-8">
            {/* Garis warna-warni */}
            <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-2">
              <span className="flex-1 bg-violet-600" />
              <span className="flex-1 bg-sun" />
              <span className="flex-1 bg-coral" />
              <span className="flex-1 bg-mint" />
            </div>

            <div className="text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight text-violet-700 sm:text-4xl">{title}</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{subtitle}</p>
            </div>

            {children}

            {footer && (
              <div className="mt-7 flex items-center justify-between border-t-2 border-dashed border-violet-100 pt-4 text-xs font-bold">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export function ShellLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
    >
      {children}
    </Link>
  );
}
