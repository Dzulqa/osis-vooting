/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loginUser,
  getAuthSession,
  getAuthCreds,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  const [roleTab, setRoleTab] = useState("superadmin"); // 'superadmin' | 'ketua'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creds, setCreds] = useState({
    superadmin: { username: "superadmin", password: "admin123" },
    ketua: { username: "ketua", password: "ketua123" },
  });

  function checkExistingSession() {
    const session = getAuthSession();
    if (session) {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (session.role === "superadmin") {
        router.push("/superadmin");
      } else {
        router.push("/ketua");
      }
    }
  }

  useEffect(() => {
    checkExistingSession();
    setCreds(getAuthCreds());
    return subscribeVotingStorage(() => {
      setCreds(getAuthCreds());
    });
  }, [redirectPath]);

  function handleQuickFill(selectedRole) {
    setRoleTab(selectedRole);
    if (selectedRole === "superadmin") {
      setUsername(creds.superadmin.username);
      setPassword(creds.superadmin.password);
    } else {
      setUsername(creds.ketua.username);
      setPassword(creds.ketua.password);
    }
    setErrorMessage("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Silakan isi Username dan Password terlebih dahulu.");
      return;
    }

    setIsLoading(true);

    // Simulate short network latency for polished UX
    setTimeout(() => {
      const res = loginUser(username, password, roleTab);

      if (res.success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (res.session.role === "superadmin") {
          router.push("/superadmin");
        } else {
          router.push("/ketua");
        }
      } else {
        setIsLoading(false);
        setErrorMessage(res.message || "Gagal masuk. Periksa kembali username & password Anda.");
      }
    }, 400);
  }

  return (
    <div className="w-full max-w-md">
      {/* CARD MAIN */}
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo/alamanah.png"
              alt="Logo Sekolah"
              className="h-12 w-12 object-contain"
            />
            <div className="h-8 w-px bg-slate-200" />
            <img
              src="/logo/osis.png"
              alt="Logo OSIS"
              className="h-14 w-14 object-contain"
            />
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            Portal Login Resmi
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Khusus <span className="font-bold text-violet-700">Ketua OSIS</span> &amp; <span className="font-bold text-slate-800">Superadmin</span> E-Voting
          </p>
        </div>

        {/* ROLE TABS */}
        <div className="mt-6 flex rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setRoleTab("superadmin");
              setErrorMessage("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              roleTab === "superadmin"
                ? "bg-violet-600 text-white shadow-md shadow-violet-300"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🌟 Superadmin
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab("ketua");
              setErrorMessage("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              roleTab === "ketua"
                ? "bg-amber-500 text-white shadow-md shadow-amber-300"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👑 Ketua OSIS
          </button>
        </div>

        {/* ROLE DESCRIPTION BADGE */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
          {roleTab === "superadmin" ? (
            <p className="text-[11px] text-slate-600 font-medium">
              Akses Pembina OSIS &amp; Tim IT: Kelola Master Data, Panitia, Bilik &amp; Reset System.
            </p>
          ) : (
            <p className="text-[11px] text-slate-600 font-medium">
              Akses Penanggung Jawab: Atur Jadwal Event &amp; Otorisasi Perhitungan Suara.
            </p>
          )}
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="text-[10px] underline font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                roleTab === "superadmin"
                  ? creds.superadmin.username
                  : creds.ketua.username
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                {showPassword ? "🙈 Sembunyikan" : "👁️ Lihat"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl py-3.5 text-xs font-extrabold text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              roleTab === "superadmin"
                ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
            } ${isLoading ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memproses Login...</span>
              </>
            ) : (
              <span>Masuk Sekarang →</span>
            )}
          </button>
        </form>

        {/* DEMO ACCORDION / QUICK FILL FOR TESTING */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            🔑 Akun Kredensial Demo
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("superadmin")}
              className="rounded-xl border border-violet-200 bg-violet-50/60 p-2.5 text-left text-[11px] hover:bg-violet-100 transition"
            >
              <p className="font-bold text-violet-900">🌟 Superadmin</p>
              <p className="text-[10px] text-violet-700 mt-0.5">
                <code className="font-mono">{creds.superadmin.username}</code> / <code className="font-mono">{creds.superadmin.password}</code>
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("ketua")}
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-left text-[11px] hover:bg-amber-100 transition"
            >
              <p className="font-bold text-amber-900">👑 Ketua OSIS</p>
              <p className="text-[10px] text-amber-800 mt-0.5">
                <code className="font-mono">{creds.ketua.username}</code> / <code className="font-mono">{creds.ketua.password}</code>
              </p>
            </button>
          </div>
        </div>

        {/* FOOTER LINK */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/results" className="hover:underline hover:text-violet-600 font-semibold">
            ← Kembali ke Database Suara
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-xs font-semibold">Memuat Halaman Login...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
