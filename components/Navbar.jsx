/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function Navbar({ boothId }) {
  return (
    <nav className="w-full border-b border-violet-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

        {/* KIRI — Identitas */}
        <div className="flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Logo Sekolah */}
            <div className="flex h-12 w-12 items-center justify-center">
              <img
                src="/logo/alamanah.png"
                alt="Logo Sekolah"
                className="h-11 w-11 object-contain"
              />
            </div>

            {/* Logo OSIS */}
            <div className="mt-2 flex h-12 w-12 items-center justify-center overflow-hidden">
              <img
                src="/logo/osis.png"
                alt="Logo OSIS"
                className="h-20 w-20 max-w-none object-contain"
              />
            </div>
          </div>

          {/* Garis pemisah */}
          <div className="h-10 w-px bg-slate-200" />

          {/* Nama aplikasi */}
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              E-Voting OSIS
            </h1>

            <p className="text-xs text-slate-500">
              SMK Al Amanah
            </p>
          </div>

        </div>

        {/* KANAN — Navigasi & Status */}
        <div className="flex items-center gap-3">

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold mr-2">
            <Link
              href="/registration"
              className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
            >
              Pendaftaran
            </Link>
            <Link
              href="/caller"
              className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
            >
              Pemanggil
            </Link>
            <Link
              href="/results"
              className="rounded-xl bg-violet-50 px-3.5 py-2 font-bold text-violet-700 hover:bg-violet-100"
            >
              Database Paslon
            </Link>
          </div>

          {boothId ? (
            <>
              {/* Nomor bilik */}
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2">
                <p className="text-xs font-bold text-violet-700">
                  Bilik {String(boothId).padStart(2, "0")}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold text-emerald-700">
                  Sesi Aktif
                </p>
              </div>
            </>
          ) : null}

        </div>

      </div>
    </nav>
  );
}