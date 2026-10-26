// Keeps this browser's cached copy of the shared event state (queue, booths, votes, event config, ...)
// in step with the server, so registrator, caller, booth tablets and the ketua all see the same data.
//
// The rest of the app keeps reading/writing through votingStorage (a localStorage cache). This module:
//   - pulls changes from /api/state and writes them into that cache,
//   - pushes local writes to the server (whole value, or an atomic list operation),
//   - never echoes what it just pulled.

import { applyOp, isSyncedKey } from "@/lib/stateOps";

const POLL_STAFF_MS = 2500;
const POLL_GUEST_MS = 6000;

const knownVersions = new Map(); // key -> last server version applied locally
const inFlight = new Map(); // key -> number of pushes still on the wire

let principal = null; // { type, role, ... } | null
let ready = false; // true after the first pull; before that nothing is pushed
let since = null;
let timer = null;
let running = 0; // bumps on every (re)start so stale loops stop themselves

function isBrowser() {
  return typeof window !== "undefined";
}

function notify() {
  window.dispatchEvent(new Event("osis-storage-update"));
}

async function api(path, options) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  return { ok: res.ok, status: res.status, body };
}

export function getSyncPrincipal() {
  return principal;
}

// ------------------------------------------------------------------ pull

function applyEntries(entries) {
  let changed = false;
  for (const entry of entries) {
    if (inFlight.get(entry.key)) continue; // our own write is still landing; the next poll settles it
    const known = knownVersions.get(entry.key);
    if (known !== undefined && entry.version <= known) continue;

    knownVersions.set(entry.key, entry.version);
    const current = localStorage.getItem(entry.key);
    if (entry.value === "null") {
      if (current !== null) {
        localStorage.removeItem(entry.key);
        changed = true;
      }
    } else if (current !== entry.value) {
      localStorage.setItem(entry.key, entry.value);
      changed = true;
    }
  }
  return changed;
}

async function pull(initial) {
  const query = !initial && since ? `?since=${encodeURIComponent(since)}` : "";
  const res = await api(`/api/state${query}`);
  if (!res.ok || !res.body?.data) return null;

  const { entries, serverTime, principal: serverPrincipalType } = res.body.data;

  // The server no longer recognises this device (session expired, booth removed, code regenerated)
  if (principal && serverPrincipalType !== principal.type) {
    localStorage.removeItem(principal.type === "booth" ? "osis_booth_session" : "osis_auth_session");
    principal = null;
    notify();
  }
  // Overlap by a little so two writes in the same millisecond are never missed (versions de-duplicate)
  since = new Date(new Date(serverTime).getTime() - 2000).toISOString();
  if (applyEntries(entries)) notify();
  return entries;
}

// The first superadmin browser carries the existing local data; push whatever the server lacks.
async function seedMissing(serverEntries) {
  if (principal?.role !== "superadmin") return;
  const onServer = new Set(serverEntries.map((e) => e.key));

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !isSyncedKey(key) || onServer.has(key)) continue;
    const value = localStorage.getItem(key);
    if (value === null || value === "[]" || value === "null") continue;
    await pushValue(key, value);
  }
}

// ------------------------------------------------------------------ push

function track(key, promise) {
  inFlight.set(key, (inFlight.get(key) || 0) + 1);
  return promise.finally(() => inFlight.set(key, Math.max(0, (inFlight.get(key) || 1) - 1)));
}

async function pushValue(key, value) {
  const res = await track(key, api("/api/state", { method: "POST", body: JSON.stringify({ key, value }) }));
  if (res.ok && res.body?.data?.version) knownVersions.set(key, res.body.data.version);
  return res.ok;
}

/** Whole-value write (last write wins). Local cache must already be updated. */
export function pushSet(key, value) {
  if (!isBrowser() || !ready || !principal || !isSyncedKey(key)) return;
  pushValue(key, value).then((ok) => {
    if (!ok) pull(true); // rejected (e.g. no permission): fall back to the server's copy
  });
}

/** Atomic list operation. Local cache must already be updated (use `localApply`). */
export function pushOp(key, op) {
  if (!isBrowser() || !ready || !principal || !isSyncedKey(key)) return;
  track(key, api("/api/state", { method: "POST", body: JSON.stringify({ key, op }) })).then((res) => {
    if (res.ok && res.body?.data?.version) knownVersions.set(key, res.body.data.version);
    if (!res.ok) pull(true);
  });
}

/** Apply an operation to the local cached list (same logic the server runs). */
export function localApply(key, op) {
  const raw = localStorage.getItem(key);
  let list = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch {
    list = [];
  }
  localStorage.setItem(key, JSON.stringify(applyOp(list, op)));
}

/** Casts a ballot on the server (authoritative: one vote per student, only from the assigned booth). */
/** Pull from the server now (after a server-side change), instead of waiting for the next poll. */
export async function refreshNow() {
  if (!isBrowser() || !ready) return;
  await pull(false);
}

export async function castVoteRemote({ candidateId, studentId, boothId }) {
  const res = await api("/api/state/vote", {
    method: "POST",
    body: JSON.stringify({ candidateId, studentId, boothId }),
  });
  return { success: res.ok, message: res.body?.message, code: res.body?.code };
}

// ------------------------------------------------------------------ lifecycle

function schedule(token) {
  clearTimeout(timer);
  if (token !== running) return;
  const delay = principal ? POLL_STAFF_MS : POLL_GUEST_MS;
  timer = setTimeout(async () => {
    if (token !== running) return;
    if (document.visibilityState === "visible") {
      try {
        await pull(false);
      } catch {
        /* offline: try again next tick */
      }
    }
    schedule(token);
  }, delay);
}

/** (Re)start syncing for whoever is signed in right now. Returns the principal (or null).
 * `beforeSeed` runs after the first pull and before the superadmin seeds missing keys. */
export async function startSync(beforeSeed) {
  if (!isBrowser()) return null;
  const token = ++running;
  ready = false;
  since = null;
  knownVersions.clear();

  const me = await api("/api/auth/me");
  principal = me.body?.data?.principal ?? null;

  const entries = await pull(true);
  if (token !== running) return principal;
  if (entries) {
    // Lets the app create its local defaults (e.g. the first election) so they are seeded too
    try {
      beforeSeed?.();
    } catch {
      /* defaults are best effort */
    }
    await seedMissing(entries);
  }
  ready = true;

  schedule(token);
  return principal;
}

export function stopSync() {
  running++;
  clearTimeout(timer);
  ready = false;
  principal = null;
}

// Refresh promptly when the tab comes back or the network returns
if (isBrowser()) {
  const wake = () => {
    if (ready) pull(false).catch(() => {});
  };
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("online", wake);
}
