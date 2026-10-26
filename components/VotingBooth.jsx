/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import CandidateCard from "@/components/CandidateCard";
import CandidateDetail from "@/components/CandidateDetail";
import VoteModal from "@/components/VoteModal";
import VoteSuccess from "@/components/VoteSuccess";
import { BallotBox, Balloons, Bunting, FestiveBackdrop } from "@/components/Festive";

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

    setTimeout(async () => {
      const success = await saveVote({
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

  const boothLabel = String(boothId).padStart(2, "0");

  // ========================================
  // EVENT DITUTUP
  // ========================================

  if (eventConfig.status === "closed") {
    return (
      <BoothStage boothLabel={boothLabel} confetti={0}>
        <div className="fx-pop-in relative w-full max-w-md rounded-[2.25rem] bg-white/90 p-8 text-center shadow-[0_30px_70px_-35px_rgba(31,42,72,0.45)] ring-1 ring-rose-100 backdrop-blur-xl">
          <BrandPill />

          <div className="relative mx-auto mt-2 flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-[2rem] bg-coral-soft ring-1 ring-rose-100" />
            <span className="fx-sway relative text-5xl">🔒</span>
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold text-ink">Bilik sedang istirahat</h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Penyelenggara (Ketua OSIS) sedang menutup sesi e-voting. Bilik suara belum bisa dipakai — tunggu sebentar ya!
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral-soft px-4 py-2 ring-1 ring-rose-100">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />
            <span className="text-xs font-bold text-rose-700">Sesi ditutup penyelenggara</span>
          </div>
        </div>
      </BoothStage>
    );
  }

  // ========================================
  // WAITING
  // ========================================

  if (currentBooth.status === "waiting") {
    return (
      <BoothStage boothLabel={boothLabel} confetti={14} balloons>
        <div className="grid w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Ilustrasi */}
          <div className="fx-pop-in relative mx-auto hidden w-full max-w-xs lg:block" style={{ "--delay": "120ms" }}>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-sun/60 via-coral/40 to-mint/50 blur-2xl" />
            <div className="absolute inset-0 m-auto h-[86%] w-[86%] animate-[spin_40s_linear_infinite] rounded-full border-[3px] border-dashed border-violet-300/70" />
            <BallotBox className="relative w-full drop-shadow-xl" />
          </div>

          <div className="fx-pop-in relative rounded-[2.25rem] bg-white/90 p-8 text-center shadow-[0_30px_70px_-35px_rgba(31,42,72,0.45)] ring-1 ring-violet-100 backdrop-blur-xl sm:p-10 lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <BrandPill />
            </div>

            <p className="font-display text-lg font-semibold text-violet-500">Halo! 👋</p>
            <h1 className="mt-1 font-display text-5xl font-bold leading-none text-violet-800 sm:text-6xl" aria-label={`Bilik ${boothLabel} siap`}>
              {`Bilik ${boothLabel}`.split("").map((char, i) => (
                <span key={i} aria-hidden="true" className="fx-bounce-letter" style={{ "--delay": `${i * 0.09}s` }}>
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
              <span aria-hidden="true" className="ml-2 inline-block rounded-2xl bg-sun px-3 py-1 align-middle text-2xl text-ink shadow-md shadow-amber-200/60 -rotate-6 fx-wiggle sm:text-3xl">
                siap!
              </span>
            </h1>

            <p className="mt-5 text-base text-slate-500">
              Bilik ini menunggu pemilih berikutnya dari <span className="font-bold text-ink">Meja Pemanggil</span>.
            </p>

            <div className="mt-7 inline-flex items-center gap-3 rounded-full bg-violet-50 px-5 py-2.5 ring-1 ring-violet-100">
              <span className="relative flex h-3 w-3">
                <span className="fx-ring absolute inset-0 rounded-full bg-violet-400" />
                <span className="relative h-3 w-3 rounded-full bg-violet-500" />
              </span>
              <span className="text-sm font-bold text-violet-700">
                Menunggu pemilih
                <span className="ml-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="fx-dot" style={{ "--delay": `${i * 0.15}s` }}>.</span>
                  ))}
                </span>
              </span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2.5 text-center">
              {[
                { icon: "🤫", text: "Pilihanmu rahasia", tone: "bg-violet-50 ring-violet-100" },
                { icon: "☝️", text: "Satu siswa, satu suara", tone: "bg-sun-soft ring-amber-100" },
                { icon: "💙", text: "Pilih dengan hati", tone: "bg-mint-soft ring-emerald-100" },
              ].map((tip, i) => (
                <div
                  key={tip.text}
                  className={`fx-rise rounded-2xl px-2 py-3 ring-1 ${tip.tone}`}
                  style={{ "--delay": `${400 + i * 120}ms` }}
                >
                  <span className="fx-float inline-block text-2xl" style={{ "--dur": `${4 + i}s`, "--delay": `${i * -0.7}s` }}>
                    {tip.icon}
                  </span>
                  <p className="mt-1 text-[11px] font-bold leading-tight text-slate-600 sm:text-xs">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BoothStage>
    );
  }

  // ========================================
  // ASSIGNED
  // ========================================

  if (currentBooth.status === "assigned") {
    const firstName = currentBooth.student?.nama?.split(" ")[0] || "";

    return (
      <BoothStage boothLabel={boothLabel} confetti={22} balloons>
        <div className="fx-pop-in relative w-full max-w-lg rounded-[2.25rem] bg-white/90 p-6 text-center shadow-[0_30px_70px_-35px_rgba(31,42,72,0.45)] ring-1 ring-violet-100 backdrop-blur-xl sm:p-8">
          {/* Stiker sudut */}
          <span aria-hidden="true" className="fx-wiggle absolute -left-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sun text-2xl shadow-lg shadow-amber-200/60">
            ⭐
          </span>
          <span
            aria-hidden="true"
            className="fx-wiggle absolute -right-3 top-16 flex h-11 w-11 items-center justify-center rounded-full bg-coral text-xl shadow-lg shadow-rose-200/60"
            style={{ "--delay": "-1.2s" }}
          >
            🎈
          </span>

          <BrandPill />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="fx-ring absolute inset-2 rounded-full bg-violet-200" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-violet-50 text-5xl ring-1 ring-violet-100">
              <span className="fx-hand-wave">👋</span>
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Hai, <span className="text-violet-700">{firstName}</span>!
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 sm:text-base">
            Selamat datang di pemilihan Ketua &amp; Wakil Ketua OSIS 🎉
          </p>

          {/* Kartu identitas ala tiket */}
          <div className="relative mt-6 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#e4e9ff] via-[#efeaff] to-[#fde9f1] p-5 text-left ring-1 ring-violet-100">
            <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
            <span aria-hidden="true" className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
            <span aria-hidden="true" className="absolute -right-6 -top-8 h-28 w-28 rounded-full border-[12px] border-white/50" />

            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 -rotate-3 items-center justify-center rounded-2xl bg-white font-display text-2xl font-bold text-violet-700 shadow-sm">
                {firstName.charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Kartu pemilih</p>
                <h2 className="truncate font-display text-xl font-bold text-ink">{currentBooth.student?.nama}</h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm">
                  NIS {currentBooth.student?.nis} · {currentBooth.student?.kelas}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t-2 border-dashed border-white/80 pt-3 text-xs font-semibold text-slate-600">
              Bukan kamu? Lapor ke petugas sebelum menekan tombol di bawah.
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenSession}
            className="fx-shine fx-nudge mt-6 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-violet-500 via-violet-600 to-violet-500 px-5 py-4 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(90,114,216,0.7)] transition hover:brightness-105 active:scale-[0.97] sm:text-xl"
          >
            Mulai memilih 🚀
          </button>

          <p className="mt-3 text-xs text-slate-400">Kartu pasangan calon akan muncul setelah tombol ditekan.</p>
        </div>
      </BoothStage>
    );
  }

  // ========================================
  // ACTIVE
  // ========================================

  return (
    <main className="relative isolate flex h-dvh flex-col overflow-hidden font-body text-ink">
      <FestiveBackdrop confetti={10} />
      <BilikBadge boothLabel={boothLabel} />

      {/* HEADER */}
      <section className="relative flex shrink-0 flex-col items-center px-6 pb-1 pt-5 text-center">
        <BrandPill />

        <h1 className="fx-rise font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Pilih pasangan{" "}
          <span className="relative inline-block text-violet-700">
            terbaikmu
            <svg aria-hidden="true" viewBox="0 0 200 16" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none">
              <path className="fx-draw" d="M3 10 C 40 2, 70 15, 100 8 S 160 2, 197 9" fill="none" stroke="#ffd98a" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
          <span aria-hidden="true" className="fx-wiggle ml-2 inline-block">✨</span>
        </h1>

        <p className="fx-rise mt-2 text-xs font-semibold text-slate-500 sm:text-sm" style={{ "--delay": "120ms" }}>
          Lihat detail dulu kalau ragu — pilihanmu rahasia dan hanya bisa sekali 🤫
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
              <div className="fx-pop-in h-full" style={{ "--delay": `${200 + index * 140}ms` }}>
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

// ========================================
// PANGGUNG BILIK — latar pesta untuk layar non-voting
// ========================================

function BoothStage({ boothLabel, confetti = 16, balloons = false, children }) {
  return (
    <main className="relative isolate flex h-dvh flex-col overflow-hidden font-body text-ink">
      <FestiveBackdrop confetti={confetti} />
      {balloons && <Balloons className="hidden md:block" />}
      <Bunting className="relative" />
      <BilikBadge boothLabel={boothLabel} />

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">{children}</div>
    </main>
  );
}

function BilikBadge({ boothLabel }) {
  return (
    <div className="absolute right-5 top-14 z-10 sm:right-6">
      <div className="flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 shadow-sm ring-1 ring-emerald-100 backdrop-blur-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-bold text-emerald-700">Bilik {boothLabel}</span>
      </div>
    </div>
  );
}

function BrandPill() {
  return (
    <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/85 py-1.5 pl-2 pr-4 shadow-sm ring-1 ring-violet-100">
      <div className="flex h-8 w-8 items-center justify-center">
        <img src="/logo/alamanah.png" alt="Logo Al Amanah" className="h-full w-full object-contain" />
      </div>
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
        <img src="/logo/osis.png" alt="Logo OSIS" className="h-[46px] w-[46px] max-w-none object-contain" />
      </div>
      <div className="h-5 w-px bg-slate-200" />
      <div className="text-left">
        <p className="font-display text-sm font-semibold leading-none text-violet-700">E-Voting OSIS</p>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">SMK Al Amanah</p>
      </div>
    </div>
  );
}
