"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import SearchSelect from "@/components/SearchSelect";
import CandidatePhoto from "@/components/CandidatePhoto";
import PhotoUpload, { PhotoReplaceButton } from "@/components/PhotoUpload";
import useSinarData from "@/lib/useSinarData";
import { Banner, DashboardHero, DashboardShell, StatTile } from "@/components/Dashboard";
import {
  getAcademicYear,
  getElections,
  getElectionStats,
  openNewElection,
  setCurrentElection,
  getKetuaOsisIdentity,
  saveKetuaOsisIdentity,
  getCommitteeList,
  addCommitteeMember,
  removeCommitteeMember,
  getBooths,
  addBooth,
  removeBooth,
  regenerateBoothCode,
  getCandidatesList,
  addCandidate,
  removeCandidate,
  updateCandidate,
  getStudentsList,
  saveStudentsList,
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

  const [elections, setElections] = useState([]);

  // Form inputs
  const [electionForm, setElectionForm] = useState({
    academicYear: "",
    name: "",
    copyBooths: true,
    copyCommittee: true,
  });
  const [isConfirmingElection, setIsConfirmingElection] = useState(false);
  const [ketuaForm, setKetuaForm] = useState({
    nama: "",
    nis: "",
    kelas: "",
    jabatan: "",
  });

  const [committeeForm, setCommitteeForm] = useState({
    person: "", // "siswa:<nis>" atau "guru:<kode>", dipilih dari Sinar
    password: "",
    role: "Registrator",
  });

  const [paslonForm, setPaslonForm] = useState({
    nomor: "",
    ketuaNis: "",
    wakilNis: "",
    slogan: "",
    foto: "",
    visi: "",
    misi: "",
    programKerja: "",
  });

  // Semua data master (tahun ajaran, kelas, siswa, guru) berasal dari Sinar
  const sinar = useSinarData();
  const [dptClass, setDptClass] = useState("");
  const [notification, setNotification] = useState(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

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
    setAcademicYearState(getAcademicYear());
    setElections(
      getElections()
        .map((election) => ({ ...election, stats: getElectionStats(election.id) }))
        .reverse()
    );

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


  // Tahun ajaran yang sudah punya pemilihan tidak bisa dibuka lagi
  const yearOptions = sinar.years.map((y) => {
    const used = elections.some((e) => e.academicYear === y.name);
    return {
      value: y.name,
      label: y.name,
      sublabel: used ? "Sudah ada pemilihan — aktifkan dari riwayat" : undefined,
      badge: y.active ? "Aktif di Sinar" : undefined,
    };
  });
  const currentElection = elections.find((e) => e.isCurrent);

  const studentOptions = sinar.students.map((st) => ({
    value: st.nis,
    label: st.nama,
    sublabel: `NIS ${st.nis} · ${st.kelas}`,
    keywords: `${st.nis} ${st.kelas}`,
  }));

  const personOptions = [
    ...sinar.teachers.map((t) => ({
      value: `guru:${t.id}`,
      label: t.nama,
      sublabel: `Guru · ${t.nis}`,
      keywords: t.nis,
    })),
    ...sinar.students.map((st) => ({
      value: `siswa:${st.nis}`,
      label: st.nama,
      sublabel: `Siswa · NIS ${st.nis} · ${st.kelas}`,
      keywords: `${st.nis} ${st.kelas}`,
    })),
  ];

  const classOptions = [
    { value: "", label: "Semua kelas", sublabel: `${sinar.students.length} siswa aktif` },
    ...sinar.classes.map((c) => ({
      value: c,
      label: c,
      sublabel: `${sinar.students.filter((st) => st.kelas === c).length} siswa`,
    })),
  ];

  const paslonNumberOptions = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0"))
    .filter((n) => !candidates.some((c) => String(c.nomor) === n))
    .map((n) => ({ value: n, label: `Nomor urut ${n}` }));

  const jabatanOptions = [
    "Ketua OSIS Saat Ini (Demisioner)",
    "Ketua OSIS Aktif",
  ].map((j) => ({ value: j, label: j }));

  const roleOptions = [
    { value: "Registrator", label: "Registrator (Meja Pendaftaran)" },
    { value: "Caller", label: "Caller (Meja Pemanggil)" },
    { value: "Saksi", label: "Saksi / KPU OSIS" },
  ];

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

  // 1. Pemilihan per tahun ajaran
  function handleRequestNewElection(e) {
    e.preventDefault();
    if (!electionForm.academicYear || !sinar.years.some((y) => y.name === electionForm.academicYear)) {
      showBanner("⚠️ Pilih tahun ajaran dari daftar Sinar.", "warning");
      return;
    }
    if (elections.some((el) => el.academicYear === electionForm.academicYear)) {
      showBanner(`⚠️ Pemilihan ${electionForm.academicYear} sudah ada. Aktifkan dari daftar riwayat.`, "warning");
      return;
    }
    setIsConfirmingElection(true);
  }

  function handleConfirmNewElection() {
    const result = openNewElection(electionForm);
    setIsConfirmingElection(false);

    if (!result.success) {
      showBanner(`⚠️ ${result.message}`, "warning");
      return;
    }

    setElectionForm({ academicYear: "", name: "", copyBooths: true, copyCommittee: true });
    // Ambil DPT terbaru dari Sinar untuk pemilihan baru
    sinar.refresh(true);
    showBanner(
      `🎉 ${result.election.name} dibuka! Atur Ketua OSIS, paslon, dan DPT, lalu Ketua OSIS membuka jadwal pemilihan.`
    );
  }

  function handleSwitchElection(election) {
    const result = setCurrentElection(election.id);
    if (!result.success) {
      showBanner(`⚠️ ${result.message}`, "warning");
      return;
    }
    showBanner(`🔁 Sekarang mengelola ${election.name}.`);
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
    if (!ketuaForm.nis || !ketuaForm.jabatan) {
      showBanner("⚠️ Pilih siswa dan jabatan terlebih dahulu.", "warning");
      return;
    }
    saveKetuaOsisIdentity(ketuaForm);
    showBanner("👑 Identitas Ketua OSIS Saat Ini berhasil disimpan!");
  }

  // 3. Panitia
  function handleAddCommittee(e) {
    e.preventDefault();
    const person = personOptions.find((p) => p.value === committeeForm.person);
    if (!person || !committeeForm.password.trim()) return;

    // Username diturunkan dari NIS / kode guru Sinar, bukan diketik bebas
    const [type, refId] = committeeForm.person.split(":");
    const username = String(refId).toLowerCase();

    if (committee.some((m) => m.username === username)) {
      showBanner("⚠️ Orang ini sudah terdaftar sebagai panitia.", "warning");
      return;
    }
    addCommitteeMember({
      nama: person.label,
      username,
      password: committeeForm.password.trim(),
      role: committeeForm.role,
      sinarType: type,
      sinarId: refId,
    });
    setCommitteeForm({ person: "", password: "", role: "Registrator" });
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

  function handleRegenerateBoothCode(id) {
    regenerateBoothCode(id);
    showBanner(`🔑 Kode akses Bilik ${String(id).padStart(2, "0")} diganti. Perangkat lama harus login ulang.`);
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
    const ketua = sinar.students.find((st) => st.nis === paslonForm.ketuaNis);
    const wakil = sinar.students.find((st) => st.nis === paslonForm.wakilNis);
    if (!ketua || !wakil) {
      showBanner("⚠️ Pilih calon ketua dan calon wakil dari data siswa Sinar.", "warning");
      return;
    }
    if (!paslonForm.foto) {
      showBanner("⚠️ Unggah foto paslon terlebih dahulu.", "warning");
      return;
    }
    if (ketua.nis === wakil.nis) {
      showBanner("⚠️ Calon ketua dan wakil harus orang yang berbeda.", "warning");
      return;
    }
    if (candidates.some((c) => [c.ketuaNis, c.wakilNis].some((n) => n && [ketua.nis, wakil.nis].includes(n)))) {
      showBanner("⚠️ Salah satu calon sudah tergabung di paslon lain.", "warning");
      return;
    }

    const parsedMisi = paslonForm.misi
      ? paslonForm.misi.split("\n").filter((s) => s.trim())
      : [];

    const parsedProgr = paslonForm.programKerja
      ? paslonForm.programKerja.split("\n").filter((s) => s.trim())
      : [];

    addCandidate({
      nomor: paslonForm.nomor,
      ketua: ketua.nama,
      ketuaNis: ketua.nis,
      ketuaKelas: ketua.kelas,
      wakil: wakil.nama,
      wakilNis: wakil.nis,
      wakilKelas: wakil.kelas,
      slogan: paslonForm.slogan,
      foto: paslonForm.foto,
      visi: paslonForm.visi,
      misi: parsedMisi,
      programKerja: parsedProgr,
    });

    setPaslonForm({
      nomor: "",
      ketuaNis: "",
      wakilNis: "",
      slogan: "",
      foto: "",
      visi: "",
      misi: "",
      programKerja: "",
    });

    showBanner("🏆 Master Paslon baru berhasil ditambahkan!");
  }

  function handleReplacePaslonPhoto(cand, url) {
    updateCandidate(cand.id, { foto: url });
    showBanner(`📷 Foto Paslon ${cand.nomor} berhasil diganti.`);
  }

  function handleRemovePaslon(id) {
    removeCandidate(id);
    showBanner("🗑️ Paslon berhasil dihapus.", "warning");
  }

  // 6. Import DPT
  function handleSyncDpt(e) {
    e.preventDefault();
    const picked = sinar.students.filter((st) => !dptClass || st.kelas === dptClass);
    if (picked.length === 0) {
      showBanner("⚠️ Tidak ada siswa Sinar untuk kelas tersebut.", "warning");
      return;
    }
    importDptFromData(picked);
    showBanner(`📥 ${picked.length} siswa dari Sinar dijadikan DPT${dptClass ? ` (${dptClass})` : ""}.`);
  }

  function handleResetDptDefault() {
    if (window.confirm("Kosongkan seluruh Daftar Pemilih Tetap (DPT)?")) {
      saveStudentsList([]);
      showBanner("🔄 DPT berhasil dikosongkan.");
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
    <DashboardShell>
      {/* NAVBAR */}
      <Navbar />

      {/* NOTIFIKASI BANNER */}
      <Banner notification={notification} onClose={() => setNotification(null)} />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        {/* HEADER SUPERADMIN */}
        <DashboardHero
          theme="violet"
          emoji="🌟"
          badge="Superadmin · Pembina OSIS & tim IT"
          title="Pusat kendali sistem"
          description={`Sedang mengelola ${currentElection?.name || `pemilihan ${academicYear}`}: Ketua OSIS, akun panitia, bilik suara, pasangan calon, dan daftar pemilih.`}
          aside={
            <button
              type="button"
              onClick={handleSystemOverride}
              className="rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-rose-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-coral-soft hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
            >
              🚨 Reset data simulasi
            </button>
          }
        />

        {/* NAVIGATION TAB SUPERADMIN */}
        <div className="mb-8 mt-6 flex flex-wrap gap-2 rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-violet-100 backdrop-blur">
          {[
            { id: "overview", label: "📊 Ringkasan", active: "bg-violet-600 text-white shadow-violet-400/25" },
            { id: "auth", label: "🔑 Hak akses", active: "bg-coral text-ink shadow-rose-300/40" },
            { id: "ketua", label: "👑 Ketua OSIS", active: "bg-sun text-ink shadow-amber-300/40" },
            { id: "panitia", label: "👥 Panitia", active: "bg-mint text-ink shadow-emerald-300/40" },
            { id: "bilik", label: "🗳️ Bilik suara", active: "bg-violet-600 text-white shadow-violet-400/25" },
            { id: "paslon", label: "🏆 Paslon", active: "bg-coral text-ink shadow-rose-300/40" },
            { id: "dpt", label: "📥 DPT siswa", active: "bg-sun text-ink shadow-amber-300/40" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? `-translate-y-0.5 scale-105 shadow-lg ${tab.active}`
                  : "text-slate-600 hover:-translate-y-0.5 hover:bg-sky"
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon="📅" label="Tahun ajaran aktif" value={academicYear} color="violet" />
              <StatTile icon="🎓" label="Daftar pemilih (DPT)" value={students.length} unit="siswa" color="mint" delay={80} />
              <StatTile icon="🗳️" label="Bilik suara" value={booths.length} unit="bilik" color="sun" delay={160} />
              <StatTile icon="🏆" label="Pasangan calon" value={candidates.length} unit="paslon" color="coral" delay={240} />
            </div>

            {/* PEMILIHAN PER TAHUN AJARAN */}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              {/* Buka pemilihan baru */}
              <div className="relative overflow-hidden rounded-[1.75rem] bg-white/90 p-6 shadow-[0_12px_40px_-24px_rgba(31,42,72,0.25)] ring-1 ring-slate-200/60 sm:p-8">
                <span aria-hidden="true" className="absolute left-8 top-0 h-1.5 w-20 rounded-b-full bg-gradient-to-r from-violet-300 to-lilac" />
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-2xl ring-1 ring-violet-100">🗓️</span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">Buka pemilihan baru</h2>
                    <p className="text-xs text-slate-500">Satu pemilihan untuk setiap tahun ajaran — datanya terpisah.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-sky/70 p-4 text-xs leading-relaxed text-slate-600 ring-1 ring-violet-100">
                  Pemilihan baru dimulai <span className="font-bold text-ink">kosong</span>: paslon, DPT, antrean, dan suara
                  tidak dibawa. Pemilihan {academicYear} tetap tersimpan sebagai arsip dan bisa dibuka lagi kapan saja.
                </div>

                {sinar.error && (
                  <p className="mt-3 text-xs font-semibold text-rose-600">
                    ⚠️ {sinar.error}{" "}
                    <button type="button" onClick={() => sinar.refresh(true)} className="underline">
                      Coba lagi
                    </button>
                  </p>
                )}

                <form onSubmit={handleRequestNewElection} className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Tahun ajaran</label>
                    <SearchSelect
                      className="mt-1.5"
                      options={yearOptions}
                      value={electionForm.academicYear}
                      onChange={(year) =>
                        setElectionForm((f) => ({
                          ...f,
                          academicYear: year,
                          name: f.name && !f.name.startsWith("Pemilihan Ketua OSIS ") ? f.name : `Pemilihan Ketua OSIS ${year}`,
                        }))
                      }
                      loading={sinar.loading && yearOptions.length === 0}
                      placeholder="Pilih tahun ajaran dari Sinar"
                      searchPlaceholder="Cari tahun ajaran..."
                      emptyText="Tahun ajaran Sinar tidak ditemukan."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="election-name" className="text-xs font-bold text-slate-600">Nama pemilihan</label>
                    <input
                      id="election-name"
                      type="text"
                      value={electionForm.name}
                      onChange={(e) => setElectionForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Pemilihan Ketua OSIS 2027/2028"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { key: "copyBooths", label: "Salin bilik suara", hint: "Kode akses tetap, perangkat tidak perlu login ulang" },
                      { key: "copyCommittee", label: "Salin akun panitia", hint: "Registrator, caller, dan saksi" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-2xl p-3 ring-1 transition ${
                          electionForm[opt.key] ? "bg-violet-50 ring-violet-200" : "bg-white ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={electionForm[opt.key]}
                          onChange={(e) => setElectionForm((f) => ({ ...f, [opt.key]: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 accent-violet-600"
                        />
                        <span>
                          <span className="block text-xs font-bold text-ink">{opt.label}</span>
                          <span className="block text-[11px] text-slate-500">{opt.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {isConfirmingElection ? (
                    <div className="fx-pop-in rounded-2xl bg-sun-soft p-4 ring-1 ring-amber-200">
                      <p className="text-xs font-bold text-amber-900">
                        Buka &ldquo;{electionForm.name || `Pemilihan Ketua OSIS ${electionForm.academicYear}`}&rdquo; dan jadikan aktif?
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                        Semua dashboard, bilik, dan halaman publik akan langsung beralih ke pemilihan ini.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingElection(false)}
                          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmNewElection}
                          className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                        >
                          Ya, buka pemilihan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0"
                    >
                      ✨ Buka pemilihan baru
                    </button>
                  )}
                </form>
              </div>

              {/* Riwayat pemilihan */}
              <div className="relative overflow-hidden rounded-[1.75rem] bg-white/90 p-6 shadow-[0_12px_40px_-24px_rgba(31,42,72,0.25)] ring-1 ring-slate-200/60 sm:p-8">
                <span aria-hidden="true" className="absolute left-8 top-0 h-1.5 w-20 rounded-b-full bg-gradient-to-r from-mint to-violet-200" />
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-soft text-2xl ring-1 ring-emerald-100">📚</span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">Riwayat pemilihan</h2>
                    <p className="text-xs text-slate-500">Aktifkan pemilihan lama untuk melihat arsip hasilnya.</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {elections.map((election) => (
                    <li
                      key={election.id}
                      className={`rounded-2xl p-4 ring-1 transition ${
                        election.isCurrent ? "bg-violet-50/80 ring-violet-200" : "bg-white ring-slate-200/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{election.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Tahun ajaran {election.academicYear} · dibuka{" "}
                            {new Date(election.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        {election.isCurrent ? (
                          <span className="shrink-0 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white">Aktif</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchElection(election)}
                            className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50"
                          >
                            Aktifkan
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-600">
                        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">🗳️ {election.stats.votes} suara</span>
                        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">🎓 {election.stats.voters} DPT</span>
                        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">🏆 {election.stats.candidates} paslon</span>
                        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">🚪 {election.stats.booths} bilik</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* TAB AUTH: HAK AKSES & PASSWORD           */}
        {/* ======================================== */}
        {activeTab === "auth" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* SUPERADMIN CREDS FORM */}
            <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-md ring-2 ring-violet-200 transition-shadow duration-300 hover:shadow-xl">
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
            <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-md ring-2 ring-sun transition-shadow duration-300 hover:shadow-xl">
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
          <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-md ring-2 ring-sun transition-shadow duration-300 hover:shadow-xl max-w-3xl">
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
                  Siswa Ketua OSIS Penyelenggara (dari Sinar)
                </label>
                <SearchSelect
                  options={studentOptions}
                  value={ketuaForm.nis}
                  onChange={(nis) => {
                    const st = sinar.students.find((x) => x.nis === nis);
                    if (st) setKetuaForm({ ...ketuaForm, nama: st.nama, nis: st.nis, kelas: st.kelas });
                  }}
                  loading={sinar.loading && studentOptions.length === 0}
                  placeholder="Cari nama atau NIS siswa..."
                  searchPlaceholder="Ketik nama, NIS, atau kelas..."
                  emptyText="Siswa tidak ditemukan di Sinar."
                  required
                />
                {ketuaForm.nis && !studentOptions.some((o) => o.value === ketuaForm.nis) && !sinar.loading && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">
                    ⚠️ {ketuaForm.nama} ({ketuaForm.kelas}) tidak ada di daftar siswa aktif Sinar. Pilih ulang.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    value={ketuaForm.nis}
                    readOnly
                    placeholder="Terisi otomatis dari Sinar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={ketuaForm.kelas}
                    readOnly
                    placeholder="Terisi otomatis dari Sinar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status / Jabatan Resmi
                </label>
                <SearchSelect
                  options={jabatanOptions}
                  value={ketuaForm.jabatan}
                  onChange={(jabatan) => setKetuaForm({ ...ketuaForm, jabatan })}
                  placeholder="Pilih jabatan"
                  searchPlaceholder="Cari jabatan..."
                  required
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
            <div className="lg:col-span-1 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
              <h2 className="text-lg font-bold text-slate-900">
                Tambah Akun Panitia
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pilih petugas dari data Sinar, lalu buatkan akun untuk petugas TPS.
              </p>

              <form onSubmit={handleAddCommittee} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas (guru / siswa dari Sinar)
                  </label>
                  <SearchSelect
                    options={personOptions}
                    value={committeeForm.person}
                    onChange={(person) => setCommitteeForm({ ...committeeForm, person })}
                    loading={sinar.loading && personOptions.length === 0}
                    placeholder="Cari nama, NIS, atau kode guru..."
                    searchPlaceholder="Ketik nama, NIS, atau kode..."
                    emptyText="Tidak ditemukan di Sinar."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    value={committeeForm.person ? committeeForm.person.split(":")[1].toLowerCase() : ""}
                    readOnly
                    placeholder="Otomatis dari NIS / kode Sinar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Akun
                  </label>
                  <input
                    type="text"
                    value={committeeForm.password}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, password: e.target.value })}
                    placeholder="Password..."
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran Panitia
                  </label>
                  <SearchSelect
                    options={roleOptions}
                    value={committeeForm.role}
                    onChange={(role) => setCommitteeForm({ ...committeeForm, role })}
                    searchPlaceholder="Cari peran..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                >
                  + Tambah Panitia
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
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
                      {!item.password && (
                        <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
                          ⚠️ Belum punya password — hapus &amp; buat ulang agar bisa login.
                        </p>
                      )}
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
          <div className="rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  4. Manajemen Bilik Suara Dinamis
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah atau kurangi jumlah Bilik Suara secara real-time sesuai kebutuhan kapasitas TPS.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Perangkat bilik login di <code className="font-mono text-violet-700">/login</code> (tab Bilik suara) menggunakan kode akses masing-masing bilik.
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

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-100 bg-white px-3 py-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-400">Kode Akses</p>
                        <p className="font-mono text-base font-black tracking-widest text-slate-900">{booth.accessCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRegenerateBoothCode(booth.id)}
                        className="cursor-pointer text-[11px] font-bold text-violet-600 hover:underline"
                      >
                        Ganti Kode
                      </button>
                    </div>
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
            <div className="lg:col-span-1 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
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
                  <SearchSelect
                    options={paslonNumberOptions}
                    value={paslonForm.nomor}
                    onChange={(nomor) => setPaslonForm({ ...paslonForm, nomor })}
                    placeholder="Pilih nomor urut"
                    searchPlaceholder="Cari nomor..."
                    emptyText="Semua nomor urut sudah terpakai."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calon Ketua (siswa Sinar)
                  </label>
                  <SearchSelect
                    options={studentOptions.filter((o) => o.value !== paslonForm.wakilNis)}
                    value={paslonForm.ketuaNis}
                    onChange={(ketuaNis) => setPaslonForm({ ...paslonForm, ketuaNis })}
                    loading={sinar.loading && studentOptions.length === 0}
                    placeholder="Cari nama atau NIS..."
                    searchPlaceholder="Ketik nama, NIS, atau kelas..."
                    emptyText="Siswa tidak ditemukan di Sinar."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calon Wakil (siswa Sinar)
                  </label>
                  <SearchSelect
                    options={studentOptions.filter((o) => o.value !== paslonForm.ketuaNis)}
                    value={paslonForm.wakilNis}
                    onChange={(wakilNis) => setPaslonForm({ ...paslonForm, wakilNis })}
                    loading={sinar.loading && studentOptions.length === 0}
                    placeholder="Cari nama atau NIS..."
                    searchPlaceholder="Ketik nama, NIS, atau kelas..."
                    emptyText="Siswa tidak ditemukan di Sinar."
                    required
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
                    Foto Paslon
                  </label>
                  <PhotoUpload
                    value={paslonForm.foto}
                    onChange={(foto) => setPaslonForm((f) => ({ ...f, foto }))}
                    onUploadingChange={setIsPhotoUploading}
                    required
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
                  disabled={isPhotoUploading}
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm disabled:opacity-60"
                >
                  {isPhotoUploading ? "Menunggu foto selesai diunggah…" : "+ Tambah Paslon"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
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
                        <CandidatePhoto src={cand.foto} nomor={cand.nomor} ketua={cand.ketua} wakil={cand.wakil} />
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

                    <div className="flex shrink-0 items-center gap-3">
                      <PhotoReplaceButton
                        onUploaded={(url) => handleReplacePaslonPhoto(cand, url)}
                        onError={(message) => showBanner(`⚠️ ${message}`, "warning")}
                      />
                      <button
                        onClick={() => handleRemovePaslon(cand.id)}
                        className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Hapus Paslon
                      </button>
                    </div>
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
            <div className="lg:col-span-1 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
              <h2 className="text-lg font-bold text-slate-900">
                Sinkronisasi DPT dari Sinar
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                DPT hanya berisi siswa aktif dari Sinar. Pilih kelas, atau semua kelas, lalu sinkronkan.
              </p>

              <form onSubmit={handleSyncDpt} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <SearchSelect
                    options={classOptions}
                    value={dptClass}
                    onChange={setDptClass}
                    loading={sinar.loading && classOptions.length === 1}
                    searchPlaceholder="Cari kelas..."
                    emptyText="Kelas tidak ditemukan."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sinar.loading || sinar.students.length === 0}
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  📥 Jadikan DPT dari Sinar
                </button>
                <button
                  type="button"
                  onClick={() => sinar.refresh(true)}
                  disabled={sinar.loading}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {sinar.loading ? "Memuat dari Sinar..." : "🔄 Muat ulang data Sinar"}
                </button>
                {sinar.error && <p className="text-xs font-semibold text-rose-600">⚠️ {sinar.error}</p>}
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={handleResetDptDefault}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  🔄 Kosongkan DPT
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[1.75rem] bg-white p-6 shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl">
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
    </DashboardShell>
  );
}

export default function SuperadminPage() {
  return (
    <AuthGuard allowedRoles={["superadmin"]}>
      <SuperadminPageContent />
    </AuthGuard>
  );
}

