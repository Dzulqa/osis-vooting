"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";

import {
  addToQueue,
  removeFromQueue,
  getQueue,
  getBooths,
  getVotedStudents,
  getEventConfig,
  getStudentsList,
  saveStudentsList,
  getTeachersList,
  saveTeachersList,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function RegistrationPage() {
  const [activeTab, setActiveTab] = useState("siswa"); // "siswa" | "guru"
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");

  const [queue, setQueue] = useState([]);
  const [booths, setBooths] = useState([]);
  const [votedStudents, setVotedStudents] = useState([]);
  const [eventConfig, setEventConfig] = useState({ status: "open" });

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [apiClasses, setApiClasses] = useState([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // =========================================
  // LOAD DATA DARI STORAGE LOKAL
  // =========================================
  const loadLocalData = useCallback(() => {
    setQueue(getQueue());
    setBooths(getBooths());
    setVotedStudents(getVotedStudents());
    setEventConfig(getEventConfig());

    const localStudents = getStudentsList();
    if (localStudents && localStudents.length > 0) {
      setStudents(localStudents);
    }
    const localTeachers = getTeachersList();
    if (localTeachers && localTeachers.length > 0) {
      setTeachers(localTeachers);
    }
  }, []);

  // =========================================
  // FETCH DATA RESMI DARI API SEKOLAH (SINAR)
  // =========================================
  const fetchSchoolData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoadingApi(true);
      setSyncError(null);

      const url = `/api/school/voters${forceRefresh ? "?refresh=1" : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setStudents(data.students);
        saveStudentsList(data.students);

        setTeachers(data.teachers);
        saveTeachersList(data.teachers);

        setApiClasses(data.classes);
        setApiStats(data.stats);
      } else {
        setSyncError(data.message || "Gagal menyinkronkan data API");
      }
    } catch (err) {
      console.error("Gagal fetch data sekolah:", err);
      setSyncError("Gagal menghubungi server API sekolah");
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
    fetchSchoolData(false);

    return subscribeVotingStorage(loadLocalData);
  }, [loadLocalData, fetchSchoolData]);

  // =========================================
  // AMBIL DAFTAR KELAS (DARI API ATAU DATA SISWA)
  // =========================================
  const classes = useMemo(() => {
    if (apiClasses && apiClasses.length > 0) {
      return apiClasses;
    }
    return [...new Set(students.map((s) => s.kelas))].filter(Boolean).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [apiClasses, students]);

  // Hitung jumlah siswa per kelas untuk dropdown yang informatif
  const classCounts = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      if (s.kelas) {
        counts[s.kelas] = (counts[s.kelas] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  // =========================================
  // FILTER SISWA
  // =========================================
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];

    return students.filter((student) => {
      const sameClass = student.kelas === selectedClass;
      const keyword = search.trim().toLowerCase();
      if (!keyword) return sameClass;

      const matchName = (student.nama || "").toLowerCase().includes(keyword);
      const matchNis = (student.nis || "").toLowerCase().includes(keyword);

      return sameClass && (matchName || matchNis);
    });
  }, [students, selectedClass, search]);

  // =========================================
  // FILTER GURU
  // =========================================
  const filteredTeachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return teachers;

    return teachers.filter((teacher) => {
      const matchName = (teacher.nama || "").toLowerCase().includes(keyword);
      const matchCode = (teacher.nis || "").toLowerCase().includes(keyword);
      return matchName || matchCode;
    });
  }, [teachers, search]);

  // =========================================
  // STATUS PEMILIH (SISWA & GURU)
  // =========================================
  function isRegistered(voterId) {
    const inQueue = queue.some((voter) => voter.id === voterId);
    const inBooth = booths.some((booth) => booth.student?.id === voterId);
    return inQueue || inBooth;
  }

  function hasVoted(voterId) {
    return votedStudents.includes(voterId);
  }

  // =========================================
  // DAFTARKAN PEMILIH KE ANTREAN
  // =========================================
  function handleRegister(voter) {
    const success = addToQueue(voter);
    if (!success) return;
    loadLocalData();
  }

  // =========================================
  // BATALKAN DARI ANTREAN
  // =========================================
  function handleRemoveFromQueue(voterId) {
    removeFromQueue(voterId);
    loadLocalData();
  }

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-12">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
        {/* EVENT CLOSED WARNING */}
        {eventConfig.status === "closed" && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Event E-Voting Ditutup</p>
                <p className="mt-0.5 text-xs text-rose-700">
                  Operasional pendaftaran saat ini dinonaktifkan oleh Penyelenggara (Ketua OSIS Saat Ini).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">
                <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse"></span>
                E-Voting OSIS
              </span>

              {/* API STATUS BADGE */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Aktif ({students.length} Siswa • {teachers.length} Guru)
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Meja Pendaftaran
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Pilih pemilih (Siswa atau Dewan Guru) dan daftarkan ke dalam antrian pemilihan.
            </p>
          </div>

          {/* SINKRONISASI ULANG BUTTON */}
          <button
            onClick={() => fetchSchoolData(true)}
            disabled={isLoadingApi}
            title="Sinkronkan ulang data dari server sekolah"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-violet-300 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 text-violet-600 ${isLoadingApi ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoadingApi ? "Menyinkronkan..." : "Sinkronkan Data"}
          </button>
        </div>

        {syncError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            ⚠️ <strong>Perhatian:</strong> {syncError}. Menggunakan data tersimpan terakhir di browser.
          </div>
        )}

        <div className="grid gap-7 xl:grid-cols-[1.25fr_0.75fr]">
          {/* ================================= */}
          {/* KOLOM KIRI: DAFTAR PEMILIH */}
          {/* ================================= */}
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            {/* TAB SWITCHER: SISWA VS GURU */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => {
                    setActiveTab("siswa");
                    setSearch("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "siswa"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🎓</span>
                  <span>Siswa</span>
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeTab === "siswa"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {students.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("guru");
                    setSearch("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "guru"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>👨‍🏫</span>
                  <span>Guru</span>
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeTab === "guru"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {teachers.length}
                  </span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">
                  {activeTab === "siswa"
                    ? `${classes.length} Kelas Aktif`
                    : "Semua Dewan Guru Aktif"}
                </span>
              </div>
            </div>

            {/* FILTER KONTROL */}
            <div className="mt-6">
              {activeTab === "siswa" ? (
                /* FILTER SISWA: KELAS & SEARCH */
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pilih Kelas
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setSearch("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map((className) => (
                        <option key={className} value={className}>
                          {className} {classCounts[className] ? `(${classCounts[className]} siswa)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Cari Siswa
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      disabled={!selectedClass}
                      placeholder={
                        selectedClass
                          ? `Cari nama atau NIS di kelas ${selectedClass}...`
                          : "Pilih kelas terlebih dahulu..."
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>
              ) : (
                /* FILTER GURU: PENCARIAN GURU (TANPA KELAS) */
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cari Guru / Tenaga Pendidik
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ketik nama guru atau kode pengenal..."
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ================================= */}
            {/* LIST PEMILIH (SISWA ATAU GURU) */}
            {/* ================================= */}
            <div className="mt-6 space-y-3">
              {isLoadingApi && students.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
                  <p className="font-semibold text-slate-700">Menghubungkan ke API Sinar...</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Mengambil data siswa dan dewan guru SMK Al Amanah.
                  </p>
                </div>
              ) : activeTab === "siswa" ? (
                /* === TAMPILAN SISWA === */
                !selectedClass ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                      🏫
                    </div>
                    <p className="font-semibold text-slate-800">Belum Ada Kelas Dipilih</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      Silakan pilih salah satu kelas di menu dropdown di atas untuk memunculkan daftar siswa aktif.
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                    <p className="font-semibold text-slate-700">Siswa tidak ditemukan</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tidak ada siswa aktif yang cocok dengan pencarian di kelas {selectedClass}.
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const registered = isRegistered(student.id);
                    const voted = hasVoted(student.id);

                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-violet-200 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-bold text-violet-700 text-sm">
                            {student.nama.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 text-sm">
                              {student.nama}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              NIS {student.nis} •{" "}
                              <span className="font-medium text-slate-700">{student.kelas}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRegister(student)}
                          disabled={registered || voted || eventConfig.status === "closed"}
                          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            voted
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : registered
                              ? "cursor-not-allowed bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "cursor-pointer bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200 active:scale-95"
                          }`}
                        >
                          {voted ? "Sudah Memilih" : registered ? "✓ Terdaftar" : "Daftarkan"}
                        </button>
                      </div>
                    );
                  })
                )
              ) : (
                /* === TAMPILAN GURU === */
                filteredTeachers.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                    <p className="font-semibold text-slate-700">Guru tidak ditemukan</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Coba cari dengan nama atau kode pengenal guru yang berbeda.
                    </p>
                  </div>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const registered = isRegistered(teacher.id);
                    const voted = hasVoted(teacher.id);

                    return (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-amber-100/80 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-700 text-sm">
                            👨‍🏫
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 text-sm">
                              {teacher.nama}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                                {teacher.nis}
                              </span>{" "}
                              • <span className="font-medium text-amber-800">Dewan Guru</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRegister(teacher)}
                          disabled={registered || voted || eventConfig.status === "closed"}
                          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            voted
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : registered
                              ? "cursor-not-allowed bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "cursor-pointer bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-200 active:scale-95"
                          }`}
                        >
                          {voted ? "Sudah Memilih" : registered ? "✓ Terdaftar" : "Daftarkan"}
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </section>

          {/* ================================= */}
          {/* KOLOM KANAN: ANTRIAN PEMILIH */}
          {/* ================================= */}
          <section className="h-fit rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            {/* HEADER ANTRIAN */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Antrian Pemilih</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pemilih yang siap dipanggil ke bilik suara.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700 border border-violet-200">
                {queue.length} pemilih
              </span>
            </div>

            {/* LIST ANTRIAN */}
            <div className="mt-5 space-y-3">
              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center">
                  <div className="mx-auto mb-2 text-2xl">⏳</div>
                  <p className="font-semibold text-slate-700 text-sm">Antrian Masih Kosong</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pilih siswa atau guru di sebelah kiri lalu klik "Daftarkan" untuk memasukkan ke antrian.
                  </p>
                </div>
              ) : (
                queue.map((person, index) => {
                  const isTeacher = person.type === "guru" || person.kelas === "Guru";

                  return (
                    <div
                      key={person.id}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-violet-200"
                    >
                      {/* NOMOR URUT ANTRIAN */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 font-extrabold text-violet-700 text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      {/* DATA PEMILIH */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 text-sm">
                          {person.nama}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {isTeacher ? (
                            <span className="font-semibold text-amber-700">
                              👨‍🏫 Guru ({person.nis})
                            </span>
                          ) : (
                            <span>
                              {person.kelas} • NIS {person.nis}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* STATUS & BATAL BUTTON */}
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          Menunggu
                        </span>

                        <button
                          onClick={() => handleRemoveFromQueue(person.id)}
                          title="Keluarkan dari antrian"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-60 transition hover:bg-rose-50 hover:text-rose-600 hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}