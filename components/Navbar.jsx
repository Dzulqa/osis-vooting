/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession, logoutUser, subscribeVotingStorage, ROLE_LABELS } from "@/lib/votingStorage";

const ALL_LINKS = {
  home: { href: "/", label: "Beranda", icon: "🏠" },
  superadmin: { href: "/superadmin", label: "Superadmin", icon: "🌟" },
  ketua: { href: "/ketua", label: "Ketua OSIS", icon: "👑" },
  registration: { href: "/registration", label: "Pendaftaran", icon: "📝" },
  caller: { href: "/caller", label: "Pemanggil", icon: "📣" },
  results: { href: "/results", label: "Database Paslon", icon: "📊" },
};

// Menu mengikuti peran yang sedang login
const LINKS_BY_ROLE = {
  superadmin: ["home", "superadmin", "registration", "caller", "results"],
  ketua: ["home", "ketua", "registration", "caller", "results"],
  registrator: ["home", "registration"],
  caller: ["home", "caller"],
  saksi: ["home", "results"],
  guest: ["home", "results"],
};

const ROLE_CHIPS = {
  superadmin: "bg-violet-600 text-white",
  ketua: "bg-sun text-ink",
  registrator: "bg-mint text-ink",
  caller: "bg-coral text-ink",
  saksi: "bg-sky text-violet-700",
};

function isActivePath(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar({ boothId }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const linkRowRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  useEffect(() => {
    function loadSession() {
      setSession(getAuthSession());
    }

    function handleScroll() {
      setIsScrolled(window.scrollY > 8);
    }

    loadSession();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    const unsubscribe = subscribeVotingStorage(loadSession);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const links = (LINKS_BY_ROLE[session?.role] || LINKS_BY_ROLE.guest).map((key) => ALL_LINKS[key]);
  const linkKey = links.map((link) => link.href).join("|");

  // Posisikan pill aktif di bawah link yang sedang dibuka
  useLayoutEffect(() => {
    function measure() {
      const row = linkRowRef.current;
      const active = row?.querySelector("[data-active='true']");
      if (!row || !active) {
        setIndicator(null);
        return;
      }
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname, linkKey]);

  function handleLogout() {
    logoutUser();
    router.push("/login");
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full font-body transition-all duration-300 ${
        isScrolled ? "bg-white/85 shadow-lg shadow-violet-900/5 backdrop-blur-md" : "bg-white"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        {/* KIRI — Identitas */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <img src="/logo/alamanah.png" alt="Logo SMK Al Amanah" className="h-8 w-8 object-contain" />
          </span>
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-sun-soft transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <img src="/logo/osis.png" alt="Logo OSIS" className="h-14 w-14 max-w-none object-contain" />
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-lg font-semibold leading-none text-violet-700">E-Voting OSIS</span>
            <span className="mt-0.5 block text-xs text-slate-500">SMK Al Amanah</span>
          </span>
        </Link>

        {/* TENGAH — Navigasi (desktop) */}
        <div ref={linkRowRef} className="relative hidden items-center rounded-full bg-sky p-1 lg:flex">
          {indicator && (
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                className={`group relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors duration-200 ${
                  active ? "text-violet-700" : "text-slate-500 hover:text-ink"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-125 ${active ? "scale-110" : ""}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* KANAN — Status & Akun */}
        <div className="flex shrink-0 items-center gap-2">
          {boothId ? (
            <span className="hidden items-center gap-2 rounded-full bg-mint-soft px-3.5 py-2 text-xs font-bold text-emerald-800 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Bilik {String(boothId).padStart(2, "0")}
            </span>
          ) : null}

          {session ? (
            <>
              <span
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold md:flex ${
                  ROLE_CHIPS[session.role] || "bg-sky text-violet-700"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/40 text-[11px]">
                  {(session.name || session.username || "?").charAt(0).toUpperCase()}
                </span>
                {ROLE_LABELS[session.role] || session.role}
              </span>
              <button
                onClick={handleLogout}
                className="hidden cursor-pointer rounded-full border-2 border-coral/40 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 transition hover:-translate-y-0.5 hover:bg-coral-soft active:translate-y-0 sm:block"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login?mode=bilik"
                className="hidden rounded-full border-2 border-violet-200 bg-white px-4 py-2 text-xs font-bold text-violet-700 transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md active:translate-y-0 sm:block"
              >
                🗳️ Login bilik
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-400/25 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg active:translate-y-0"
              >
                🔐 Login
              </Link>
            </>
          )}

          {/* Tombol menu (mobile) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-sky transition hover:bg-violet-100 lg:hidden"
          >
            <span className={`absolute h-0.5 w-5 rounded bg-violet-700 transition-all duration-300 ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-0.5 w-5 rounded bg-violet-700 transition-all duration-300 ${isMenuOpen ? "scale-x-0 opacity-0" : ""}`} />
            <span className={`absolute h-0.5 w-5 rounded bg-violet-700 transition-all duration-300 ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`} />
          </button>
        </div>
      </nav>

      {/* MENU MOBILE */}
      <div
        className={`grid transition-all duration-300 ease-out lg:hidden ${
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-4 mb-4 space-y-1.5 rounded-3xl bg-sky p-3 sm:mx-6">
            {links.map((link, index) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                    active ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:bg-white/70"
                  } ${isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                  style={{ transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms" }}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}

            <div className="flex gap-2 pt-1.5">
              {session ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-2xl border-2 border-coral/40 bg-white py-2.5 text-sm font-bold text-rose-600"
                >
                  Keluar ({ROLE_LABELS[session.role] || session.role})
                </button>
              ) : (
                <Link
                  href="/login?mode=bilik"
                  className="flex-1 rounded-2xl border-2 border-violet-200 bg-white py-2.5 text-center text-sm font-bold text-violet-700"
                >
                  🗳️ Login bilik
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Garis warna-warni */}
      <div aria-hidden="true" className="flex h-1">
        <span className="flex-1 bg-violet-600" />
        <span className="flex-1 bg-sun" />
        <span className="flex-1 bg-coral" />
        <span className="flex-1 bg-mint" />
      </div>
    </header>
  );
}
