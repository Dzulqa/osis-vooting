/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import candidates from "@/data/candidates";
import students from "@/data/students";
import {
  getVotedStudents,
  getVoteSummary,
  subscribeVotingStorage,
  resetVotingSimulation,
} from "@/lib/votingStorage";

export default function ResultsPage() {
  const [selectedPaslonId, setSelectedPaslonId] = useState("all");
  const [searchLog, setSearchLog] = useState("");
  const [votedCount, setVotedCount] = useState(0);
  const [summaryData, setSummaryData] = useState({
    totalVotes: 0,
    candidateStats: [],
    leader: null,
  });

  function loadResultsData() {
    const summary = getVoteSummary(candidates);
    setSummaryData(summary);
    const voted = getVotedStudents();
    setVotedCount(voted.length);
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadResultsData();
    });
    return subscribeVotingStorage(loadResultsData);
  }, []);

  const totalStudents = students.length;
  const participationPercentage =
    totalStudents > 0
      ? ((votedCount / totalStudents) * 100).toFixed(1)
      : "0.0";

  // Filter candidate stats based on tab selection
  const displayedStats = useMemo(() => {
    if (selectedPaslonId === "all") {
      return summaryData.candidateStats;
    }
    return summaryData.candidateStats.filter(
      (item) => item.candidate.id === Number(selectedPaslonId)
    );
  }, [summaryData, selectedPaslonId]);

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16">
      {/* NAVBAR */}
      <nav className="w-full border-b border-violet-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <img
                  src="/logo/alamanah.png"
                  alt="Logo Sekolah"
                  className="h-11 w-11 object-contain"
                />
              </div>
              <div className="mt-2 flex h-12 w-12 items-center justify-center overflow-hidden">
                <img
                  src="/logo/osis.png"
                  alt="Logo OSIS"
                  className="h-20 w-20 max-w-none object-contain"
                />
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                E-Voting OSIS
              </h1>
              <p className="text-xs text-slate-500">SMK Al Amanah</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/registration"
              className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
            >
              Meja Pendaftaran
            </Link>
            <Link
              href="/caller"
              className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
            >
              Meja Pemanggil
            </Link>
            <Link
              href="/booth/1"
              className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
            >
              Bilik Suara
            </Link>
            <Link
              href="/results"
              className="rounded-xl bg-violet-100 px-4 py-2 font-bold text-violet-700"
            >
              Database Suara
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-10 lg:px-10">
        {/* HEADER SECTION */}
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Real-time Sync Database Active
            </span>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900">
              Database & Rekapitulasi <span className="text-violet-600">Per Paslon</span>
            </h1>
            <p className="mt-2 text-slate-500">
              Pantau perolehan suara dan log database transaksi voting secara langsung untuk setiap pasangan calon.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Apakah Anda yakin ingin mereset seluruh data simulasi voting?"
                )
              ) {
                resetVotingSimulation();
              }
            }}
            className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Reset Simulasi
          </button>
        </div>

        {/* METRICS / STATS CARDS */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Votes */}
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Total Suara Masuk
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                🗳️
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">
              {summaryData.totalVotes}{" "}
              <span className="text-sm font-normal text-slate-400">suara</span>
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Tercatat otomatis di database
            </p>
          </div>

          {/* Leader Paslon */}
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Paslon Unggul
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                👑
              </div>
            </div>
            <p className="mt-4 text-2xl font-extrabold text-slate-900 truncate">
              {summaryData.leader
                ? `Paslon ${summaryData.leader.nomor}`
                : "Belum Ada"}
            </p>
            <p className="mt-2 text-xs text-slate-400 truncate">
              {summaryData.leader
                ? `${summaryData.leader.ketua}`
                : "Menunggu suara masuk"}
            </p>
          </div>

          {/* Total Pemilih */}
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Pemilih Menggunakan Hak
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                👥
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">
              {votedCount}{" "}
              <span className="text-sm font-normal text-slate-400">
                / {totalStudents} siswa
              </span>
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Terverifikasi di sistem pendaftaran
            </p>
          </div>

          {/* Partisipasi */}
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Tingkat Partisipasi
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                📊
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">
              {participationPercentage}%
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.min(participationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* TAB FILTER PASLON */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaslonId("all")}
            className={`cursor-pointer rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
              selectedPaslonId === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white text-slate-600 hover:bg-violet-50"
            }`}
          >
            Semua Paslon ({candidates.length})
          </button>

          {candidates.map((cand) => {
            const isSelected = selectedPaslonId === String(cand.id);
            const candStat = summaryData.candidateStats.find(
              (s) => s.candidate.id === cand.id
            );
            return (
              <button
                key={cand.id}
                type="button"
                onClick={() => setSelectedPaslonId(String(cand.id))}
                className={`cursor-pointer rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                    : "bg-white text-slate-600 hover:bg-violet-50"
                }`}
              >
                Paslon {cand.nomor} — {cand.ketua.split(" ")[0]} (
                {candStat?.count ?? 0} Suara)
              </button>
            );
          })}
        </div>

        {/* SECTION DATABASE PER PASLON */}
        <div className="space-y-10">
          {displayedStats.map(({ candidate, count, percentage, votesLog }) => {
            const filteredLog = votesLog.filter(
              (v) =>
                v.id.toLowerCase().includes(searchLog.toLowerCase()) ||
                `bilik ${v.boothId}`.toLowerCase().includes(searchLog.toLowerCase())
            );

            return (
              <div
                key={candidate.id}
                className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm"
              >
                {/* CANDIDATE BANNER / HEADER */}
                <div className="border-b border-violet-50 bg-gradient-to-r from-violet-50/70 via-white to-violet-50/30 p-6 lg:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Candidate Identity */}
                    <div className="flex items-center gap-5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-violet-200 bg-violet-100 shadow-inner">
                        <img
                          src={candidate.foto}
                          alt={candidate.ketua}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-xs font-black text-white">
                          {candidate.nomor}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                            PASLON {candidate.nomor}
                          </span>
                          {summaryData.leader?.id === candidate.id && summaryData.totalVotes > 0 && (
                            <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                              🏆 Memimpin
                            </span>
                          )}
                        </div>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                          {candidate.ketua} & {candidate.wakil}
                        </h2>
                        <p className="mt-1 text-sm italic text-slate-500">
                          &quot;{candidate.slogan}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Right: Vote Statistics Badge */}
                    <div className="flex shrink-0 flex-col items-start gap-2 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm lg:items-end">
                      <span className="text-xs font-semibold text-slate-400">
                        Total Database Suara Paslon {candidate.nomor}
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-violet-700">
                          {count}
                        </span>
                        <span className="text-lg font-bold text-slate-500">
                          Suara ({percentage}%)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DATABASE TABLE FOR THIS PASLON */}
                <div className="p-6 lg:p-8">
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Database Log Suara (Paslon {candidate.nomor})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Rekam data setiap suara yang memilih Paslon {candidate.nomor}
                      </p>
                    </div>

                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Cari ID Suara / Bilik..."
                        value={searchLog}
                        onChange={(e) => setSearchLog(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {filteredLog.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <div className="text-3xl">📥</div>
                      <p className="mt-2 font-semibold text-slate-700">
                        Belum ada data suara di database Paslon {candidate.nomor}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Suara yang masuk di bilik akan tercatat di sini secara real-time.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase font-bold text-slate-500">
                          <tr>
                            <th className="px-4 py-3">No</th>
                            <th className="px-4 py-3">ID Suara (UUID)</th>
                            <th className="px-4 py-3">Waktu Masuk</th>
                            <th className="px-4 py-3">Asal Bilik</th>
                            <th className="px-4 py-3">Status Verifikasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLog.map((vote, idx) => (
                            <tr
                              key={vote.id}
                              className="transition hover:bg-violet-50/40"
                            >
                              <td className="px-4 py-3.5 font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs font-semibold text-violet-700">
                                {vote.id}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                {new Date(vote.createdAt).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                                  Bilik {String(vote.boothId).padStart(2, "0")}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Sah / Valid
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
