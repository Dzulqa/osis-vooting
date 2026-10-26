"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardHero, DashboardShell } from "@/components/Dashboard";
import {

  getBooths,
  getQueue,
  assignStudentToBooth,
  activateBooth,
  cancelBoothAssignment,
  getEventConfig,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function CallerPage() {
  return (
    <AuthGuard allowedRoles={["ketua", "caller"]}>
      <CallerPageContent />
    </AuthGuard>
  );
}

function CallerPageContent() {
  const [queue, setQueue] = useState([]);
  const [booths, setBooths] = useState([]);
  const [eventConfig, setEventConfig] = useState({ status: "open" });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const boothLabel = (id) => `Bilik ${String(id).padStart(2, "0")}`;

  function loadData() {
    setQueue(getQueue());
    const freshBooths = getBooths();
    setBooths(freshBooths);
    // Drop the chosen booth if another caller just filled it
    setSelectedBooth((prev) =>
      prev && freshBooths.some((b) => b.id === prev.id && b.status === "waiting") ? prev : null
    );
    setEventConfig(getEventConfig());
  }


  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });

    const unsubscribe = subscribeVotingStorage(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  const [flash, setFlash] = useState(null); // { tone: "ok" | "error", text }
  const flashTimer = useRef(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const confirmTimer = useRef(null);

  function showFlash(tone, text) {
    setFlash({ tone, text });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  }

  // Student and booth can be picked in either order; picking the second one assigns right away
  function assign(student, booth) {
    const success = assignStudentToBooth(student, booth.id);

    setSelectedStudent(null);
    setSelectedBooth(null);

    if (success) {
      showFlash("ok", `${student.nama} → ${boothLabel(booth.id)}`);
    } else {
      showFlash("error", `${student.nama} tidak bisa diarahkan ke ${boothLabel(booth.id)}. Coba bilik lain.`);
    }

    loadData();
  }

  function handleSelectStudent(student) {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
      return;
    }
    if (selectedBooth) {
      assign(student, selectedBooth);
      return;
    }
    setSelectedStudent(student);
  }

  function handleSelectBooth(booth) {
    if (booth.status !== "waiting") {
      return;
    }
    if (selectedBooth?.id === booth.id) {
      setSelectedBooth(null);
      return;
    }
    if (selectedStudent) {
      assign(selectedStudent, booth);
      return;
    }
    setSelectedBooth(booth);
  }

  // First tap asks for confirmation, second tap (within a few seconds) takes the student out
  function handleCancelBooth(booth) {
    if (confirmCancelId !== booth.id) {
      setConfirmCancelId(booth.id);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmCancelId(null), 4000);
      return;
    }

    clearTimeout(confirmTimer.current);
    setConfirmCancelId(null);

    const student = cancelBoothAssignment(booth.id);
    if (student) {
      showFlash("ok", `${student.nama} dikeluarkan dari ${boothLabel(booth.id)} dan kembali ke antrean paling atas.`);
    } else {
      showFlash("error", `${boothLabel(booth.id)} sudah kosong.`);
    }
    loadData();
  }

  function handleActivateBooth(boothId) {
    activateBooth(boothId);
    loadData();
  }

  const freeCount = booths.filter((b) => b.status === "waiting").length;
  const assignedCount = booths.filter((b) => b.status === "assigned").length;
  const activeCount = booths.filter((b) => b.status === "active").length;
  const statusOrder = { waiting: 0, assigned: 1, active: 2 };
  const sortedBooths = [...booths].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) || a.id - b.id
  );

  const hint = selectedStudent
    ? `Ketuk bilik hijau untuk ${selectedStudent.nama}.`
    : selectedBooth
    ? `Ketuk siswa untuk ${boothLabel(selectedBooth.id)}.`
    : "Ketuk siswa, lalu ketuk bilik hijau. Langsung diarahkan.";

  return (
    <DashboardShell>
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-10">

        {eventConfig.status === "closed" && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Event E-Voting Ditutup</p>
                <p className="text-xs text-rose-700 mt-0.5">Operasional pemanggilan saat ini dinonaktifkan oleh Penyelenggara (Ketua OSIS Saat Ini).</p>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="mb-6">
          <DashboardHero
            theme="coral"
            emoji="📣"
            badge={`${queue.length} siswa menunggu`}
            title="Meja pemanggil"
            description="Ketuk siswa, lalu ketuk bilik yang kosong. Siswa langsung diarahkan."
          />
        </div>

        {/* PETUNJUK & HASIL */}
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition ${
            flash?.tone === "ok"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : flash?.tone === "error"
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : selectedStudent || selectedBooth
              ? "bg-violet-50 text-violet-700 ring-violet-200"
              : "bg-white text-slate-500 ring-slate-200"
          }`}
          aria-live="polite"
        >
          <span className="text-lg">{flash?.tone === "ok" ? "✅" : flash?.tone === "error" ? "⚠️" : "👉"}</span>
          <span className="min-w-0 flex-1">{flash ? flash.text : hint}</span>
          {(selectedStudent || selectedBooth) && !flash && (
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setSelectedBooth(null);
              }}
              className="rounded-lg px-2 py-1 text-xs font-bold text-violet-600 hover:bg-violet-100"
            >
              Batal
            </button>
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">

          {/* =========================
              ANTRIAN PEMILIH
          ========================== */}
          <section className="rounded-[1.75rem] bg-white p-5 shadow-md ring-1 ring-violet-100 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Antrian Pemilih</h2>
                <p className="mt-1 text-sm text-slate-500">Ketuk siswa yang akan dipanggil.</p>
              </div>
              <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-600">
                {queue.length} siswa
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="mt-5 flex min-h-32 items-center justify-center rounded-2xl bg-slate-50">
                <p className="text-sm text-slate-400">Tidak ada siswa dalam antrian.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {queue.map((student, index) => {
                  const isSelected = selectedStudent?.id === student.id;

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-violet-500 bg-violet-50 ring-4 ring-violet-100"
                          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{student.nama}</p>
                        <p className="truncate text-xs text-slate-500">
                          NIS {student.nis}
                          {" • "}
                          {student.kelas}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
                          Dipilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* =========================
              STATUS BILIK (kosong di atas)
          ========================== */}
          <section className="rounded-[1.75rem] bg-white p-5 shadow-md ring-1 ring-violet-100 sm:p-6 lg:sticky lg:top-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Status Bilik</h2>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">
                  {freeCount} tersedia
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-200">
                  {assignedCount} menunggu
                </span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700 ring-1 ring-violet-200">
                  {activeCount} memilih
                </span>
              </div>
            </div>

            {booths.length === 0 ? (
              <div className="mt-5 flex min-h-24 items-center justify-center rounded-2xl bg-slate-50">
                <p className="text-sm text-slate-400">Belum ada bilik yang disiapkan.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {sortedBooths.map((booth) => {
                  const available = booth.status === "waiting";
                  const isSelected = selectedBooth?.id === booth.id;
                  const tone = available
                    ? isSelected
                      ? "border-violet-500 bg-violet-50 ring-4 ring-violet-200"
                      : selectedStudent
                      ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100 hover:shadow-md"
                      : "border-emerald-300 bg-emerald-50/70 hover:border-emerald-400"
                    : booth.status === "assigned"
                    ? "border-amber-300 bg-white"
                    : "border-violet-300 bg-white";

                  const confirming = confirmCancelId === booth.id;
                  const badge = (
                    <span
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
                        available
                          ? "bg-emerald-500 text-white"
                          : booth.status === "assigned"
                          ? "bg-amber-400 text-white"
                          : "bg-violet-500 text-white"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Bilik</span>
                      <span className="text-xl font-black">{String(booth.id).padStart(2, "0")}</span>
                    </span>
                  );

                  // Bilik kosong: satu baris, ketuk untuk memilih
                  if (available) {
                    return (
                      <button
                        key={booth.id}
                        type="button"
                        onClick={() => handleSelectBooth(booth)}
                        className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${tone}`}
                      >
                        {badge}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-emerald-700">{isSelected ? "✓ Bilik dipilih" : "Kosong"}</p>
                          <p className="text-xs text-emerald-600/80">
                            {isSelected
                              ? "Sekarang ketuk siswa di antrean"
                              : selectedStudent
                              ? `Ketuk untuk arahkan ${selectedStudent.nama}`
                              : "Siap dipakai"}
                          </p>
                        </div>
                      </button>
                    );
                  }

                  // Bilik terisi: nama lengkap di atas, status + tombol keluarkan di bawah
                  return (
                    <div key={booth.id} className={`overflow-hidden rounded-2xl border-2 ${tone}`}>
                      <div className="flex items-center gap-3 p-3">
                        {badge}
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-bold leading-snug text-slate-800">
                            {booth.student?.nama || "—"}
                          </p>
                          {booth.student?.kelas && (
                            <p className="mt-0.5 text-xs text-slate-500">{booth.student.kelas}</p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-between gap-2 border-t px-3 py-2 ${
                          booth.status === "assigned" ? "border-amber-200 bg-amber-100/50" : "border-violet-200 bg-violet-100/40"
                        }`}
                      >
                        <span
                          className={`flex items-center gap-1.5 text-xs font-semibold ${
                            booth.status === "assigned" ? "text-amber-700" : "text-violet-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 animate-pulse rounded-full ${
                              booth.status === "assigned" ? "bg-amber-500" : "bg-violet-500"
                            }`}
                          />
                          {booth.status === "assigned" ? "Menunggu siswa masuk" : "Sedang memilih"}
                        </span>

                        {booth.student && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooth(booth)}
                            title="Salah panggil? Keluarkan siswa dan kembalikan ke antrean"
                            aria-label={`Keluarkan ${booth.student.nama} dari ${boothLabel(booth.id)}`}
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              confirming
                                ? "bg-rose-600 text-white hover:bg-rose-700"
                                : "bg-white text-rose-500 ring-1 ring-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            {confirming ? "Ketuk lagi untuk keluarkan" : "✕ Keluarkan"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
