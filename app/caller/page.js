"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardHero, DashboardShell } from "@/components/Dashboard";
import {

  getBooths,
  getQueue,
  assignStudentToBooth,
  activateBooth,
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

  function handleSelectStudent(student) {
    setSelectedStudent(student);
    setSelectedBooth(null);
  }

  function handleSelectBooth(booth) {
    if (booth.status !== "waiting") {
      return;
    }

    setSelectedBooth(booth);
  }

  function handleAssign() {
    if (!selectedStudent || !selectedBooth) {
      return;
    }

    const success = assignStudentToBooth(
      selectedStudent,
      selectedBooth.id
    );

    if (!success) {
      return;
    }

    setSelectedStudent(null);
    setSelectedBooth(null);

    loadData();
  }

  function handleActivateBooth(boothId) {
    activateBooth(boothId);
    loadData();
  }

  const freeCount = booths.filter((b) => b.status === "waiting").length;
  const assignedCount = booths.filter((b) => b.status === "assigned").length;
  const activeCount = booths.filter((b) => b.status === "active").length;
  const boothLabel = (id) => `Bilik ${String(id).padStart(2, "0")}`;

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
            description="Pilih siswa dari antrean, lalu ketuk bilik yang kosong."
          />
        </div>

        {/* =========================
            STATUS BILIK (selalu terlihat)
        ========================== */}
        <section className="rounded-[1.75rem] bg-white p-5 shadow-md ring-1 ring-violet-100 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Status Bilik</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedStudent
                  ? `Ketuk bilik hijau untuk ${selectedStudent.nama}.`
                  : "Bilik hijau siap dipakai."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
                {freeCount} tersedia
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-200">
                {assignedCount} menunggu
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700 ring-1 ring-violet-200">
                {activeCount} aktif
              </span>
            </div>
          </div>

          {booths.length === 0 ? (
            <div className="mt-5 flex min-h-24 items-center justify-center rounded-2xl bg-slate-50">
              <p className="text-sm text-slate-400">Belum ada bilik yang disiapkan.</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {booths.map((booth) => {
                const available = booth.status === "waiting";
                const isSelected = selectedBooth?.id === booth.id;
                const tone = available
                  ? isSelected
                    ? "border-violet-500 bg-violet-50 ring-4 ring-violet-200"
                    : "border-emerald-300 bg-emerald-50/70 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
                  : booth.status === "assigned"
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-violet-200 bg-violet-50/50";

                return (
                  <button
                    key={booth.id}
                    type="button"
                    disabled={!available}
                    onClick={() => handleSelectBooth(booth)}
                    className={`relative flex min-h-28 flex-col rounded-2xl border-2 p-3 text-left transition disabled:cursor-default ${tone}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl font-black leading-none text-slate-800">
                        {String(booth.id).padStart(2, "0")}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          available
                            ? "bg-emerald-500 text-white"
                            : booth.status === "assigned"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {!available && (
                          <span
                            className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                              booth.status === "assigned" ? "bg-amber-500" : "bg-violet-500"
                            }`}
                          />
                        )}
                        {available ? "Tersedia" : booth.status === "assigned" ? "Menunggu" : "Memilih"}
                      </span>
                    </div>

                    <div className="mt-auto pt-3">
                      {available ? (
                        <p className="text-xs font-semibold text-emerald-700">
                          {isSelected ? "✓ Tujuan dipilih" : "Kosong"}
                        </p>
                      ) : booth.student ? (
                        <>
                          <p className="truncate text-sm font-semibold text-slate-700" title={booth.student.nama}>
                            {booth.student.nama}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">{booth.student.kelas}</p>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================
            ANTRIAN PEMILIH
        ========================== */}
        <section className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-md ring-1 ring-violet-100 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Antrian Pemilih</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih siswa yang akan dipanggil.</p>
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            AKSI (menempel di bawah layar)
        ========================== */}
        <div className="sticky bottom-4 z-20 mt-6">
          <div className="flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-violet-200 backdrop-blur sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pemilih</p>
                <p className={`truncate font-semibold ${selectedStudent ? "text-slate-800" : "text-slate-400"}`}>
                  {selectedStudent ? selectedStudent.nama : "Pilih dari antrean"}
                </p>
              </div>
              <span className="text-lg text-violet-300">→</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tujuan</p>
                <p className={`truncate font-semibold ${selectedBooth ? "text-slate-800" : "text-slate-400"}`}>
                  {selectedBooth ? boothLabel(selectedBooth.id) : freeCount ? "Ketuk bilik hijau" : "Semua bilik terisi"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedStudent || !selectedBooth}
              className="w-full rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
            >
              Arahkan ke Bilik
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
