/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import CandidateCard from "@/components/CandidateCard";
import CandidateDetail from "@/components/CandidateDetail";
import VoteModal from "@/components/VoteModal";
import VoteSuccess from "@/components/VoteSuccess";

import {
  getBooths,
  resetBooth,
  saveVote,
  activateBooth,
  getEventConfig,
  getCandidatesList,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

export default function VotingBooth({ boothId }) {
  const [currentBooth, setCurrentBooth] = useState(null);
  const [eventConfig, setEventConfig] = useState({ status: "open" });
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteCandidate, setVoteCandidate] = useState(null);
  const [voteStatus, setVoteStatus] = useState("idle");
  const [isClosing, setIsClosing] = useState(false);

  // ========================================
  // LOAD BILIK
  // ========================================

  function loadBooth() {
    const booths = getBooths();
    setEventConfig(getEventConfig());
    setCandidates(getCandidatesList());

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
  // BUKA SESI
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
  // BILIK BADGE
  // ========================================

  function BilikBadge() {
    return (
      <div className="absolute right-6 top-5 z-10">
        <div className="flex items-center gap-2 rounded-xl border border-violet-200/80 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />

          <span className="text-xs font-bold text-green-600">
            Bilik {String(boothId).padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }

  // ========================================
  // BRAND PILL
  // ========================================

  function BrandPill() {
    return (
      <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-violet-100/80 bg-white/80 px-4 py-2 shadow-sm">
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

        {/* TEXT */}
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
  // EVENT DITUTUP
  // ========================================

  if (eventConfig.status === "closed") {
    return (
      <main className="relative flex h-[calc(100vh-45px)] flex-col overflow-hidden bg-[#F6F9FF]">
        <BilikBadge />

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg">
            <BrandPill />

            <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-4xl shadow-inner">
              🔒
            </div>

            <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
              Event E-Voting Ditutup
            </h1>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Penyelenggara (Ketua OSIS Saat Ini) sedang menutup sesi operasional e-voting. Bilik suara belum dapat digunakan saat ini.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />

              <span className="text-xs font-bold text-rose-700">
                Sesi Ditutup oleh Penyelenggara
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }


  // ========================================
  // WAITING
  // ========================================

  if (currentBooth.status === "waiting") {
    return (
      <main className="relative flex h-[calc(100vh-45px)] flex-col overflow-hidden bg-[#F6F9FF]">
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
  // ASSIGNED
  // ========================================

  if (currentBooth.status === "assigned") {
    return (
      <main className="relative flex h-[calc(100vh-45px)] flex-col overflow-hidden bg-[#F6F9FF]">
        <BilikBadge />

        <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="flex w-full max-w-lg flex-col items-center rounded-3xl border border-violet-100 bg-white p-6 sm:p-7 text-center shadow-xl">
            <BrandPill />

            <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl shadow-inner">
              👋
            </div>

            <h1 className="mt-4 text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">
              Selamat Datang di Pemilihan
            </h1>

            <p className="mt-0.5 text-base font-bold text-violet-600 sm:text-lg">
              Calon Ketua & Wakil Ketua OSIS
            </p>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
              Pastikan identitas di bawah ini sesuai dengan data Anda sebelum
              menekan tombol buka sesi.
            </p>

            <div className="mt-5 w-full rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                Identitas Pemilih
              </p>

              <h2 className="mt-0.5 text-xl font-bold text-slate-900">
                {currentBooth.student?.nama}
              </h2>

              <p className="mt-0.5 text-xs font-medium text-slate-600 sm:text-sm">
                NIS {currentBooth.student?.nis}
                {" • "}
                {currentBooth.student?.kelas}
              </p>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />

              <span className="text-xs font-bold text-amber-700">
                Sesi Belum Dimulai
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenSession}
              className="mt-5 w-full cursor-pointer rounded-2xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98] sm:text-base"
            >
              Mulai Memilih
            </button>

            <p className="mt-2 text-[11px] text-slate-400">
              Tekan tombol di atas untuk membuka kartu paslon dan memilih.
            </p>
          </div>
        </div>
      </main>
    );
  }


  // ========================================
  // ACTIVE
  // ========================================

  return (
    <main className="relative flex h-[calc(100vh-45px)] flex-col overflow-hidden bg-[#F6F9FF]">
      <BilikBadge />

      {/* HEADER */}
      <section className="flex shrink-0 flex-col items-center px-6 pt-5 pb-1 text-center">
        <BrandPill />

        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Pilih Pasangan{" "}
          <span className="text-violet-600">
            Terbaikmu
          </span>
        </h1>

        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
          Pemilihan Ketua & Wakil Ketua OSIS SMK Al Amanah
        </p>
      </section>

      {/* AREA CARD */}
      <section className="relative mx-auto flex min-h-0 w-full max-w-[1040px] flex-1 items-center justify-center overflow-hidden px-4 pb-2 pt-0">
        {candidates.map((candidate, index) => {
          const isSelected =
            selectedCandidate?.id === candidate.id;

          const hasSelected =
            selectedCandidate !== null;

          let leftPosition = `${index * 33 + 2}%`;
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
                absolute top-0 bottom-0 my-auto
                h-[445px] sm:h-[465px] lg:h-[485px]
                w-[30%] max-w-[305px]
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

        {/* DETAIL */}
        {selectedCandidate && (
          <div className="absolute top-0 bottom-0 my-auto left-[33%] h-[445px] sm:h-[465px] lg:h-[485px] w-[67%] pl-3">
            <div
              className={`h-full w-full ${
                isClosing
                  ? "candidate-detail-exit"
                  : "candidate-detail-enter"
              }`}
            >
              <CandidateDetail
                candidate={selectedCandidate}
                onClose={closeDetail}
              />
            </div>
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

      {/* SUCCESS */}
      {voteStatus === "success" && <VoteSuccess />}
    </main>
  );

}