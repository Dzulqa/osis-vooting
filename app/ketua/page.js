/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/Modal";
import { DashboardHero, DashboardShell, Panel, PanelTitle, StatTile } from "@/components/Dashboard";
import {
  getBooths,
  getQueue,
  getVotedStudents,
  getVotes,
  getEventConfig,
  getCandidatesList,
  getStudentsList,
  saveEventConfig,
  toggleResultRevealed,
  subscribeVotingStorage,
  checkAndApplySchedule,
} from "@/lib/votingStorage";

function KetuaOsisDashboardContent() {
  const [confirm, confirmModal] = useConfirm();

  const [eventConfig, setEventConfig] = useState({
    status: "open",
    startTime: "",
    endTime: "",
    isResultRevealed: false,
  });
  const [booths, setBooths] = useState([]);
  const [queue, setQueue] = useState([]);
  const [votedStudents, setVotedStudents] = useState([]);
  const [votesCount, setVotesCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");

  function loadAllData() {
    const config = getEventConfig();
    setEventConfig(config);
    setBooths(getBooths());
    setQueue(getQueue());
    setStudents(getStudentsList());
    const cands = getCandidatesList();
    setCandidates(cands);
    const voted = getVotedStudents();
    setVotedStudents(voted);
    const votes = getVotes();
    setVotesCount(votes.length);

    if (config.startTime && !startTimeInput) {
      setStartTimeInput(config.startTime);
    }
    if (config.endTime && !endTimeInput) {
      setEndTimeInput(config.endTime);
    }
  }


  useEffect(() => {
    queueMicrotask(() => {
      loadAllData();
      checkAndApplySchedule();
    });

    // Periksa jadwal setiap 30 detik
    const scheduleInterval = setInterval(() => {
      const result = checkAndApplySchedule();
      if (result.changed) {
        loadAllData();
        const msg =
          result.newStatus === "open"
            ? "🟢 Event E-Voting otomatis DIBUKA sesuai jadwal!"
            : "🔴 Event E-Voting otomatis DITUTUP sesuai jadwal!";
        toast(msg, result.newStatus === "open" ? "success" : "warning");
      }
    }, 30000);

    const unsubscribe = subscribeVotingStorage(loadAllData);

    return () => {
      clearInterval(scheduleInterval);
      unsubscribe();
    };
  }, []);


  // Toggle Buka / Tutup Event Voting
  async function handleToggleStatus(newStatus) {
    const opening = newStatus === "open";
    const ok = await confirm({
      tone: opening ? "success" : "danger",
      icon: opening ? "🟢" : "🔒",
      title: opening ? "Buka event e-voting sekarang?" : "Tutup event e-voting sekarang?",
      description: opening
        ? "Pemanggil dan bilik suara langsung bisa dipakai untuk memilih."
        : "Pemanggilan dan bilik suara langsung dinonaktifkan. Siswa yang belum memilih tidak bisa memilih.",
      confirmLabel: opening ? "Ya, buka" : "Ya, tutup",
    });
    if (!ok) return;

    saveEventConfig({ status: newStatus });
    toast(
      newStatus === "open"
        ? "✅ Event E-Voting berhasil DIBUKA secara resmi."
        : "⚠️ Event E-Voting berhasil DITUTUP. Akses memilih dinonaktifkan.",
      newStatus === "open" ? "success" : "warning"
    );
  }

  // Simpan Jadwal Event
  function handleSaveSchedule(e) {
    e.preventDefault();

    if (!startTimeInput && !endTimeInput) {
      toast("⚠️ Harap isi minimal Waktu Buka atau Waktu Tutup!", "warning");
      return;
    }

    if (startTimeInput && endTimeInput && new Date(startTimeInput) >= new Date(endTimeInput)) {
      toast("⚠️ Waktu Buka harus lebih awal dari Waktu Tutup!", "warning");
      return;
    }

    saveEventConfig({
      startTime: startTimeInput,
      endTime: endTimeInput,
    });

    // Langsung terapkan jadwal setelah disimpan
    const result = checkAndApplySchedule();
    loadAllData();

    if (result.changed) {
      const statusMsg =
        result.newStatus === "open"
          ? "🟢 Event langsung DIBUKA karena waktu saat ini sudah masuk jadwal!"
          : "🔴 Event langsung DITUTUP karena waktu saat ini di luar jadwal!";
      toast(`📅 Jadwal disimpan & diterapkan! ${statusMsg}`, result.newStatus === "open" ? "success" : "warning");
    } else {
      toast("📅 Jadwal Event E-Voting berhasil diperbarui! Status akan menyesuaikan otomatis.");
    }
  }

  // Otorisasi Penghitungan Suara
  async function handleToggleAuthorization() {
    const nextState = !eventConfig.isResultRevealed;
    const ok = await confirm({
      tone: nextState ? "primary" : "warning",
      icon: nextState ? "🔓" : "🔒",
      title: nextState ? "Buka hasil penghitungan suara?" : "Kunci kembali hasil penghitungan?",
      description: nextState
        ? "Hasil perolehan suara bisa dihitung dan dilihat oleh Saksi & Publik."
        : "Rekapitulasi suara disembunyikan lagi dari Saksi & Publik.",
      confirmLabel: nextState ? "Ya, buka hasil" : "Ya, kunci",
    });
    if (!ok) return;

    toggleResultRevealed(nextState);
    if (nextState) {
      toast(
        "🎉 Otorisasi diberikan! Hasil perolehan suara kini dihitung dan dapat dilihat oleh Saksi & Publik.",
        "success"
      );
    } else {
      toast(
        "🔒 Perhitungan suara dikunci kembali. Rekapitulasi suara disembunyikan.",
        "warning"
      );
    }
  }

  const totalStudents = students.length;
  const totalVotedCount = votedStudents.length;

  return (
    <DashboardShell>
      {/* NAVBAR */}
      <Navbar />

      {/* NOTIFIKASI BANNER */}
      {confirmModal}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        {/* HEADER DASHBOARD KETUA OSIS */}
        <DashboardHero
          theme="sun"
          emoji="👑"
          badge="Ketua OSIS · Penanggung jawab pemilihan"
          title="Pusat kendali penyelenggara"
          description="Atur jadwal pemilihan, buka hasil penghitungan untuk saksi, dan pantau kesiapan bilik serta antrean pemilih."
          aside={
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-soft text-2xl">📜</span>
              <div>
                <p className="text-xs font-semibold text-slate-500">Status hasil suara</p>
                <p className="text-sm font-black">
                  {eventConfig.isResultRevealed ? (
                    <span className="text-emerald-600">🔓 Sudah dibuka</span>
                  ) : (
                    <span className="text-amber-600">🔒 Masih terkunci</span>
                  )}
                </p>
              </div>
            </div>
          }
        />

        {/* RINGKASAN */}
        <div className="mb-8 mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile icon="🗳️" label="Suara masuk" value={votesCount} unit="suara" color="violet" />
          <StatTile icon="✅" label="Sudah memilih" value={totalVotedCount} unit={`/ ${totalStudents}`} color="mint" delay={80} />
          <StatTile icon="⏳" label="Dalam antrean" value={queue.length} unit="siswa" color="sun" delay={160} />
          <StatTile icon="🚪" label="Bilik tersedia" value={booths.length} unit="bilik" color="coral" delay={240} />
        </div>

        {/* 3 UTAMA FEATURE CARDS */}
        <div className="mb-10 grid gap-8 lg:grid-cols-2">

          {/* ======================================== */}
          {/* FITUR 1: MANAJEMEN EVENT (JADWAL)        */}
          {/* ======================================== */}
          <Panel accent="violet" innerClassName="flex flex-col justify-between">
            <div>
              <PanelTitle
                icon="⏰"
                accent="violet"
                title="Jadwal & status event"
                subtitle="Atur jam operasional dan buka atau tutup pemilihan"
                right={
                  <span
                    className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold ${
                      eventConfig.status === "open"
                        ? "bg-mint-soft text-emerald-800"
                        : "bg-coral-soft text-rose-800"
                    }`}
                  >
                    {eventConfig.status === "open" ? "🟢 Dibuka" : "🔴 Ditutup"}
                  </span>
                }
              />

              {/* Status & Kontrol Cepat */}
              <div className="mt-6 rounded-2xl bg-sky p-4">
                <p className="text-xs font-bold text-slate-500">
                  Status saat ini
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {eventConfig.status === "open"
                    ? "Pemilihan E-Voting dibuka dan aktif melayani pemilih di TPS."
                    : "Event E-Voting ditutup. Akses memilih di bilik dinonaktifkan."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {eventConfig.status !== "open" ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus("open")}
                      className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-200"
                    >
                      ▶️ Buka Event Voting Sekarang
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus("closed")}
                      className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 shadow-md shadow-rose-200"
                    >
                      ⏹️ Tutup Event Voting
                    </button>
                  )}
                </div>
              </div>

              {/* Setting Jadwal Waktu */}
              <form onSubmit={handleSaveSchedule} className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">
                    Atur Kapan Tepatnya Event Dibuka &amp; Ditutup:
                  </p>
                  {(eventConfig.startTime || eventConfig.endTime) && (
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                      🕐 Jadwal Aktif
                    </span>
                  )}
                </div>

                {/* Info jadwal yang sudah tersimpan */}
                {(eventConfig.startTime || eventConfig.endTime) && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs text-violet-900 space-y-1">
                    {eventConfig.startTime && (
                      <p>
                        <span className="font-bold">▶️ Dibuka otomatis:</span>{" "}
                        {new Date(eventConfig.startTime).toLocaleString("id-ID", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {eventConfig.endTime && (
                      <p>
                        <span className="font-bold">⏹️ Ditutup otomatis:</span>{" "}
                        {new Date(eventConfig.endTime).toLocaleString("id-ID", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <p className="text-[10px] text-violet-500 pt-0.5">
                      ⚡ Status event akan menyesuaikan otomatis setiap 30 detik.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Waktu Wajib Buka (Start Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Waktu Wajib Tutup (End Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {(eventConfig.startTime || eventConfig.endTime) && (
                    <button
                      type="button"
                      onClick={() => {
                        saveEventConfig({ startTime: "", endTime: "" });
                        setStartTimeInput("");
                        setEndTimeInput("");
                        loadAllData();
                        toast("🗑️ Jadwal otomatis dihapus. Status event dikendalikan manual.", "warning");
                      }}
                      className="cursor-pointer rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Hapus Jadwal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-auto cursor-pointer rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                  >
                    💾 Simpan Jadwal Event
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 border-t-2 border-dashed border-violet-100 pt-4 text-xs text-slate-400">
              💡 Panitia registrasi dan bilik suara mengikuti status dan jadwal yang kamu atur di sini.
            </div>
          </Panel>

          {/* ======================================== */}
          {/* FITUR 2: OTORISASI PENGHITUNGAN SUARA    */}
          {/* ======================================== */}
          <Panel accent="sun" delay={120} innerClassName="flex flex-col justify-between">
            <div>
              <PanelTitle
                icon="🗳️"
                accent="sun"
                title="Buka hasil penghitungan"
                subtitle="Atur kapan saksi dan publik boleh melihat hasil suara"
                right={
                  <span
                    className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold ${
                      eventConfig.isResultRevealed
                        ? "bg-mint-soft text-emerald-800"
                        : "bg-sun-soft text-amber-800"
                    }`}
                  >
                    {eventConfig.isResultRevealed ? "🔓 Dibuka" : "🔒 Terkunci"}
                  </span>
                }
              />

              {/* Keterangan Tupoksi Guru */}
              <div className="mt-6 rounded-2xl bg-sun-soft/70 p-4">
                <p className="text-xs font-bold text-amber-900">
                  ⚠️ Aturan penyelenggara
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-950 font-medium">
                  Hasil perolehan suara <span className="font-bold underline">tidak dihitung/ditampilkan secara otomatis</span> di halaman Rekapitulasi/Saksi. Ketua OSIS bertindak sebagai saksi kunci yang harus menekan tombol aksi di bawah untuk memulai perhitungan dan mempublikasikan hasil.
                </p>
              </div>

              {/* Status Suara Masuk saat ini */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-500">Suara Masuk di Database</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{votesCount} <span className="text-xs font-normal text-slate-400">suara</span></p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-500">Status Rekapitulasi</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {eventConfig.isResultRevealed ? "Telah Di-rekap" : "Disembunyikan"}
                  </p>
                </div>
              </div>

              {/* TOMBOL AKSI PENGHITUNGAN */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {!eventConfig.isResultRevealed ? (
                  <button
                    type="button"
                    onClick={handleToggleAuthorization}
                    className="flex-1 cursor-pointer rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-amber-200 transition hover:from-amber-600 hover:to-amber-700 active:scale-[0.99]"
                  >
                    🚀 Mulai Hitung Suara &amp; Publikasikan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleAuthorization}
                    className="flex-1 cursor-pointer rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                  >
                    🔒 Kunci Perhitungan Suara
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Saksi & KPU OSIS melihat tampilan sesuai tombol aksi ini.
              </span>
              <Link
                href="/results"
                className="text-xs font-bold text-violet-600 hover:underline"
              >
                Lihat Halaman Database Suara →
              </Link>
            </div>

          </Panel>
        </div>

        {/* ======================================== */}
        {/* FITUR 3: PENGAWASAN PANITIA & BILIK      */}
        {/* ======================================== */}
        <Panel accent="mint" delay={80}>
          <div className="mb-6">
            <PanelTitle
              icon="🔍"
              accent="mint"
              title="Pantau bilik & antrean pemilih"
              subtitle="Status Meja Pendaftaran, Meja Pemanggil, dan setiap bilik secara langsung"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* PANTAUAN STATUS BILIK (3 BILIK) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-700">
                Status bilik suara ({booths.length} bilik)
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                {booths.map((booth) => {
                  const isWaiting = booth.status === "waiting";
                  const isAssigned = booth.status === "assigned";
                  const isActive = booth.status === "active";

                  return (
                    <div
                      key={booth.id}
                      className={`rounded-2xl border p-4 transition ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50/40"
                          : isAssigned
                          ? "border-amber-300 bg-amber-50/40"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">
                          Bilik {String(booth.id).padStart(2, "0")}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isWaiting
                              ? "bg-slate-200 text-slate-700"
                              : isAssigned
                              ? "bg-amber-200 text-amber-900"
                              : "bg-emerald-200 text-emerald-900"
                          }`}
                        >
                          {isWaiting
                            ? "Kosong / Siap"
                            : isAssigned
                            ? "Menunggu Masuk"
                            : "Sedang Memilih"}
                        </span>
                      </div>

                      <div className="mt-4 min-h-[60px]">
                        {booth.student ? (
                          <div>
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {booth.student.nama}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              NIS {booth.student.nis} • {booth.student.kelas}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400">
                            Belum ada siswa di bilik ini
                          </p>
                        )}
                      </div>

                      <div className="mt-3 border-t border-slate-200/60 pt-2 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Akses Bilik:</span>
                        <Link
                          href={`/booth/${booth.id}`}
                          className="font-bold text-violet-600 hover:underline"
                        >
                          Buka Bilik {booth.id} →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANTAUAN ANTREAN SISWA */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Antrean Pemilih ({queue.length})
                </h3>
                <Link
                  href="/caller"
                  className="text-[11px] font-bold text-violet-600 hover:underline"
                >
                  Ke Meja Pemanggil →
                </Link>
              </div>

              {queue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                  Belum ada siswa dalam antrean pemilih.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {queue.map((student, idx) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {student.nama}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {student.kelas}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

export default function KetuaOsisDashboard() {
  return (
    <AuthGuard allowedRoles={["superadmin", "ketua"]}>
      <KetuaOsisDashboardContent />
    </AuthGuard>
  );
}

