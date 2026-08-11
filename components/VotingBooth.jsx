/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import CandidateCard from "@/components/CandidateCard";
import CandidateDetail from "@/components/CandidateDetail";
import VoteModal from "@/components/VoteModal";
import VoteSuccess from "@/components/VoteSuccess";

import candidates from "@/data/candidates";

import {
  getBooths,
  resetBooth,
  saveVote,
  activateBooth,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function VotingBooth({ boothId }) {
  const [currentBooth, setCurrentBooth] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteCandidate, setVoteCandidate] = useState(null);
  const [voteStatus, setVoteStatus] = useState("idle");
  const [isClosing, setIsClosing] = useState(false);

  // ========================================
  // LOAD BILIK
  // ========================================

  function loadBooth() {
    const booths = getBooths();
    const booth = booths.find(
      (item) => item.id === Number(boothId)
    );
    setCurrentBooth(booth || null);
  }

  useEffect(() => {
    loadBooth();
    const unsubscribe = subscribeVotingStorage(loadBooth);
    return unsubscribe;
  }, [boothId]);

  // ========================================
  // DETAIL PASLON
  // ========================================

  function openDetail(candidate) {
    setIsClosing(false);
    setSelectedCandidate(candidate);
  }

  function closeDetail() {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedCandidate(null);
      setIsClosing(false);
    }, 600);
  }

  // ========================================
  // BUKA SESI (DILAKUKAN SISWA)
  // ========================================

  function handleOpenSession() {
    if (!currentBooth?.student) return;
    activateBooth(boothId);
  }

  // ========================================
  // VOTE
  // ========================================

  function handleVote() {
    if (!voteCandidate || !currentBooth?.student) return;

    setVoteStatus("submitting");

    setTimeout(() => {
      const success = saveVote({
        candidateId: voteCandidate.id,
        boothId: boothId,
        studentId: currentBooth.student.id,
      });

      if (!success) {
        setVoteStatus("idle");
        return;
      }

      setVoteStatus("success");

      setTimeout(() => {
        resetBooth(boothId);
        setVoteCandidate(null);
        setSelectedCandidate(null);
        setVoteStatus("idle");
        setIsClosing(false);
      }, 3000);
    }, 1500);
  }

  // ========================================
  // LOADING
  // ========================================

  if (!currentBooth) {
    return null;
  }

  // ========================================
  // HEADER HALAMAN SISWA
  // ========================================

  // ========================================
  // BRAND & BILIK BADGE COMPONENTS
  // ========================================

  function BilikBadge() {
    return (
      <div className="absolute top-5 right-6 z-10">
        <div className="flex items-center gap-2 rounded-xl border border-violet-200/80 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
          <span className="text-xs font-bold text-violet-700">
            Bilik {String(boothId).padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }

  function BrandPill() {
    return (
      <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-2 border border-violet-100/80 shadow-xs mb-3">
        {/* LOGO SEKOLAH */}
        <div className="flex h-8 w-8 items-center justify-center">
          <img
            src="/logo/alamanah.png"
            alt="Logo Al Amanah"
            className="h-full w-full object-contain"
          />
        </div>

        {/* LOGO OSIS */}
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
          <img
            src="/logo/osis.png"
            alt="Logo OSIS"
            className="h-[46px] w-[46px] max-w-none object-contain"
          />
        </div>

        {/* PEMISAH */}
        <div className="h-5 w-px bg-slate-200" />

        {/* TEXT APLIKASI */}
        <div className="text-left">
          <h2 className="text-xs font-bold leading-none text-slate-800">
            E-Voting OSIS
          </h2>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            SMK Al Amanah
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // BILIK WAITING (MENUNGGU PEMILIH)
  // ========================================

  if (currentBooth.status === "waiting") {
    return (
      <main className="relative flex h-screen flex-col overflow-hidden bg-[#F8F7FF]">
        <BilikBadge />

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-lg">
            <BrandPill />

            <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl shadow-inner">
              🗳️
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
              Bilik {String(boothId).padStart(2, "0")} Siap
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Menunggu pemilih berikutnya dari Meja Pemanggil.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-500" />
              <span className="text-xs font-bold text-violet-700">
                Menunggu Pemilih
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ========================================
  // ASSIGNED (SAMBUTAN SISWA & BUKA SESI)
  // ========================================

  if (currentBooth.status === "assigned") {
    return (
      <main className="relative flex h-screen flex-col overflow-hidden bg-[#F8F7FF]">
        <BilikBadge />

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-xl flex-col items-center rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-xl">
            <BrandPill />

            {/* ICON */}
            <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl shadow-inner">
              👋
            </div>

            {/* JUDUL */}
            <h1 className="mt-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
              Selamat Datang di Pemilihan
            </h1>

            <p className="mt-1 text-lg font-bold text-violet-600">
              Calon Ketua & Wakil Ketua OSIS
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
              Pastikan identitas di bawah ini sesuai dengan data Anda sebelum menekan tombol buka sesi.
            </p>

            {/* DATA SISWA */}
            <div className="mt-6 w-full max-w-md rounded-2xl border border-violet-100 bg-violet-50/50 p-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-500">
                Identitas Pemilih
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {currentBooth.student?.nama}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-600">
                NIS {currentBooth.student?.nis}
                {" • "}
                {currentBooth.student?.kelas}
              </p>
            </div>

            {/* STATUS BADGE */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-700">
                Sesi Belum Dimulai
              </span>
            </div>

            {/* BUTTON BUKA SESI */}
            <button
              type="button"
              onClick={handleOpenSession}
              className="mt-6 w-full cursor-pointer rounded-2xl bg-violet-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98]"
            >
              Mulai Memilih
            </button>

            <p className="mt-2.5 text-xs text-slate-400">
              Tekan tombol di atas untuk membuka kartu paslon dan memilih.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ========================================
  // ACTIVE (HALAMAN PEMILIHAN PASLON)
  // ========================================

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#F8F7FF]">
      {/* BADGE BILIK POJOK KANAN ATAS */}
      <BilikBadge />

      {/* KONTEN HEADER (LOGOS, APPS NAME, JUDUL) */}
      <section className="flex shrink-0 flex-col items-center px-6 pt-6 pb-2 text-center">
        <BrandPill />

        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Pilih Pasangan <span className="text-violet-600">Terbaikmu</span>
        </h1>

        <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
          Pemilihan Ketua & Wakil Ketua OSIS SMK Al Amanah
        </p>
      </section>

      {/* AREA UTAMA DENGAN SLIDING ANIMASI PASLON */}
      <section className="relative mx-auto flex min-h-0 w-full max-w-[980px] flex-1 items-center justify-center overflow-hidden px-4 pb-6 pt-3">
        {candidates.map((candidate, index) => {
          const isSelected = selectedCandidate?.id === candidate.id;
          const hasSelected = selectedCandidate !== null;

          let leftPosition = `${index * 35.5}%`;
          let opacity = "opacity-100";
          let scale = "scale-100";
          let pointerEvents = "";

          if (hasSelected && !isClosing) {
            if (isSelected) {
              leftPosition = "0%";
            } else {
              opacity = "opacity-0";
              scale = "scale-95";
              pointerEvents = "pointer-events-none";
            }
          }

          return (
            <div
              key={candidate.id}
              className={`
                absolute top-0 bottom-0 my-auto h-full max-h-[440px] sm:max-h-[460px] lg:max-h-[475px] w-[29%] max-w-[300px]
                transition-all duration-[600ms] ease-in-out
                ${opacity}
                ${scale}
                ${pointerEvents}
              `}
              style={{
                left: leftPosition,
              }}
            >
              <CandidateCard
                nomor={candidate.nomor}
                ketua={candidate.ketua}
                wakil={candidate.wakil}
                slogan={candidate.slogan}
                foto={candidate.foto}
                visi={candidate.visi}
                misi={candidate.misi}
                programKerja={candidate.programKerja}
                onDetail={() => openDetail(candidate)}
                onVote={() => setVoteCandidate(candidate)}
              />
            </div>
          );
        })}

        {/* PANEL DETAIL SLIDING */}
        {selectedCandidate && (
          <div
            className={`
              absolute left-[32.5%] top-0 bottom-0 my-auto h-full max-h-[440px] sm:max-h-[460px] lg:max-h-[475px] w-[67.5%] pl-2
              ${isClosing
                ? "candidate-detail-exit"
                : "candidate-detail-enter"
              }
            `}
          >
            <CandidateDetail
              candidate={selectedCandidate}
              onClose={closeDetail}
            />
          </div>
        )}
      </section>

      {/* MODAL VOTE */}
      {voteCandidate && voteStatus !== "success" && (
        <VoteModal
          candidate={voteCandidate}
          onClose={() => {
            if (voteStatus !== "submitting") {
              setVoteCandidate(null);
            }
          }}
          onConfirm={handleVote}
          isSubmitting={voteStatus === "submitting"}
        />
      )}

      {/* VOTE SUCCESS ANIMATION */}
      {voteStatus === "success" && <VoteSuccess />}
    </main>
  );
}