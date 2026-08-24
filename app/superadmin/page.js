/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import {
  getAcademicYear,
  saveAcademicYear,
  getKetuaOsisIdentity,
  saveKetuaOsisIdentity,
  getCommitteeList,
  addCommitteeMember,
  removeCommitteeMember,
  getBooths,
  addBooth,
  removeBooth,
  getCandidatesList,
  addCandidate,
  removeCandidate,
  getStudentsList,
  importDptFromData,
  resetVotingSimulation,
  subscribeVotingStorage,
  getAuthCreds,
  saveAuthCreds,
} from "@/lib/votingStorage";


function SuperadminPageContent() {
  const [activeTab, setActiveTab] = useState("overview");

  // State master data
  const [academicYear, setAcademicYearState] = useState("2026/2027");
  const [ketuaOsis, setKetuaOsisState] = useState({
    nama: "",
    nis: "",
    kelas: "",
    jabatan: "",
  });
  const [committee, setCommittee] = useState([]);
  const [booths, setBooths] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);

  // Form inputs
  const [newYearInput, setNewYearInput] = useState("");
  const [ketuaForm, setKetuaForm] = useState({
    nama: "",
    nis: "",
    kelas: "",
    jabatan: "",
  });

  const [committeeForm, setCommitteeForm] = useState({
    nama: "",
    username: "",
    role: "Registrator",
  });

  const [paslonForm, setPaslonForm] = useState({
    nomor: "",
    ketua: "",
    wakil: "",
    slogan: "",
    foto: "/candidates/paslon-01.png",
    visi: "",
    misi: "",
    programKerja: "",
  });

  const [importJsonText, setImportJsonText] = useState("");
  const [notification, setNotification] = useState(null);

  // Creds forms
  const [superadminCredsForm, setSuperadminCredsForm] = useState({
    username: "",
    password: "",
  });
  const [ketuaCredsForm, setKetuaCredsForm] = useState({
    username: "",
    password: "",
  });

  function loadAllData() {
    const year = getAcademicYear();
    setAcademicYearState(year);
    if (!newYearInput) setNewYearInput(year);

    const ketua = getKetuaOsisIdentity();
    setKetuaOsisState(ketua);
    setKetuaForm(ketua);

    setCommittee(getCommitteeList());
    setBooths(getBooths());
    setCandidates(getCandidatesList());
    setStudents(getStudentsList());

    const creds = getAuthCreds();
    setSuperadminCredsForm({
      username: creds.superadmin.username,
      password: creds.superadmin.password,
    });
    setKetuaCredsForm({
      username: creds.ketua.username,
      password: creds.ketua.password,
    });
  }


  useEffect(() => {
    queueMicrotask(() => {
      loadAllData();
    });
    return subscribeVotingStorage(loadAllData);
  }, []);

  function showBanner(message, type = "success") {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }

  // 1. Tahun Ajaran
  function handleSaveYear(e) {
    e.preventDefault();
    if (!newYearInput.trim()) return;
    saveAcademicYear(newYearInput.trim());
    showBanner("✅ Tahun Ajaran berhasil diperbarui!");
  }

  // 1b. Manajemen Creds Auth
  function handleSaveSuperadminCreds(e) {
    e.preventDefault();
    if (!superadminCredsForm.username.trim() || !superadminCredsForm.password.trim()) return;
    saveAuthCreds({
      superadmin: {
        username: superadminCredsForm.username.trim(),
        password: superadminCredsForm.password.trim(),
      },
    });
    showBanner("✅ Password & Username Superadmin berhasil diperbarui!");
  }

  function handleSaveKetuaCreds(e) {
    e.preventDefault();
    if (!ketuaCredsForm.username.trim() || !ketuaCredsForm.password.trim()) return;
    saveAuthCreds({
      ketua: {
        username: ketuaCredsForm.username.trim(),
        password: ketuaCredsForm.password.trim(),
      },
    });
    showBanner("👑 Password & Username Ketua OSIS berhasil diperbarui!");
  }


  // 2. Ketua OSIS
  function handleSaveKetua(e) {
    e.preventDefault();
    saveKetuaOsisIdentity(ketuaForm);
    showBanner("👑 Identitas Ketua OSIS Saat Ini berhasil disimpan!");
  }

  // 3. Panitia
  function handleAddCommittee(e) {
    e.preventDefault();
    if (!committeeForm.nama || !committeeForm.username) return;
    addCommitteeMember(committeeForm);
    setCommitteeForm({ nama: "", username: "", role: "Registrator" });
    showBanner("👤 Akun Panitia baru berhasil ditambahkan!");
  }

  function handleRemoveCommittee(id) {
    removeCommitteeMember(id);
    showBanner("🗑️ Panitia berhasil dihapus.", "warning");
  }

  // 4. Bilik Suara Dinamis
  function handleAddBooth() {
    const newB = addBooth();
    showBanner(`➕ Bilik ${String(newB.id).padStart(2, "0")} berhasil ditambahkan!`);
  }

  function handleRemoveBooth(id) {
    const success = removeBooth(id);
    if (success) {
      showBanner(`🗑️ Bilik ${String(id).padStart(2, "0")} berhasil dihapus.`, "warning");
    } else {
      showBanner("⚠️ Minimal harus ada 1 Bilik Suara di sistem.", "warning");
    }
  }

  // 5. Master Paslon
  function handleAddPaslon(e) {
    e.preventDefault();
    if (!paslonForm.ketua || !paslonForm.wakil) return;

    const parsedMisi = paslonForm.misi
      ? paslonForm.misi.split("\n").filter((s) => s.trim())
      : ["Meningkatkan kreativitas siswa", "Menjalin komunikasi terbuka"];

    const parsedProgr = paslonForm.programKerja
      ? paslonForm.programKerja.split("\n").filter((s) => s.trim())
      : ["Pekan Olahraga", "Jumat Bersih"];

    addCandidate({
      nomor: paslonForm.nomor,
      ketua: paslonForm.ketua,
      wakil: paslonForm.wakil,
      slogan: paslonForm.slogan || "Maju Bersama OSIS",
      foto: paslonForm.foto || "/candidates/paslon-01.png",
      visi: paslonForm.visi || "Mewujudkan OSIS yang aktif dan inovatif.",
      misi: parsedMisi,
      programKerja: parsedProgr,
    });

    setPaslonForm({
      nomor: "",
      ketua: "",
      wakil: "",
      slogan: "",
      foto: "/candidates/paslon-01.png",
      visi: "",
      misi: "",
      programKerja: "",
    });

    showBanner("🏆 Master Paslon baru berhasil ditambahkan!");
  }

  function handleRemovePaslon(id) {
    removeCandidate(id);
    showBanner("🗑️ Paslon berhasil dihapus.", "warning");
  }

  // 6. Import DPT
  function handleImportDptText(e) {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        showBanner("⚠️ Format JSON DPT harus berupa Array of Object siswa.", "warning");
        return;
      }
      importDptFromData(parsed);
      setImportJsonText("");
      showBanner(`📥 Berhasil meng-import ${parsed.length} siswa ke DPT!`);
    } catch {
      showBanner("⚠️ Gagal membaca format JSON DPT. Pastikan format valid.", "warning");
    }
  }

  function handleResetDptDefault() {
    if (window.confirm("Kembalikan Daftar Pemilih Tetap (DPT) ke data default sekolah?")) {
      localStorage.removeItem("osis_custom_dpt");
      loadAllData();
      showBanner("🔄 DPT berhasil dikembalikan ke data default sekolah.");
    }
  }

  // 7. System Override & Reset Simulasi
  function handleSystemOverride() {
    if (
      window.confirm(
        "🚨 SYSTEM OVERRIDE: Apakah Anda yakin ingin membersihkan SELURUH transaksi voting, antrean, bilik, dan data uji coba?"
      )
    ) {
      resetVotingSimulation();
      showBanner("⚡ SYSTEM OVERRIDE Selesai! Database simulasi voting telah dibersihkan.", "warning");
    }
  }

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
        {/* HEADER SUPERADMIN */}
        <div className="mb-10 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-6 lg:p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/30 border border-violet-400/40 px-3.5 py-1 text-xs font-extrabold text-violet-200">
                <span>🌟 Superadmin Module</span>
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                <span>Pembina OSIS &amp; Tim IT</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold lg:text-4xl text-white">
                Pusat Kendali <span className="text-violet-300">Hak Akses Tertinggi</span>
              </h1>
              <p className="mt-2 text-violet-200 max-w-2xl text-sm leading-relaxed">
                Kelola Tahun Ajaran ({academicYear}), Identitas Ketua OSIS Penyelenggara, Akun Panitia, Jumlah Bilik Suara Dinamis, Import DPT, Master Paslon, dan System Override.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={handleSystemOverride}
                className="cursor-pointer rounded-2xl border border-rose-500/50 bg-rose-600/90 px-5 py-3.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-rose-600 active:scale-[0.98]"
              >
                🚨 System Override / Reset Simulasi
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION TAB SUPERADMIN */}
        <div className="mb-8 flex flex-wrap gap-2.5 border-b border-slate-200 pb-4">
          {[
            { id: "overview", label: "📊 Ringkasan & Tahun Ajaran" },
            { id: "auth", label: "🔑 Hak Akses & Password" },
            { id: "ketua", label: "👑 Identitas Ketua OSIS" },
            { id: "panitia", label: "👥 Manajemen Panitia" },
            { id: "bilik", label: "🗳️ Bilik Suara Dinamis" },
            { id: "paslon", label: "🏆 Master Paslon" },
            { id: "dpt", label: "📥 Import DPT Siswa" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-600 hover:bg-violet-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* TAB CONTENTS */}

        {/* ======================================== */}
        {/* TAB 1: OVERVIEW & TAHUN AJARAN           */}
        {/* ======================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Tahun Ajaran Aktif</p>
                <p className="mt-2 text-3xl font-black text-violet-700">{academicYear}</p>
                <p className="mt-1 text-xs text-slate-500">Isolasi data akademik</p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Total DPT Siswa</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{students.length} <span className="text-xs font-normal text-slate-400">siswa</span></p>
                <p className="mt-1 text-xs text-slate-500">Terdaftar di master data</p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Bilik Suara Aktif</p>
                <p className="mt-2 text-3xl font-black text-emerald-600">{booths.length} <span className="text-xs font-normal text-slate-400">bilik</span></p>
                <p className="mt-1 text-xs text-slate-500">Kapasitas TPS</p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Master Paslon</p>
                <p className="mt-2 text-3xl font-black text-amber-600">{candidates.length} <span className="text-xs font-normal text-slate-400">paslon</span></p>
                <p className="mt-1 text-xs text-slate-500">Kandidat pemilihan</p>
              </div>
            </div>

            {/* FORM GANTI TAHUN AJARAN */}
            <div className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                1. Manajemen Tahun Ajaran (Academic Year)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Ganti tahun ajaran aktif untuk mengisolasi data penyelenggaraan pemilu per tahun akademik.
              </p>

              <form onSubmit={handleSaveYear} className="mt-6 flex flex-col sm:flex-row gap-4 max-w-lg">
                <input
                  type="text"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  Simpan Tahun Ajaran
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB AUTH: HAK AKSES & PASSWORD           */}
        {/* ======================================== */}
        {activeTab === "auth" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* SUPERADMIN CREDS FORM */}
            <div className="rounded-3xl border border-violet-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-lg font-bold">
                  🌟
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Kredensial Login Superadmin
                  </h2>
                  <p className="text-xs text-slate-500">
                    Akun Pembina OSIS & Tim IT dengan Hak Akses Tertinggi
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSuperadminCreds} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Superadmin
                  </label>
                  <input
                    type="text"
                    value={superadminCredsForm.username}
                    onChange={(e) => setSuperadminCredsForm({ ...superadminCredsForm, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Superadmin Baru
                  </label>
                  <input
                    type="text"
                    value={superadminCredsForm.password}
                    onChange={(e) => setSuperadminCredsForm({ ...superadminCredsForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  💾 Simpan Kredensial Superadmin
                </button>
              </form>
            </div>

            {/* KETUA OSIS CREDS FORM */}
            <div className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg font-bold">
                  👑
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Kredensial Login Ketua OSIS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Akun Penanggung Jawab Penyelenggara Pemilu
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveKetuaCreds} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Ketua OSIS
                  </label>
                  <input
                    type="text"
                    value={ketuaCredsForm.username}
                    onChange={(e) => setKetuaCredsForm({ ...ketuaCredsForm, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Ketua OSIS Baru
                  </label>
                  <input
                    type="text"
                    value={ketuaCredsForm.password}
                    onChange={(e) => setKetuaCredsForm({ ...ketuaCredsForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 shadow-sm"
                >
                  💾 Simpan Kredensial Ketua OSIS
                </button>
              </form>
            </div>
          </div>
        )}


        {/* ======================================== */}
        {/* TAB 2: IDENTITAS KETUA OSIS              */}
        {/* ======================================== */}
        {activeTab === "ketua" && (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-sm max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg">
                👑
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  2. Menetapkan Identitas Ketua OSIS Saat Ini (Demisioner)
                </h2>
                <p className="text-xs text-slate-500">
                  Tetapkan akun/identitas Ketua OSIS yang bertanggung jawab atas acara pemilu.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKetua} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Ketua OSIS Penyelenggara
                </label>
                <input
                  type="text"
                  value={ketuaForm.nama}
                  onChange={(e) => setKetuaForm({ ...ketuaForm, nama: e.target.value })}
                  placeholder="Nama Ketua OSIS..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    value={ketuaForm.nis}
                    onChange={(e) => setKetuaForm({ ...ketuaForm, nis: e.target.value })}
                    placeholder="NIS..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={ketuaForm.kelas}
                    onChange={(e) => setKetuaForm({ ...ketuaForm, kelas: e.target.value })}
                    placeholder="Contoh: XII RPL 1"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status / Jabatan Resmi
                </label>
                <input
                  type="text"
                  value={ketuaForm.jabatan}
                  onChange={(e) => setKetuaForm({ ...ketuaForm, jabatan: e.target.value })}
                  placeholder="Contoh: Ketua OSIS Masa Bakti 2025/2026 (Demisioner)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 shadow-sm"
                >
                  Tetapkan Ketua OSIS Penyelenggara
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB 3: MANAJEMEN PANITIA                 */}
        {/* ======================================== */}
        {activeTab === "panitia" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Tambah Akun Panitia
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Buatkan akun baru untuk petugas TPS.
              </p>

              <form onSubmit={handleAddCommittee} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Panitia
                  </label>
                  <input
                    type="text"
                    value={committeeForm.nama}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, nama: e.target.value })}
                    placeholder="Nama..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    value={committeeForm.username}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, username: e.target.value })}
                    placeholder="Username..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran Panitia
                  </label>
                  <select
                    value={committeeForm.role}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  >
                    <option value="Registrator">Registrator (Meja Pendaftaran)</option>
                    <option value="Caller">Caller (Meja Pemanggil)</option>
                    <option value="Saksi">Saksi / KPU OSIS</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  + Tambah Panitia
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Daftar Panitia Aktif ({committee.length})
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Daftar petugas event yang telah terdaftar.
              </p>

              <div className="mt-5 space-y-3">
                {committee.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{item.nama}</p>
                        <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Username: @{item.username}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveCommittee(item.id)}
                      className="cursor-pointer text-xs font-semibold text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB 4: BILIK SUARA DINAMIS                */}
        {/* ======================================== */}
        {activeTab === "bilik" && (
          <div className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  4. Manajemen Bilik Suara Dinamis
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah atau kurangi jumlah Bilik Suara secara real-time sesuai kebutuhan kapasitas TPS.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddBooth}
                className="cursor-pointer rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
              >
                ➕ Tambah Bilik Suara Baru
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {booths.map((booth) => (
                <div
                  key={booth.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-lg">
                        Bilik {String(booth.id).padStart(2, "0")}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {booth.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      URL: <code className="font-mono text-violet-700">/booth/{booth.id}</code>
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-3 flex items-center justify-between">
                    <Link
                      href={`/booth/${booth.id}`}
                      className="text-xs font-bold text-violet-600 hover:underline"
                    >
                      Buka Tampilan Bilik →
                    </Link>

                    {booths.length > 1 && (
                      <button
                        onClick={() => handleRemoveBooth(booth.id)}
                        className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB 5: MASTER PASLON                     */}
        {/* ======================================== */}
        {activeTab === "paslon" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Input Master Paslon
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Tambah kandidat Paslon baru ke sistem.
              </p>

              <form onSubmit={handleAddPaslon} className="mt-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Urut
                  </label>
                  <input
                    type="text"
                    value={paslonForm.nomor}
                    onChange={(e) => setPaslonForm({ ...paslonForm, nomor: e.target.value })}
                    placeholder="Contoh: 04"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Calon Ketua
                  </label>
                  <input
                    type="text"
                    value={paslonForm.ketua}
                    onChange={(e) => setPaslonForm({ ...paslonForm, ketua: e.target.value })}
                    placeholder="Nama Ketua..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Calon Wakil
                  </label>
                  <input
                    type="text"
                    value={paslonForm.wakil}
                    onChange={(e) => setPaslonForm({ ...paslonForm, wakil: e.target.value })}
                    placeholder="Nama Wakil..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slogan Paslon
                  </label>
                  <input
                    type="text"
                    value={paslonForm.slogan}
                    onChange={(e) => setPaslonForm({ ...paslonForm, slogan: e.target.value })}
                    placeholder="Slogan..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Foto Paslon
                  </label>
                  <input
                    type="text"
                    value={paslonForm.foto}
                    onChange={(e) => setPaslonForm({ ...paslonForm, foto: e.target.value })}
                    placeholder="/candidates/paslon-01.png"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visi Paslon
                  </label>
                  <textarea
                    rows={2}
                    value={paslonForm.visi}
                    onChange={(e) => setPaslonForm({ ...paslonForm, visi: e.target.value })}
                    placeholder="Visi utama..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  + Tambah Paslon
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Master Data Paslon Aktif ({candidates.length})
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Paslon yang akan tampil pada layar Bilik Suara.
              </p>

              <div className="mt-5 space-y-4">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-100">
                        <img src={cand.foto} alt={cand.ketua} className="h-full w-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-violet-600 text-white text-[9px] font-black px-1 rounded">
                          {cand.nomor}
                        </span>
                      </div>
                      <div>
                        <span className="rounded bg-violet-600 text-white font-bold text-[10px] px-2 py-0.5">
                          PASLON {cand.nomor}
                        </span>
                        <p className="font-bold text-slate-900 text-sm mt-1">{cand.ketua} &amp; {cand.wakil}</p>
                        <p className="text-xs italic text-slate-500">&quot;{cand.slogan}&quot;</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemovePaslon(cand.id)}
                      className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Hapus Paslon
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB 6: IMPORT DPT SISWA                  */}
        {/* ======================================== */}
        {activeTab === "dpt" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Import DPT (Excel / CSV / JSON)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Paste data JSON DPT siswa untuk memperbarui master pemilih.
              </p>

              <form onSubmit={handleImportDptText} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data DPT (JSON Format)
                  </label>
                  <textarea
                    rows={6}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder={`[\n  { "id": 1, "nis": "001", "nama": "Ahmad Hilbram", "kelas": "XII RPL 1" }\n]`}
                    className="w-full rounded-xl border border-slate-200 p-3 font-mono text-[11px] text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  📥 Import Data DPT
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={handleResetDptDefault}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  🔄 Reset DPT ke Default Sekolah
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Daftar Pemilih Tetap / DPT ({students.length} Siswa)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Master data siswa terverifikasi yang memiliki hak pilih di TPS.
              </p>

              <div className="mt-5 max-h-[380px] overflow-y-auto pr-1 space-y-2">
                {students.map((student, idx) => (
                  <div
                    key={student.id || idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400 w-6">{idx + 1}.</span>
                      <div>
                        <p className="font-bold text-slate-900">{student.nama}</p>
                        <p className="text-[11px] text-slate-500">NIS: {student.nis}</p>
                      </div>
                    </div>

                    <span className="rounded-lg bg-violet-100 px-2.5 py-1 font-bold text-violet-700 text-[10px]">
                      {student.kelas}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SuperadminPage() {
  return (
    <AuthGuard allowedRoles={["superadmin"]}>
      <SuperadminPageContent />
    </AuthGuard>
  );
}

