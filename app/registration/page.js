"use client";

import { useEffect, useMemo, useState } from "react";
import students from "@/data/students";

import {
  addToQueue,
  getQueue,
  getBooths,
  getVotedStudents,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function RegistrationPage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");

const [queue, setQueue] = useState([]);
const [booths, setBooths] = useState([]);
const [votedStudents, setVotedStudents] = useState([]);

  // =========================================
  // LOAD DATA DARI VOTING STORAGE
  // =========================================

function loadData() {
  setQueue(getQueue());
  setBooths(getBooths());
  setVotedStudents(getVotedStudents());
}

  useEffect(() => {
    loadData();

    return subscribeVotingStorage(loadData);
  }, []);

  // =========================================
  // AMBIL SEMUA KELAS
  // =========================================

  const classes = [
    ...new Set(
      students.map((student) => student.kelas)
    ),
  ];

  // =========================================
  // FILTER SISWA
  // =========================================

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];

    return students.filter((student) => {
      const sameClass =
        student.kelas === selectedClass;

      const keyword = search
        .trim()
        .toLowerCase();

      const matchSearch =
        student.nama
          .toLowerCase()
          .includes(keyword) ||
        student.nis
          .toLowerCase()
          .includes(keyword);

      return sameClass && matchSearch;
    });
  }, [selectedClass, search]);

  // =========================================
  // STATUS SISWA
  // =========================================

function isRegistered(studentId) {
  const inQueue = queue.some(
    (student) => student.id === studentId
  );

  const inBooth = booths.some(
    (booth) =>
      booth.student?.id === studentId
  );

  return inQueue || inBooth;
}

  function hasVoted(studentId) {
    return votedStudents.includes(studentId);
  }

  // =========================================
  // DAFTARKAN SISWA
  // =========================================

  function handleRegister(student) {
    const success = addToQueue(student);

    if (!success) return;

    loadData();
  }

  // =========================================
  // UI
  // =========================================

  return (
    <main className="min-h-screen bg-[#F8F7FF] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="font-semibold text-violet-600">
            E-Voting OSIS
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Meja Pendaftaran
          </h1>

          <p className="mt-2 text-slate-500">
            Pilih kelas dan daftarkan siswa ke
            dalam antrian pemilihan.
          </p>
        </div>

        <div className="grid gap-7 xl:grid-cols-[1.2fr_0.8fr]">

          {/* ================================= */}
          {/* DAFTAR SISWA */}
          {/* ================================= */}

          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Daftar Siswa
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pilih kelas terlebih dahulu untuk
                menampilkan siswa.
              </p>
            </div>

            {/* FILTER */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {/* PILIH KELAS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kelas
                </label>

                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(
                      e.target.value
                    );

                    setSearch("");
                  }}
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    bg-white px-4 py-3
                    text-slate-700
                    outline-none transition
                    focus:border-violet-500
                  "
                >
                  <option value="">
                    Pilih kelas
                  </option>

                  {classes.map((className) => (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              {/* SEARCH */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cari Siswa
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  disabled={!selectedClass}
                  placeholder="Cari nama atau NIS..."
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    px-4 py-3
                    outline-none transition
                    focus:border-violet-500
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                />
              </div>

            </div>

            {/* ================================= */}
            {/* LIST SISWA */}
            {/* ================================= */}

            <div className="mt-6 space-y-3">

              {!selectedClass ? (

                <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">

                  <p className="font-semibold text-slate-700">
                    Belum ada kelas dipilih
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Pilih kelas untuk melihat
                    daftar siswa.
                  </p>

                </div>

              ) : filteredStudents.length === 0 ? (

                <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">

                  <p className="font-semibold text-slate-700">
                    Siswa tidak ditemukan
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Coba gunakan nama atau NIS
                    yang berbeda.
                  </p>

                </div>

              ) : (

                filteredStudents.map((student) => {
                  const registered =
                    isRegistered(student.id);

                  const voted =
                    hasVoted(student.id);

                  return (
                    <div
                      key={student.id}
                      className="
                        flex items-center
                        justify-between gap-4
                        rounded-2xl
                        border border-slate-100
                        p-4 transition
                        hover:border-violet-200
                      "
                    >

                      {/* DATA SISWA */}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {student.nama}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          NIS {student.nis} •{" "}
                          {student.kelas}
                        </p>
                      </div>

                      {/* BUTTON */}
                      <button
                        onClick={() =>
                          handleRegister(student)
                        }
                        disabled={
                          registered || voted
                        }
                        className={`
                          shrink-0 rounded-xl
                          px-4 py-2
                          text-sm font-semibold
                          transition

                          ${
                            voted
                              ? `
                                cursor-not-allowed
                                bg-slate-100
                                text-slate-400
                              `
                              : registered
                                ? `
                                  cursor-not-allowed
                                  bg-emerald-50
                                  text-emerald-600
                                `
                                : `
                                  cursor-pointer
                                  bg-violet-600
                                  text-white
                                  hover:bg-violet-700
                                `
                          }
                        `}
                      >
                        {voted
                          ? "Sudah Memilih"
                          : registered
                            ? "✓ Terdaftar"
                            : "Daftarkan"}
                      </button>

                    </div>
                  );
                })

              )}

            </div>

          </section>

          {/* ================================= */}
          {/* ANTRIAN PEMILIH */}
          {/* ================================= */}

          <section className="h-fit rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">

            {/* HEADER ANTRIAN */}
            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Antrian Pemilih
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Siswa yang telah didaftarkan.
                </p>
              </div>

              <span className="
                shrink-0 rounded-full
                bg-violet-50
                px-4 py-2
                text-sm font-semibold
                text-violet-600
              ">
                {queue.length} siswa
              </span>

            </div>

            {/* LIST ANTRIAN */}
            <div className="mt-6 space-y-3">

              {queue.length === 0 ? (

                <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">

                  <p className="font-semibold text-slate-700">
                    Antrian masih kosong
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Daftarkan siswa untuk
                    memulai antrian.
                  </p>

                </div>

              ) : (

                queue.map((student, index) => (
                  <div
                    key={student.id}
                    className="
                      flex items-center gap-4
                      rounded-2xl
                      border border-slate-100
                      p-4
                    "
                  >

                    {/* NOMOR ANTRIAN */}
                    <div className="
                      flex h-11 w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-100
                      font-bold
                      text-violet-600
                    ">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    {/* DATA SISWA */}
                    <div className="min-w-0 flex-1">

                      <p className="truncate font-semibold text-slate-900">
                        {student.nama}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {student.kelas}
                      </p>

                    </div>

                    {/* STATUS */}
                    <span className="
                      shrink-0 rounded-full
                      bg-amber-50
                      px-3 py-1
                      text-xs font-semibold
                      text-amber-600
                    ">
                      Menunggu
                    </span>

                  </div>
                ))

              )}

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}