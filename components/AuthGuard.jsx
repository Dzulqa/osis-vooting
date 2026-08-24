"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getAuthSession, logoutUser, subscribeVotingStorage } from "@/lib/votingStorage";

export default function AuthGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  function checkSession() {
    const currentSession = getAuthSession();
    setSession(currentSession);
    setIsChecking(false);

    if (!currentSession) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }

  useEffect(() => {
    checkSession();
    return subscribeVotingStorage(checkSession);
  }, [pathname]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Memeriksa Hak Akses...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Mengalihkan ke Halaman Login...</p>
        </div>
      </div>
    );
  }

  // Check role authorization
  // Note: 'superadmin' has super-user access to all protected routes including 'ketua'
  const isAuthorized =
    allowedRoles.length === 0 ||
    session.role === "superadmin" ||
    allowedRoles.includes(session.role);

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F7FF] px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">
            🚫
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">Akses Ditolak</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Halaman ini membutuhkan hak akses <span className="font-bold text-rose-600">{allowedRoles.join(" / ").toUpperCase()}</span>. Anda saat ini masuk sebagai{" "}
            <span className="font-bold text-violet-700">{session.name} ({session.role})</span>.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {session.role === "ketua" && (
              <Link
                href="/ketua"
                className="w-full rounded-xl bg-amber-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-amber-700"
              >
                👑 Masuk ke Dashboard Ketua OSIS
              </Link>
            )}
            <button
              onClick={() => {
                logoutUser();
                router.push("/login");
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              🚪 Keluar / Ganti Akun Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
