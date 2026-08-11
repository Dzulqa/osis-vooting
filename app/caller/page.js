"use client";

import { useEffect, useState } from "react";
import {
  getBooths,
  getQueue,
  assignStudentToBooth,
  activateBooth,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function CallerPage() {
  const [queue, setQueue] = useState([]);
  const [booths, setBooths] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBooth, setSelectedBooth] = useState(null);

  function loadData() {
    setQueue(getQueue());
    setBooths(getBooths());
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

  return (
    <main className="min-h-screen bg-[#F8F7FF] px-8 py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-bold text-violet-600">
            E-Voting OSIS
          </p>

          <h1 className="mt-1 text-4xl font-bold text-slate-900">
            Meja Pemanggil
          </h1>

          <p className="mt-2 text-slate-500">
            Panggil siswa dalam antrian dan arahkan ke bilik
            yang tersedia.
          </p>
        </div>

        {/* AREA UTAMA */}
        <div className="grid grid-cols-[1fr_380px] gap-6">

          {/* =========================
              ANTRIAN PEMILIH
          ========================== */}
          <section
            className="
              rounded-3xl border
              border-slate-200
              bg-white p-6 shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Antrian Pemilih
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih siswa yang akan dipanggil.
                </p>
              </div>

              <div
                className="
                  rounded-full bg-violet-50
                  px-4 py-2 text-sm
                  font-bold text-violet-600
                "
              >
                {queue.length} siswa
              </div>
            </div>

            {/* ANTRIAN KOSONG */}
            {queue.length === 0 ? (
              <div
                className="
                  mt-6 flex min-h-40
                  items-center justify-center
                  rounded-2xl bg-slate-50
                "
              >
                <p className="text-sm text-slate-400">
                  Tidak ada siswa dalam antrian.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">

                {queue.map((student) => {
                  const isSelected =
                    selectedStudent?.id === student.id;

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() =>
                        handleSelectStudent(student)
                      }
                      className={`
                        w-full cursor-pointer
                        rounded-2xl border
                        p-4 text-left
                        transition

                        ${
                          isSelected
                            ? `
                                border-violet-500
                                bg-violet-50
                              `
                            : `
                                border-slate-200
                                bg-white
                                hover:border-violet-200
                                hover:bg-violet-50/40
                              `
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">

                        <div>
                          <p className="font-bold text-slate-900">
                            {student.nama}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            NIS {student.nis}
                            {" • "}
                            {student.kelas}
                          </p>
                        </div>

                        {isSelected && (
                          <span
                            className="
                              rounded-full
                              bg-violet-600
                              px-3 py-1
                              text-xs font-bold
                              text-white
                            "
                          >
                            Dipilih
                          </span>
                        )}

                      </div>
                    </button>
                  );
                })}

              </div>
            )}
          </section>

          {/* =========================
              STATUS BILIK
          ========================== */}
          <section
            className="
              rounded-3xl border
              border-slate-200
              bg-white p-6 shadow-sm
            "
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Status Bilik
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pilih bilik kosong untuk pemilih.
              </p>
            </div>

            {/* DAFTAR BILIK */}
            <div className="mt-6 space-y-3">

              {booths.map((booth) => {
                const available =
                  booth.status === "waiting";

                const isSelected =
                  selectedBooth?.id === booth.id;

                return (
                  <div
                    key={booth.id}
                    onClick={() => {
                      if (available) {
                        handleSelectBooth(booth);
                      }
                    }}
                    className={`
                      w-full rounded-2xl
                      border p-4 text-left
                      transition

                      ${
                        available
                          ? "cursor-pointer"
                          : "cursor-default"
                      }

                      ${
                        isSelected
                          ? `
                              border-violet-500
                              bg-violet-50
                            `
                          : `
                              border-slate-200
                              bg-white
                            `
                      }

                      ${
                        available && !isSelected
                          ? `
                              hover:border-violet-200
                              hover:bg-violet-50/40
                            `
                          : ""
                      }
                    `}
                  >

                    {/* HEADER BILIK */}
                    <div className="flex items-center justify-between">

                      <p className="font-semibold text-slate-700">
                        Bilik{" "}
                        {String(booth.id).padStart(2, "0")}
                      </p>

                      <span
                        className={`
                          rounded-full
                          px-3 py-1
                          text-xs font-semibold

                          ${
                            booth.status === "waiting"
                              ? `
                                  bg-emerald-50
                                  text-emerald-600
                                `
                              : booth.status === "assigned"
                              ? `
                                  bg-amber-50
                                  text-amber-500
                                `
                              : `
                                  bg-violet-50
                                  text-violet-600
                                `
                          }
                        `}
                      >
                        {booth.status === "waiting"
                          ? "Tersedia"
                          : booth.status === "assigned"
                          ? "Menunggu"
                          : "Aktif"}
                      </span>

                    </div>

                    {/* SISWA DI BILIK */}
                    {!available && booth.student && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3">

                        <p className="text-xs text-slate-400">
                          Pemilih
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {booth.student.nama}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          NIS {booth.student.nis}
                          {" • "}
                          {booth.student.kelas}
                        </p>

                        {/* =========================
                            ASSIGNED
                        ========================== */}
                        {booth.status === "assigned" && (
                          <div
                            className="
                              mt-3 flex
                              items-center gap-2
                              rounded-lg
                              bg-amber-50
                              px-3 py-2
                            "
                          >
                            <span
                              className="
                                h-2 w-2
                                animate-pulse
                                rounded-full
                                bg-amber-500
                              "
                            />

                            <span
                              className="
                                text-xs font-semibold
                                text-amber-600
                              "
                            >
                              Menunggu Siswa Membuka Sesi
                            </span>
                          </div>
                        )}

                        {/* =========================
                            ACTIVE
                        ========================== */}
                        {booth.status === "active" && (
                          <div
                            className="
                              mt-3 flex
                              items-center gap-2
                              rounded-lg
                              bg-emerald-50
                              px-3 py-2
                            "
                          >
                            <span
                              className="
                                h-2 w-2
                                animate-pulse
                                rounded-full
                                bg-emerald-500
                              "
                            />

                            <span
                              className="
                                text-xs font-semibold
                                text-emerald-600
                              "
                            >
                              Sesi Sedang Aktif
                            </span>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

            </div>

            {/* =========================
                RINGKASAN PILIHAN
            ========================== */}
            <div className="mt-6 border-t border-slate-100 pt-6">

              {/* PEMILIH */}
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Pemilih
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedStudent
                    ? selectedStudent.nama
                    : "Belum ada siswa dipilih"}
                </p>

                {selectedStudent && (
                  <p className="mt-1 text-xs text-slate-400">
                    NIS {selectedStudent.nis}
                    {" • "}
                    {selectedStudent.kelas}
                  </p>
                )}
              </div>

              {/* TUJUAN */}
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-700">
                  Tujuan
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedBooth
                    ? `Bilik ${String(
                        selectedBooth.id
                      ).padStart(2, "0")}`
                    : "Belum ada bilik dipilih"}
                </p>
              </div>

              {/* ARAHKAN */}
              <button
                type="button"
                onClick={handleAssign}
                disabled={
                  !selectedStudent ||
                  !selectedBooth
                }
                className="
                  mt-6 w-full
                  rounded-xl
                  bg-violet-600
                  px-5 py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-violet-700

                  disabled:cursor-not-allowed
                  disabled:bg-slate-200
                  disabled:text-slate-400
                "
              >
                Arahkan ke Bilik
              </button>

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}