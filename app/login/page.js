"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { ShellLink } from "@/components/AuthShell";
import { BallotBox, FESTIVE_COLORS } from "@/components/Festive";
import {
  loginUser,
  getAuthSession,
  getHomePathForRole,
  getBooths,
  getBoothSession,
  isBoothSessionValid,
  loginBooth,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

const CODE_LENGTH = 6;

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  const requestedBooth = searchParams.get("booth") || "";
  const codeInputRef = useRef(null);

  // "akun" = staf (username + password), "bilik" = perangkat bilik (kode akses)
  const [mode, setMode] = useState(
    searchParams.get("mode") === "bilik" || requestedBooth ? "bilik" : "akun"
  );
  const [booths, setBooths] = useState([]);
  const [boothId, setBoothId] = useState(requestedBooth);
  const [accessCode, setAccessCode] = useState("");
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | success

  function redirectAfterLogin(session) {
    router.push(redirectPath || getHomePathForRole(session.role));
  }

  useEffect(() => {
    // Tab bilik tetap terbuka walau browser ini sedang login sebagai staf
    const session = getAuthSession();
    if (session && mode === "akun") {
      redirectAfterLogin(session);
      return;
    }

    // Perangkat bilik yang sudah aktif langsung diarahkan ke biliknya
    const boothSession = getBoothSession();
    if (
      boothSession &&
      isBoothSessionValid(boothSession.boothId) &&
      (!requestedBooth || Number(requestedBooth) === boothSession.boothId)
    ) {
      router.replace(`/booth/${boothSession.boothId}`);
      return;
    }

    function loadBooths() {
      setBooths(getBooths());
    }

    loadBooths();
    return subscribeVotingStorage(loadBooths);
  }, [redirectPath, requestedBooth, mode]);

  function switchMode(next) {
    setMode(next);
    setErrorMessage("");
  }

  function handleSelectBooth(id) {
    setBoothId(String(id));
    setErrorMessage("");
    codeInputRef.current?.focus();
  }

  function handleBoothSubmit(e) {
    e.preventDefault();

    if (!boothId) {
      showError("Pilih nomor bilik terlebih dahulu.");
      return;
    }

    if (accessCode.length !== CODE_LENGTH) {
      showError(`Kode akses terdiri dari ${CODE_LENGTH} digit.`);
      return;
    }

    setStatus("loading");

    const res = loginBooth(boothId, accessCode);

    if (res.success) {
      setErrorMessage("");
      setStatus("success");
      router.push(`/booth/${res.session.boothId}`);
    } else {
      setStatus("idle");
      setAccessCode("");
      showError(`${res.message} Minta kode yang benar ke Superadmin.`);
    }
  }

  function showError(message) {
    setErrorMessage(message);
    setErrorCount((count) => count + 1);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showError("Isi username dan password terlebih dahulu.");
      return;
    }

    setStatus("loading");

    // Peran ditentukan dari akun, bukan dari pilihan di form
    const res = loginUser(username, password);

    if (res.success) {
      setErrorMessage("");
      setStatus("success");
      redirectAfterLogin(res.session);
    } else {
      setStatus("idle");
      setPassword("");
      showError("Username atau password salah. Periksa lagi lalu coba masuk.");
    }
  }

  return (
    <AuthShell
      icon={mode === "bilik" ? "🗳️" : "🔐"}
      title={mode === "bilik" ? "Aktifkan bilik suara" : "Masuk ke E-Voting"}
      subtitle={
        mode === "bilik"
          ? "Pilih nomor bilik di perangkat ini, lalu masukkan kode akses dari Superadmin."
          : "Gunakan akun yang diberikan panitia. Kamu akan diarahkan ke halaman sesuai akunmu."
      }
      footer={<ShellLink href="/">← Beranda</ShellLink>}
    >
      {/* PILIH JENIS LOGIN */}
      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-sky p-1.5">
        {[
          ["akun", "🔐 Akun panitia"],
          ["bilik", "🗳️ Bilik suara"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => switchMode(key)}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === key ? "bg-white text-violet-700 shadow" : "text-slate-500 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div
          key={errorCount}
          role="alert"
          className="fx-shake mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-coral/40 bg-coral-soft px-4 py-3 text-xs font-semibold text-rose-700"
        >
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="shrink-0 font-bold underline">
            Tutup
          </button>
        </div>
      )}

      {/* FORM AKUN */}
      {mode === "akun" && (
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-bold text-slate-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            autoComplete="username"
            autoFocus
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`${INPUT_CLASS} pr-28`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-sky hover:text-ink"
            >
              {showPassword ? "🙈 Sembunyikan" : "👀 Lihat"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={status !== "idle"}
          className="group relative w-full overflow-hidden rounded-2xl bg-violet-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-400/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0 active:scale-[0.98] disabled:opacity-80"
        >
          {/* Kilau saat hover */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 transition-all duration-700 group-hover:left-[120%]"
          />
          <span className="relative flex items-center justify-center gap-2">
            {status === "loading" && (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Memeriksa akun...
              </>
            )}
            {status === "success" && "Berhasil masuk 🎉"}
            {status === "idle" && "Masuk"}
          </span>
        </button>
      </form>
      )}

      {mode === "bilik" && (
        <form onSubmit={handleBoothSubmit} className="mt-4 space-y-6">
          <BallotBox className="mx-auto h-24 w-24" />

        {/* PILIH BILIK */}
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-slate-700">Nomor bilik</legend>
          {booths.length === 0 ? (
            <p className="rounded-2xl bg-sky px-4 py-3 text-center text-xs text-slate-500">
              Belum ada bilik. Superadmin perlu menambahkan bilik terlebih dahulu.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
              {booths.map((booth, index) => {
                const isSelected = String(booth.id) === String(boothId);
                const color = FESTIVE_COLORS[index % FESTIVE_COLORS.length];
                // Kuning & mint terlalu terang untuk teks putih
                const isLightColor = color === "#ffc93c" || color === "#2dd4a7";
                return (
                  <button
                    key={booth.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectBooth(booth.id)}
                    className={`fx-pop-in relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 font-display transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
                      isSelected
                        ? `-translate-y-1 -rotate-3 scale-105 border-transparent shadow-lg ${isLightColor ? "text-ink" : "text-white"}`
                        : "border-slate-200 bg-white text-ink hover:-translate-y-0.5 hover:border-violet-300"
                    }`}
                    style={{
                      "--delay": `${200 + index * 60}ms`,
                      background: isSelected ? color : undefined,
                    }}
                  >
                    <span className="text-2xl font-bold leading-none">{String(booth.id).padStart(2, "0")}</span>
                    <span className={`text-[10px] font-semibold ${isSelected ? "opacity-90" : "text-slate-400"}`}>bilik</span>
                    {isSelected && (
                      <span className="fx-digit absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-emerald-600 shadow">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        {/* KODE AKSES: 6 kotak dengan satu input asli di atasnya */}
        <div>
          <label htmlFor="access-code" className="mb-2 block text-xs font-bold text-slate-700">
            Kode akses bilik
          </label>
          <div className="relative">
            <div aria-hidden="true" className="grid grid-cols-6 gap-2">
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const digit = accessCode[i];
                const isCaret = isCodeFocused && i === Math.min(accessCode.length, CODE_LENGTH - 1);
                return (
                  <div
                    key={i}
                    className={`flex h-14 items-center justify-center rounded-2xl border-2 font-display text-2xl font-bold transition-all duration-200 ${
                      digit
                        ? "-translate-y-0.5 border-violet-500 bg-sky text-violet-700 shadow-md"
                        : isCaret
                          ? "border-violet-400 bg-white ring-4 ring-violet-100"
                          : "border-slate-200 bg-white text-slate-300"
                    }`}
                  >
                    {digit ? <span key={digit + i} className="fx-digit">●</span> : isCaret ? <span className="h-6 w-0.5 animate-pulse rounded bg-violet-500" /> : ""}
                  </div>
                );
              })}
            </div>
            <input
              id="access-code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              onFocus={() => setIsCodeFocused(true)}
              onBlur={() => setIsCodeFocused(false)}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status !== "idle"}
          className="group relative w-full overflow-hidden rounded-2xl bg-violet-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-400/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 transition-all duration-700 group-hover:left-[120%]"
          />
          <span className="relative flex items-center justify-center gap-2">
            {status === "loading" && (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengaktifkan bilik...
              </>
            )}
            {status === "success" && "Bilik aktif 🎉"}
            {status === "idle" && "Aktifkan bilik"}
          </span>
        </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-sky">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
