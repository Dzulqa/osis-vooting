/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import {
  getBooths,
  getQueue,
  getVotedStudents,
  getVotes,
  getEventConfig,
  getCandidatesList,
  getStudentsList,
  getVoteSummary,
  saveEventConfig,
  toggleResultRevealed,
  subscribeVotingStorage,
  checkAndApplySchedule,
} from "@/lib/votingStorage";

function KetuaOsisDashboardContent() {

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
  const [summaryData, setSummaryData] = useState({
    totalVotes: 0,
    candidateStats: [],
    leader: null,
  });
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");
  const [notification, setNotification] = useState(null);

  function loadAllData() {
    const config = getEventConfig();
    setEventConfig(config);
    setBooths(getBooths());
    setQueue(getQueue());
    setStudents(getStudentsList());
    const cands = getCandidatesList();
    setCandidates(cands);
    const summary = getVoteSummary(cands);
    setSummaryData(summary);
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
        showBanner(msg, result.newStatus === "open" ? "success" : "warning");
      }
    }, 30000);

    const unsubscribe = subscribeVotingStorage(loadAllData);

    return () => {
      clearInterval(scheduleInterval);
      unsubscribe();
    };
  }, []);

  function showBanner(message, type = "success") {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }

  // Toggle Buka / Tutup Event Voting
  function handleToggleStatus(newStatus) {
    saveEventConfig({ status: newStatus });
    showBanner(
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
      showBanner("⚠️ Harap isi minimal Waktu Buka atau Waktu Tutup!", "warning");
      return;
    }

    if (startTimeInput && endTimeInput && new Date(startTimeInput) >= new Date(endTimeInput)) {
      showBanner("⚠️ Waktu Buka harus lebih awal dari Waktu Tutup!", "warning");
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
      showBanner(`📅 Jadwal disimpan & diterapkan! ${statusMsg}`, result.newStatus === "open" ? "success" : "warning");
    } else {
      showBanner("📅 Jadwal Event E-Voting berhasil diperbarui! Status akan menyesuaikan otomatis.");
    }
  }

  // Otorisasi Penghitungan Suara
  function handleToggleAuthorization() {
    const nextState = !eventConfig.isResultRevealed;
    toggleResultRevealed(nextState);
    if (nextState) {
      showBanner(
        "🎉 Otorisasi diberikan! Hasil perolehan suara kini dihitung dan dapat dilihat oleh Saksi & Publik.",
        "success"
      );
    } else {
      showBanner(
        "🔒 Perhitungan suara dikunci kembali. Rekapitulasi suara disembunyikan.",
        "warning"
      );
    }
  }

  const totalStudents = students.length;
  const totalVotedCount = votedStudents.length;

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16">
      {/* NAVBAR */}
      <Navbar />

      {/* NOTIFIKASI BANNER */}

      {notification && (
        <div className="mx-auto max-w-7xl px-6 pt-6 lg:px-10">
          <div
            className={`flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-md ${
              notification.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            <p className="text-sm font-semibold">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-10">
        {/* HEADER DASHBOARD KETUA OSIS */}
        <div className="mb-10 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-extrabold text-amber-800">
                <span>👑 Ketua OSIS Saat Ini</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                <span>Penanggung Jawab Pemilihan</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900 lg:text-4xl">
                Pusat Kendali <span className="text-amber-600">Penyelenggara</span>
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl text-sm leading-relaxed">
                Sebagai Penanggung Jawab acara E-Voting, Anda berwenang mengatur jadwal operasional event, memberikan otorisasi rekapitulasi suara untuk Saksi, dan mengawasi kesiapan seluruh bilik & antrean panitia.
              </p>
            </div>

            <div className="shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                  📜
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Status Otorisasi Suara</p>
                  <p className="text-sm font-black text-slate-900">
                    {eventConfig.isResultRevealed ? (
                      <span className="text-emerald-600">🔓 Telah Diotorisasi</span>
                    ) : (
                      <span className="text-amber-600">🔒 Belum Dihitung</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 UTAMA FEATURE CARDS */}
        <div className="mb-10 grid gap-8 lg:grid-cols-2">

          {/* ======================================== */}
          {/* FITUR 1: MANAJEMEN EVENT (JADWAL)        */}
          {/* ======================================== */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold text-lg">
                    ⏰
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      1. Manajemen Event (Jadwal)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kontrol jam operasional & status E-Voting
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3.5 py-1 text-xs font-extrabold ${
                    eventConfig.status === "open"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {eventConfig.status === "open" ? "🟢 Event DIBUKA" : "🔴 Event DITUTUP"}
                </span>
              </div>

              {/* Status & Kontrol Cepat */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status Operasional Saat Ini
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
                        showBanner("🗑️ Jadwal otomatis dihapus. Status event dikendalikan manual.", "warning");
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

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
              💡 *Panitia registrasi dan bilik suara akan menyesuaikan dengan status jadwal yang ditentukan oleh Ketua OSIS.*
            </div>
          </section>

          {/* ======================================== */}
          {/* FITUR 2: OTORISASI PENGHITUNGAN SUARA    */}
          {/* ======================================== */}
          <section className="rounded-3xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-lg">
                    🗳️
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      2. Otorisasi Penghitungan Suara
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kendalikan visibilitas hasil suara untuk Saksi & Publik
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3.5 py-1 text-xs font-extrabold ${
                    eventConfig.isResultRevealed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {eventConfig.isResultRevealed ? "🔓 Diotorisasi" : "🔒 Terkunci"}
                </span>
              </div>

              {/* Keterangan Tupoksi Guru */}
              <div className="mt-6 rounded-2xl bg-amber-50/60 border border-amber-200/60 p-4">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  ⚠️ Regulasi Otorisasi Penyelenggara
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

              {/* DUA TOMBOL AKSI UTAMA PENGHITUNGAN */}
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

                <button
                  type="button"
                  onClick={() => {
                    setShowCalculationDetails(true);
                    showBanner("📊 Berhasil menghitung total suara & paslon unggul!");
                  }}
                  className="flex-1 cursor-pointer rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-xs font-extrabold text-violet-800 transition hover:bg-violet-100 shadow-sm"
                >
                  📊 Hitung Total &amp; Paslon Unggul
                </button>
              </div>

              {/* PRANALA/PANEL HASIL KALKULASI KETUA OSIS */}
              {(showCalculationDetails || eventConfig.isResultRevealed) && (
                <div className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-amber-50/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      🏆 Hasil Kalkulasi Pemilihan Real-Time
                    </p>
                    <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                      Khusus Penyelenggara
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3.5 border border-violet-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Suara Dihitung</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{summaryData.totalVotes} <span className="text-xs font-normal text-slate-400">suara</span></p>
                    </div>

                    <div className="rounded-xl bg-white p-3.5 border border-amber-200">
                      <p className="text-[10px] font-bold text-amber-700 uppercase">Paslon Unggul saat Ini</p>
                      {summaryData.leader ? (
                        <p className="text-sm font-black text-amber-900 mt-1 truncate">
                          Paslon {summaryData.leader.nomor} — {summaryData.leader.ketua}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 mt-1">Belum Ada Suara</p>
                      )}
                    </div>
                  </div>

                  {/* BREAKDOWN PER PASLON */}
                  <div className="space-y-2 pt-2 border-t border-violet-100">
                    <p className="text-[11px] font-bold text-slate-700">Rincian Perolehan Per Paslon:</p>
                    {summaryData.candidateStats.map((item) => (
                      <div key={item.candidate.id} className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="rounded-lg bg-violet-100 px-2 py-0.5 font-bold text-violet-700 text-[10px]">
                            Paslon {item.candidate.nomor}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">{item.candidate.ketua} &amp; {item.candidate.wakil}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-extrabold text-slate-900">{item.count} Suara</span>
                          <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          </section>
        </div>

        {/* ======================================== */}
        {/* FITUR 3: PENGAWASAN PANITIA & BILIK      */}
        {/* ======================================== */}
        <section className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                <span>🔍 Pengawasan Panitia</span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                3. Pemantauan Kesiapan Bilik & Antrean Pemilih
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mengawasi kinerja Meja Pendaftaran, Meja Pemanggil, dan status masing-masing Bilik Suara secara real-time.
              </p>
            </div>

            {/* Metric badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Hak Pilih</p>
                <p className="text-lg font-bold text-slate-900">{totalVotedCount} / {totalStudents}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Di Antrean</p>
                <p className="text-lg font-bold text-violet-600">{queue.length} Siswa</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* PANTAUAN STATUS BILIK (3 BILIK) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Status Kesiapan Bilik Suara ({booths.length} Bilik)
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
        </section>
      </div>
    </main>
  );
}

export default function KetuaOsisDashboard() {
  return (
    <AuthGuard allowedRoles={["superadmin", "ketua"]}>
      <KetuaOsisDashboardContent />
    </AuthGuard>
  );
}

