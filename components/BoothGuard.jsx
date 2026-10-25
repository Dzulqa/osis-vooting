"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthSession,
  isBoothSessionValid,
  subscribeVotingStorage,
} from "@/lib/votingStorage";

// Bilik hanya bisa dibuka oleh perangkat yang sudah login ke bilik tersebut.
// Superadmin tetap boleh membuka untuk pratinjau.
export default function BoothGuard({ boothId, children }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    function checkAccess() {
      const allowed =
        isBoothSessionValid(boothId) ||
        getAuthSession()?.role === "superadmin";

      setIsAllowed(allowed);

      if (!allowed) {
        router.replace(`/login?mode=bilik&booth=${encodeURIComponent(boothId)}`);
      }
    }

    checkAccess();
    return subscribeVotingStorage(checkAccess);
  }, [boothId]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Memeriksa Akses Bilik...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
