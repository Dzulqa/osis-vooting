"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Confetti } from "@/components/Festive";
import { DashboardHero, DashboardShell, StatTile } from "@/components/Dashboard";
import VoteCountShow from "@/components/VoteCountShow";
import { LockedMetric, LockedNotice } from "@/components/LockedResults";
import {
  getAcademicYear,
  getAuthSession,
  getVotedStudents,
  getVoteSummary,
  getEventConfig,
  getCandidatesList,
  getStudentsList,
  toggleResultRevealed,
  markResultsCounted,
  subscribeVotingStorage,
} from "@/lib/votingStorage";
import CandidatePhoto from "@/components/CandidatePhoto";


export default function ResultsPage() {
  const [selectedPaslonId, setSelectedPaslonId] = useState("all");
  const [searchLog, setSearchLog] = useState("");
  const [isCounting, setIsCounting] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [role, setRole] = useState(null);
  const [votedCount, setVotedCount] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);
  const [eventConfig, setEventConfig] = useState({
    status: "open",
    isResultRevealed: false,
  });
  const [summaryData, setSummaryData] = useState({
    totalVotes: 0,
    candidateStats: [],
    leader: null,
  });

  function loadResultsData() {
    const config = getEventConfig();
    setEventConfig(config);
    setAcademicYear(getAcademicYear());
    setRole(getAuthSession()?.role ?? null);
    const activeCandidates = getCandidatesList();
    setCandidates(activeCandidates);
    const activeStudents = getStudentsList();
    setStudents(activeStudents);
    const summary = getVoteSummary(activeCandidates);
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

  const closeCounting = useCallback(() => setIsCounting(false), []);

  // Hanya penyelenggara yang boleh menghitung di layar & mengunci hasil
  const canControl = role === "ketua" || role === "superadmin";
  // Angka per paslon baru terbuka setelah "Hitung sekarang" selesai
  const isCounted = Boolean(eventConfig.resultsCountedAt);

  // Peringkat untuk kartu ringkas (urutan kartu tetap mengikuti nomor urut)
  const rankById = useMemo(() => {
    const sorted = [...summaryData.candidateStats].sort((a, b) => b.count - a.count);
    return Object.fromEntries(
      sorted.map((item) => [item.candidate.id, sorted.findIndex((s) => s.count === item.count) + 1])
    );
  }, [summaryData]);

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
    <DashboardShell>
      {/* NAVBAR */}
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        {!eventConfig.isResultRevealed ? (
          /* TAMPILAN SAAT TERKUNCI */
          <div className="fx-pop-in relative isolate mx-auto my-12 flex max-w-xl flex-col items-center overflow-hidden rounded-[2rem] bg-white px-6 py-14 text-center shadow-xl ring-1 ring-violet-100">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sun/30" />
              <div className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-coral/20" />
              <Confetti count={14} />
            </div>

            <span className="fx-float flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-sun-soft text-5xl shadow-inner" style={{ "--dur": "4s" }}>
              🔒
            </span>

            <h1 className="mt-6 font-display text-3xl font-bold text-violet-700 sm:text-4xl">
              Hasil belum dibuka
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Penghitungan suara belum dimulai. Hasil akan muncul di sini setelah Ketua OSIS membuka sesi penghitungan.
            </p>
          </div>
        ) : (
          <>
            {/* HEADER SECTION */}
            <div className="mb-8">
              <DashboardHero
                theme="mint"
                emoji="📊"
                badge={
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
                    Diperbarui langsung
                  </>
                }
                title="Rekapitulasi per paslon"
                description="Pantau perolehan suara dan log transaksi voting untuk setiap pasangan calon."
                aside={
                  canControl && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCounting(true)}
                      disabled={candidates.length === 0}
                      className="fx-shine rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-400/30 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-50"
                    >
                      🥁 Hitung sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleResultRevealed(false)}
                      className="rounded-2xl bg-white px-5 py-3 text-xs font-bold text-amber-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-sun-soft hover:shadow-xl active:translate-y-0"
                    >
                      🔒 Kunci kembali hasil
                    </button>
                  </div>
                  )
                }
              />
            </div>



            {/* METRICS / STATS CARDS */}
            <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon="🗳️" label="Total suara masuk" value={summaryData.totalVotes} unit="suara" note="Tercatat otomatis" color="violet" />
              <StatTile
                icon="👑"
                label="Paslon unggul"
                value={!isCounted ? "🔒 Terkunci" : summaryData.leader ? `Paslon ${summaryData.leader.nomor}` : "Belum ada"}
                note={!isCounted ? "Menunggu penghitungan" : summaryData.leader ? summaryData.leader.ketua : "Menunggu suara masuk"}
                color="sun"
                delay={80}
              />
              <StatTile icon="👥" label="Sudah memilih" value={votedCount} unit={`/ ${totalStudents} siswa`} note="Terverifikasi di pendaftaran" color="mint" delay={160} />
              <StatTile icon="📊" label="Tingkat partisipasi" value={`${participationPercentage}%`} note="Dari total daftar pemilih" color="coral" delay={240} />
            </div>

            {/* TAB FILTER PASLON */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPaslonId("all")}
                className={`cursor-pointer rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                  selectedPaslonId === "all"
                    ? "-translate-y-0.5 bg-violet-600 text-white shadow-lg shadow-violet-400/25"
                    : "bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:bg-violet-50"
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
                        ? "-translate-y-0.5 bg-violet-600 text-white shadow-lg shadow-violet-400/25"
                        : "bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:bg-violet-50"
                    }`}
                  >
                    Paslon {cand.nomor} — {cand.ketua.split(" ")[0]}
                    {isCounted && ` (${candStat?.count ?? 0} Suara)`}
                  </button>
                );
              })}
            </div>

            {!isCounted && candidates.length > 0 && (
              <LockedNotice
                className="mb-8"
                action={
                  canControl && (
                    <button
                      type="button"
                      onClick={() => setIsCounting(true)}
                      className="fx-shine shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-400/30 transition hover:-translate-y-0.5"
                    >
                      🥁 Hitung sekarang
                    </button>
                  )
                }
              />
            )}

            {/* SEMUA PASLON — kartu ringkas, hanya metrik */}
            {selectedPaslonId === "all" && (
              <>
                {candidates.length === 0 ? (
                  <div className="rounded-[1.75rem] border-[3px] border-dashed border-violet-200 bg-white/70 py-14 text-center">
                    <p className="text-4xl">🎈</p>
                    <p className="mt-3 font-display text-xl font-semibold text-violet-700">Belum ada pasangan calon</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {summaryData.candidateStats.map(({ candidate, count, percentage }, index) => {
                      const rank = rankById[candidate.id];
                      const isLeader = isCounted && summaryData.leader?.id === candidate.id;
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => setSelectedPaslonId(String(candidate.id))}
                          style={{ "--delay": `${index * 90}ms` }}
                          className={`fx-pop-in group relative overflow-hidden rounded-[1.75rem] bg-white/95 text-left shadow-[0_14px_40px_-24px_rgba(31,42,72,0.35)] ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-24px_rgba(74,95,189,0.45)] ${
                            isLeader ? "ring-2 ring-sun" : "ring-slate-200/70"
                          }`}
                        >
                          <div className="flex items-center gap-4 p-5">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-violet-50 ring-1 ring-violet-100">
                              <CandidatePhoto src={candidate.foto} nomor={candidate.nomor} ketua={candidate.ketua} wakil={candidate.wakil} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                                  Paslon {candidate.nomor}
                                </span>
                                {isLeader && (
                                  <span className="rounded-lg bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                                    👑 Unggul
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm font-bold text-ink">
                                {candidate.ketua.split(" ")[0]} &amp; {candidate.wakil.split(" ")[0]}
                              </p>
                            </div>
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                                isCounted && rank === 1 && count > 0 ? "bg-sun text-ink" : "bg-slate-100 text-slate-500"
                              }`}
                              title={isCounted ? "Peringkat" : "Belum dihitung"}
                            >
                              {isCounted ? `#${rank}` : "🔒"}
                            </span>
                          </div>

                          <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                            {!isCounted ? (
                              <LockedMetric />
                            ) : (
                            <>
                            <div className="flex items-end justify-between">
                              <p className="font-display text-4xl font-bold tabular-nums leading-none text-violet-700">
                                {count}
                                <span className="ml-1.5 text-sm font-semibold text-slate-400">suara</span>
                              </p>
                              <p className="text-xl font-bold tabular-nums text-slate-500">{percentage}%</p>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-[width] duration-700 ${
                                  isLeader ? "bg-gradient-to-r from-sun to-coral" : "bg-gradient-to-r from-violet-300 to-violet-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="mt-3 text-[11px] font-semibold text-slate-400 transition group-hover:text-violet-600">
                              Lihat log suara →
                            </p>
                            </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* DETAIL PER PASLON */}
            <div className="space-y-10">
              {selectedPaslonId !== "all" && displayedStats.map(({ candidate, count, percentage, votesLog }) => {
                const filteredLog = votesLog.filter(
                  (v) =>
                    v.id.toLowerCase().includes(searchLog.toLowerCase()) ||
                    `bilik ${v.boothId}`.toLowerCase().includes(searchLog.toLowerCase())
                );

                return (
                  <div
                    key={candidate.id}
                    className="overflow-hidden rounded-[1.75rem] bg-white shadow-md ring-1 ring-violet-100 transition-shadow duration-300 hover:shadow-xl"
                  >
                    {/* CANDIDATE BANNER / HEADER */}
                    <div className="border-b border-violet-50 bg-gradient-to-r from-violet-50/70 via-white to-violet-50/30 p-6 lg:p-8">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: Candidate Identity */}
                        <div className="flex items-center gap-5">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-violet-200 bg-violet-100 shadow-inner">
                            <CandidatePhoto src={candidate.foto} nomor={candidate.nomor} ketua={candidate.ketua} wakil={candidate.wakil} />
                            <span className="absolute bottom-1 right-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-xs font-black text-white">
                              {candidate.nomor}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                                PASLON {candidate.nomor}
                              </span>
                              {isCounted && summaryData.leader?.id === candidate.id && summaryData.totalVotes > 0 && (
                                <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                  🏆 Memimpin
                                </span>
                              )}
                            </div>

                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                              {candidate.ketua} &amp; {candidate.wakil}
                            </h2>
                            <p className="mt-1 text-sm italic text-slate-500">
                              &quot;{candidate.slogan}&quot;
                            </p>
                          </div>
                        </div>

                        {/* Right: Vote Statistics Badge */}
                        {!isCounted ? (
                          <div className="w-full shrink-0 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm lg:w-64">
                            <LockedMetric />
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>

                    {/* DATABASE TABLE FOR THIS PASLON */}
                    {!isCounted ? (
                      <div className="p-6 lg:p-8">
                        <LockedNotice compact />
                      </div>
                    ) : (
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
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {isCounting && canControl && eventConfig.isResultRevealed && (
        <VoteCountShow
          candidateStats={summaryData.candidateStats}
          academicYear={academicYear}
          onClose={closeCounting}
          onRevealed={markResultsCounted}
        />
      )}
    </DashboardShell>
  );
}
