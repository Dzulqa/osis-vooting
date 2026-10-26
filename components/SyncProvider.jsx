"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/syncClient";
import { getCurrentElection } from "@/lib/votingStorage";

const AUTH_SESSION_KEY = "osis_auth_session";
const BOOTH_SESSION_KEY = "osis_booth_session";

// Starts the server sync on every page and makes the browser's "who am I" hint match the server.
export default function SyncProvider() {
  useEffect(() => {
    let cancelled = false;

    startSync(getCurrentElection).then((principal) => {
      if (cancelled) return;
      try {
        if (!principal) {
          // Cookie expired or never existed: drop stale hints so guards send the user to login
          const hadSession = localStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(BOOTH_SESSION_KEY);
          localStorage.removeItem(AUTH_SESSION_KEY);
          localStorage.removeItem(BOOTH_SESSION_KEY);
          if (hadSession) window.dispatchEvent(new Event("osis-storage-update"));
        } else if (principal.type === "staff") {
          const current = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
          if (!current || current.role !== principal.role || current.username !== principal.username) {
            localStorage.setItem(
              AUTH_SESSION_KEY,
              JSON.stringify({ username: principal.username, name: principal.name, role: principal.role })
            );
            window.dispatchEvent(new Event("osis-storage-update"));
          }
        } else if (principal.type === "booth") {
          const current = JSON.parse(localStorage.getItem(BOOTH_SESSION_KEY) || "null");
          if (!current || current.boothId !== principal.boothId) {
            localStorage.setItem(BOOTH_SESSION_KEY, JSON.stringify({ boothId: principal.boothId }));
            window.dispatchEvent(new Event("osis-storage-update"));
          }
        }
      } catch {
        /* storage blocked: the app still works from the server data */
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
