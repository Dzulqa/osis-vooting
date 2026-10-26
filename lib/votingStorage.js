import { getSyncPrincipal, localApply, pushOp, pushSet, castVoteRemote, startSync } from "@/lib/syncClient";

// Data di bawah ini milik SATU pemilihan (satu per tahun ajaran).
// Nama kunci aslinya diberi akhiran "@<electionId>" lewat scoped().
const QUEUE_BASE = "osis_queue";
const BOOTHS_BASE = "osis_booths";
const VOTED_BASE = "osis_voted";
const VOTES_BASE = "osis_votes";
const EVENT_CONFIG_BASE = "osis_event_config";
const KETUA_OSIS_BASE = "osis_ketua_identity";
const COMMITTEE_BASE = "osis_committee_list";
const CUSTOM_CANDIDATES_BASE = "osis_custom_candidates";
const CUSTOM_STUDENTS_BASE = "osis_custom_dpt";

const ELECTION_SCOPED_BASES = [
  QUEUE_BASE,
  BOOTHS_BASE,
  VOTED_BASE,
  VOTES_BASE,
  EVENT_CONFIG_BASE,
  KETUA_OSIS_BASE,
  COMMITTEE_BASE,
  CUSTOM_CANDIDATES_BASE,
  CUSTOM_STUDENTS_BASE,
];

// Global (lintas pemilihan)
const ELECTIONS_KEY = "osis_elections";
const CURRENT_ELECTION_KEY = "osis_current_election";
const LEGACY_ACADEMIC_YEAR_KEY = "osis_academic_year";
const CUSTOM_TEACHERS_KEY = "osis_custom_teachers";
const AUTH_SESSION_KEY = "osis_auth_session";
const BOOTH_SESSION_KEY = "osis_booth_session";

const defaultAcademicYear = "2026/2027";
const defaultKetuaOsis = {
  nama: "",
  nis: "",
  kelas: "",
  jabatan: "",
};

const defaultEventConfig = {
  status: "open",
  startTime: "",
  endTime: "",
  isResultRevealed: false,
  // Diisi saat "Hitung sekarang" selesai; sebelum itu angka per paslon tetap terkunci
  resultsCountedAt: null,
};


const defaultBooths = [
  {
    id: 1,
    status: "waiting",
    student: null,
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

// Reads come from the local cache. Shared data (queue, booths, votes, event config, ...) is also
// sent to the server; see lib/syncClient.js for how it is kept in step across devices.
function writeShared(key, value) {
  localStorage.setItem(key, value);
  pushSet(key, value);
}

function removeShared(key) {
  localStorage.removeItem(key);
  pushSet(key, "null");
}

// Atomic list change (append / remove / patch): applied locally now, and on the server without
// overwriting what other devices did in the meantime.
function updateList(key, op) {
  localApply(key, op);
  pushOp(key, op);
}

// Kode akses 6 digit untuk login perangkat bilik
function generateBoothCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

function notifyUpdate() {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new Event("osis-storage-update")
  );
}

// ========================================
// PEMILIHAN PER TAHUN AJARAN
// ========================================

function readElections() {
  const data = localStorage.getItem(ELECTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function writeElections(list) {
  writeShared(ELECTIONS_KEY, JSON.stringify(list));
}

function electionKey(base, electionId) {
  return `${base}@${electionId}`;
}

// Pastikan selalu ada pemilihan aktif. Data lama (sebelum ada pemilihan per tahun)
// dipindahkan ke pemilihan pertama supaya tidak hilang.
function ensureElections() {
  let elections = readElections();
  let currentId = Number(localStorage.getItem(CURRENT_ELECTION_KEY));

  if (elections.length === 0) {
    const academicYear = localStorage.getItem(LEGACY_ACADEMIC_YEAR_KEY) || defaultAcademicYear;
    const first = {
      id: 1,
      academicYear,
      name: `Pemilihan Ketua OSIS ${academicYear}`,
      createdAt: new Date().toISOString(),
    };

    ELECTION_SCOPED_BASES.forEach((base) => {
      const legacy = localStorage.getItem(base);
      if (legacy !== null) {
        localStorage.setItem(electionKey(base, first.id), legacy);
        localStorage.removeItem(base);
      }
    });
    localStorage.removeItem(LEGACY_ACADEMIC_YEAR_KEY);

    elections = [first];
    writeElections(elections);
    currentId = first.id;
    localStorage.setItem(CURRENT_ELECTION_KEY, String(currentId));
  }

  if (!elections.some((e) => e.id === currentId)) {
    currentId = elections[elections.length - 1].id;
    localStorage.setItem(CURRENT_ELECTION_KEY, String(currentId));
  }

  return { elections, currentId };
}

function scoped(base) {
  return electionKey(base, ensureElections().currentId);
}

export function getElections() {
  if (!isBrowser()) return [];
  const { elections, currentId } = ensureElections();
  return elections.map((election) => ({ ...election, isCurrent: election.id === currentId }));
}

export function getCurrentElection() {
  if (!isBrowser()) {
    return { id: 0, academicYear: defaultAcademicYear, name: `Pemilihan Ketua OSIS ${defaultAcademicYear}` };
  }
  const { elections, currentId } = ensureElections();
  return elections.find((e) => e.id === currentId);
}

// Pemilihan lama = arsip; DPT-nya dibekukan dan tidak ditimpa data Sinar terbaru
export function isCurrentElectionLatest() {
  if (!isBrowser()) return true;
  const { elections, currentId } = ensureElections();
  return currentId === Math.max(...elections.map((e) => e.id));
}

// Ringkasan sebuah pemilihan (aktif atau arsip) untuk daftar riwayat
export function getElectionStats(electionId) {
  if (!isBrowser()) return { votes: 0, voters: 0, candidates: 0, booths: 0 };
  const read = (base) => {
    const data = localStorage.getItem(electionKey(base, electionId));
    return data ? JSON.parse(data) : [];
  };
  return {
    votes: read(VOTES_BASE).length,
    voters: read(CUSTOM_STUDENTS_BASE).length,
    candidates: read(CUSTOM_CANDIDATES_BASE).length,
    booths: read(BOOTHS_BASE).length,
  };
}

// Pemilihan yang sedang berjalan (ada antrean / siswa di bilik) tidak boleh ditinggal
function getBusyReason() {
  if (getQueue().length > 0) return "Masih ada siswa di antrean pemilih.";
  if (getBooths().some((booth) => booth.status !== "waiting")) return "Masih ada siswa di dalam bilik suara.";
  return null;
}

/**
 * Membuka pemilihan baru untuk tahun ajaran tertentu dan menjadikannya aktif.
 * Data pemilihan lama tetap tersimpan sebagai arsip.
 * options.copyBooths / options.copyCommittee menyalin pengaturan dari pemilihan aktif.
 */
// Panitia accounts are global (database), so there is nothing to copy for them.
export function openNewElection({ academicYear, name, copyBooths = true }) {
  if (!isBrowser()) return { success: false, message: "Lingkungan browser tidak tersedia." };

  const year = (academicYear || "").trim();
  if (!year) return { success: false, message: "Pilih tahun ajaran terlebih dahulu." };

  const { elections } = ensureElections();
  const existing = elections.find((e) => e.academicYear === year);
  if (existing) {
    return {
      success: false,
      existing,
      message: `Pemilihan tahun ajaran ${year} sudah ada. Aktifkan dari daftar riwayat.`,
    };
  }

  const busy = getBusyReason();
  if (busy) return { success: false, message: `${busy} Selesaikan dulu sebelum membuka pemilihan baru.` };

  const previousBooths = getBooths();

  const election = {
    id: Math.max(...elections.map((e) => e.id)) + 1,
    academicYear: year,
    name: (name || "").trim() || `Pemilihan Ketua OSIS ${year}`,
    createdAt: new Date().toISOString(),
  };

  // Bilik disalin dengan kode akses yang sama agar perangkat bilik tidak perlu login ulang
  if (copyBooths) {
    const booths = previousBooths.map((booth) => ({ ...booth, status: "waiting", student: null }));
    writeShared(electionKey(BOOTHS_BASE, election.id), JSON.stringify(booths));
  }
  // Pemilihan baru dimulai tertutup sampai Ketua OSIS membukanya
  writeShared(
    electionKey(EVENT_CONFIG_BASE, election.id),
    JSON.stringify({ ...defaultEventConfig, status: "closed" })
  );

  writeElections([...elections, election]);
  writeShared(CURRENT_ELECTION_KEY, String(election.id));
  notifyUpdate();

  return { success: true, election };
}

export function setCurrentElection(electionId) {
  if (!isBrowser()) return { success: false, message: "Lingkungan browser tidak tersedia." };

  const id = Number(electionId);
  const { elections, currentId } = ensureElections();
  const target = elections.find((e) => e.id === id);

  if (!target) return { success: false, message: "Pemilihan tidak ditemukan." };
  if (id === currentId) return { success: true, election: target };

  const busy = getBusyReason();
  if (busy) return { success: false, message: `${busy} Selesaikan dulu sebelum berpindah pemilihan.` };

  writeShared(CURRENT_ELECTION_KEY, String(id));
  notifyUpdate();
  return { success: true, election: target };
}

// ========================================
// QUEUE
// ========================================

export function getQueue() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(scoped(QUEUE_BASE));

  return data ? JSON.parse(data) : [];
}

export function saveQueue(queue) {
  if (!isBrowser()) return;

  writeShared(
    scoped(QUEUE_BASE),
    JSON.stringify(queue)
  );

  notifyUpdate();
}

export function addToQueue(student) {
  const queue = getQueue();

  const alreadyInQueue = queue.some(
    (item) => item.id === student.id
  );

  if (alreadyInQueue) {
    return false;
  }

  if (hasStudentVoted(student.id)) {
    return false;
  }

  // Cegah siswa yang sedang berada di bilik
  const booths = getBooths();

  const currentlyInBooth = booths.some(
    (booth) =>
      booth.student?.id === student.id
  );

  if (currentlyInBooth) {
    return false;
  }

  const newStudent = {
    ...student,
    status: "waiting",
  };

  updateList(scoped(QUEUE_BASE), { type: "append", item: newStudent });
  notifyUpdate();

  return true;
}

export function removeFromQueue(studentId) {
  updateList(scoped(QUEUE_BASE), { type: "remove", id: studentId });
  notifyUpdate();
}

// ========================================
// BOOTHS
// ========================================

export function getBooths() {
  if (!isBrowser()) {
    return defaultBooths;
  }

  const data = localStorage.getItem(scoped(BOOTHS_BASE));
  const booths = data ? JSON.parse(data) : defaultBooths;

  // Pastikan setiap bilik punya kode akses (termasuk data lama)
  const needsCode = !data || booths.some((booth) => !booth.accessCode);

  if (needsCode) {
    const withCodes = booths.map((booth) => ({
      ...booth,
      accessCode: booth.accessCode || generateBoothCode(),
    }));

    // Only the superadmin may create the booth list on the server; other devices just cache it
    const json = JSON.stringify(withCodes);
    localStorage.setItem(scoped(BOOTHS_BASE), json);
    if (getSyncPrincipal()?.role === "superadmin") pushSet(scoped(BOOTHS_BASE), json);

    return withCodes;
  }

  return booths;
}

export function saveBooths(booths) {
  if (!isBrowser()) return;

  writeShared(
    scoped(BOOTHS_BASE),
    JSON.stringify(booths)
  );

  notifyUpdate();
}

export function addBooth() {
  const booths = getBooths();
  const nextId = booths.length > 0 ? Math.max(...booths.map((b) => Number(b.id))) + 1 : 1;
  const newBooth = {
    id: nextId,
    status: "waiting",
    student: null,
    accessCode: generateBoothCode(),
  };
  updateList(scoped(BOOTHS_BASE), { type: "append", item: newBooth });
  notifyUpdate();
  return newBooth;
}

export function regenerateBoothCode(boothId) {
  const id = Number(boothId);
  const accessCode = generateBoothCode();
  updateList(scoped(BOOTHS_BASE), { type: "patch", id, fields: { accessCode } });
  notifyUpdate();
  return accessCode;
}

export function removeBooth(boothId) {
  const booths = getBooths();
  if (booths.length <= 1) return false;
  const id = Number(boothId);
  updateList(scoped(BOOTHS_BASE), { type: "remove", id });
  notifyUpdate();
  return true;
}


export function assignStudentToBooth(
  student,
  boothId
) {
  const booths = getBooths();

  const id = Number(boothId);

  const targetBooth = booths.find(
    (booth) => booth.id === id
  );

  if (!targetBooth) {
    return false;
  }

  if (targetBooth.status !== "waiting") {
    return false;
  }

  if (hasStudentVoted(student.id)) {
    return false;
  }

  // Cegah satu siswa masuk dua bilik
  const alreadyAssigned = booths.some(
    (booth) =>
      booth.student?.id === student.id
  );

  if (alreadyAssigned) {
    return false;
  }

  updateList(scoped(BOOTHS_BASE), {
    type: "patch",
    id,
    fields: { status: "assigned", student },
  });
  notifyUpdate();

  removeFromQueue(student.id);

  return true;
}

export function activateBooth(boothId) {
  const booths = getBooths();

  const id = Number(boothId);

  const booth = booths.find((b) => b.id === id);
  if (booth && booth.status === "assigned" && booth.student) {
    updateList(scoped(BOOTHS_BASE), { type: "patch", id, fields: { status: "active" } });
    notifyUpdate();
  }
}

// Salah panggil: keluarkan siswa dari bilik dan kembalikan ke antrean paling depan
export function cancelBoothAssignment(boothId) {
  const id = Number(boothId);
  const booth = getBooths().find((b) => b.id === id);

  if (!booth || booth.status === "waiting" || !booth.student) {
    return null;
  }

  const student = booth.student;

  updateList(scoped(BOOTHS_BASE), { type: "patch", id, fields: { status: "waiting", student: null } });

  const voted = getVotedStudents().some((votedId) => String(votedId) === String(student.id));
  if (!voted) {
    updateList(scoped(QUEUE_BASE), { type: "prepend", item: { ...student, status: "waiting" } });
  }
  notifyUpdate();

  return student;
}

export function resetBooth(boothId) {
  const booths = getBooths();

  const id = Number(boothId);

  if (booths.some((b) => b.id === id)) {
    updateList(scoped(BOOTHS_BASE), { type: "patch", id, fields: { status: "waiting", student: null } });
    notifyUpdate();
  }
}

// ========================================
// VOTED STUDENTS
// ========================================

export function getVotedStudents() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(scoped(VOTED_BASE));

  return data ? JSON.parse(data) : [];
}

export function hasStudentVoted(studentId) {
  return getVotedStudents().includes(studentId);
}

// ========================================
// VOTES
// ========================================

export function getVotes() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(scoped(VOTES_BASE));

  return data ? JSON.parse(data) : [];
}

export function getVotesByCandidate(candidateId) {
  const votes = getVotes();
  return votes
    .filter((vote) => vote.candidateId === Number(candidateId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getVoteSummary(candidatesList = []) {
  const votes = getVotes();
  const totalVotes = votes.length;

  const candidateStats = candidatesList.map((candidate) => {
    const candidateVotes = votes.filter(
      (v) => v.candidateId === candidate.id
    );
    const count = candidateVotes.length;
    const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";

    return {
      candidate,
      count,
      percentage: Number(percentage),
      votesLog: candidateVotes.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    };
  });

  let leader = null;
  if (totalVotes > 0) {
    const sorted = [...candidateStats].sort((a, b) => b.count - a.count);
    if (sorted[0].count > (sorted[1]?.count ?? -1)) {
      leader = sorted[0].candidate;
    }
  }

  return {
    totalVotes,
    candidateStats,
    leader,
  };
}

// The server records the vote and the "has voted" mark in one step: one vote per student, and only
// from the booth that student was sent to. Resolves to true when the vote was counted.
export async function saveVote({
  candidateId,
  boothId,
  studentId,
}) {
  if (!isBrowser()) return false;

  const result = await castVoteRemote({ candidateId, boothId, studentId });
  if (result.success) notifyUpdate();
  return result.success;
}

// ========================================
// SYNC ANTAR TAB
// ========================================

export function subscribeVotingStorage(
  callback
) {
  if (!isBrowser()) {
    return () => {};
  }

  function handleUpdate() {
    callback();
  }

  window.addEventListener(
    "storage",
    handleUpdate
  );

  window.addEventListener(
    "osis-storage-update",
    handleUpdate
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleUpdate
    );

    window.removeEventListener(
      "osis-storage-update",
      handleUpdate
    );
  };
}

// ========================================
// MANAJEMEN EVENT & OTORISASI (KETUA OSIS)
// ========================================

export function getEventConfig() {
  if (!isBrowser()) return defaultEventConfig;

  const data = localStorage.getItem(scoped(EVENT_CONFIG_BASE));
  if (!data) {
    localStorage.setItem(
      scoped(EVENT_CONFIG_BASE),
      JSON.stringify(defaultEventConfig)
    );
    return defaultEventConfig;
  }

  return {
    ...defaultEventConfig,
    ...JSON.parse(data),
  };
}

export function saveEventConfig(config) {
  if (!isBrowser()) return;

  const current = getEventConfig();
  const updated = {
    ...current,
    ...config,
  };

  writeShared(
    scoped(EVENT_CONFIG_BASE),
    JSON.stringify(updated)
  );

  notifyUpdate();
}

export function toggleResultRevealed(revealedState) {
  const current = getEventConfig();
  const nextState =
    typeof revealedState === "boolean"
      ? revealedState
      : !current.isResultRevealed;

  // Mengunci kembali hasil juga membatalkan penghitungan → harus dihitung ulang
  saveEventConfig(
    nextState ? { isResultRevealed: true } : { isResultRevealed: false, resultsCountedAt: null }
  );
}

export function markResultsCounted() {
  saveEventConfig({ resultsCountedAt: new Date().toISOString() });
}

export function setEventStatus(status) {
  saveEventConfig({ status });
}

export function setEventSchedule({ startTime, endTime }) {
  saveEventConfig({ startTime, endTime });
}

/**
 * Memeriksa jadwal event (startTime & endTime) dan otomatis mengubah status
 * event menjadi "open" atau "closed" berdasarkan waktu saat ini.
 * Mengembalikan objek { changed: boolean, newStatus: string|null, reason: string }
 */
export function checkAndApplySchedule() {
  if (!isBrowser()) return { changed: false, newStatus: null, reason: "not-browser" };

  const config = getEventConfig();
  const { startTime, endTime, status } = config;

  // Jika tidak ada jadwal yang diatur, tidak ada yang dilakukan
  if (!startTime && !endTime) {
    return { changed: false, newStatus: null, reason: "no-schedule" };
  }

  const now = new Date();
  const start = startTime ? new Date(startTime) : null;
  const end = endTime ? new Date(endTime) : null;

  let targetStatus = null;

  if (start && end) {
    // Ada keduanya: open antara start dan end, closed di luar rentang
    if (now >= start && now < end) {
      targetStatus = "open";
    } else {
      targetStatus = "closed";
    }
  } else if (start && !end) {
    // Hanya start: open setelah start
    targetStatus = now >= start ? "open" : "closed";
  } else if (!start && end) {
    // Hanya end: closed setelah end
    targetStatus = now < end ? "open" : "closed";
  }

  if (targetStatus && targetStatus !== status) {
    saveEventConfig({ status: targetStatus });
    return { changed: true, newStatus: targetStatus, reason: "schedule-applied" };
  }

  return { changed: false, newStatus: status, reason: "already-correct" };
}

// ========================================
// RESET SIMULASI & OVERRIDE
// ========================================

export function resetVotingSimulation() {
  if (!isBrowser()) return;

  removeShared(scoped(QUEUE_BASE));
  removeShared(scoped(BOOTHS_BASE));
  removeShared(scoped(VOTED_BASE));
  removeShared(scoped(VOTES_BASE));
  removeShared(scoped(EVENT_CONFIG_BASE));

  notifyUpdate();
}

// ========================================
// SUPERADMIN & MASTER DATA
// ========================================

// Tahun ajaran mengikuti pemilihan yang sedang aktif
export function getAcademicYear() {
  return getCurrentElection()?.academicYear || defaultAcademicYear;
}

export function getKetuaOsisIdentity() {
  if (!isBrowser()) return defaultKetuaOsis;
  const data = localStorage.getItem(scoped(KETUA_OSIS_BASE));
  return data ? JSON.parse(data) : defaultKetuaOsis;
}

export function saveKetuaOsisIdentity(identity) {
  if (!isBrowser()) return;
  writeShared(scoped(KETUA_OSIS_BASE), JSON.stringify(identity));
  notifyUpdate();
}

// ========================================
// DYNAMIC MASTER PASLON & DPT (STUDENTS)
// ========================================

export function getCandidatesList() {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(scoped(CUSTOM_CANDIDATES_BASE));
  return data ? JSON.parse(data) : [];
}

export function saveCandidatesList(list) {
  if (!isBrowser()) return;
  writeShared(scoped(CUSTOM_CANDIDATES_BASE), JSON.stringify(list));
  notifyUpdate();
}

export function addCandidate(candidate) {
  const candidates = getCandidatesList();
  const nextId = candidates.length > 0 ? Math.max(...candidates.map((c) => Number(c.id))) + 1 : 1;
  const nomorStr = String(nextId).padStart(2, "0");
  const newCand = {
    id: nextId,
    nomor: candidate.nomor || nomorStr,
    ...candidate,
  };
  saveCandidatesList([...candidates, newCand]);
}

export function updateCandidate(id, patch) {
  saveCandidatesList(
    getCandidatesList().map((c) => (c.id === Number(id) ? { ...c, ...patch } : c))
  );
}

export function removeCandidate(id) {
  const candidates = getCandidatesList();
  saveCandidatesList(candidates.filter((c) => c.id !== Number(id)));
}

export function getStudentsList() {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(scoped(CUSTOM_STUDENTS_BASE));
  return data ? JSON.parse(data) : [];
}

export function saveStudentsList(list) {
  if (!isBrowser()) return;
  writeShared(scoped(CUSTOM_STUDENTS_BASE), JSON.stringify(list));
  notifyUpdate();
}

export function getTeachersList() {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(CUSTOM_TEACHERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTeachersList(list) {
  if (!isBrowser()) return;
  localStorage.setItem(CUSTOM_TEACHERS_KEY, JSON.stringify(list));
  notifyUpdate();
}

export function importDptFromData(list) {
  saveStudentsList(list);
}

// ========================================
// AUTHENTICATION & CREDENTIALS
// ========================================

export function getAuthSession() {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(AUTH_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

async function postJson(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null, offline: true };
  }
}

// Checked by the server (database accounts); the result is mirrored here only so the UI knows the role.
export async function loginUser(username, password) {
  if (!isBrowser()) return { success: false, message: "Lingkungan browser tidak tersedia." };

  const res = await postJson("/api/auth/login", { username: (username || "").trim(), password: password || "" });
  if (!res.ok) {
    return {
      success: false,
      message: res.offline
        ? "Tidak dapat menghubungi server. Periksa koneksi internet."
        : res.data?.message || "Username atau password yang Anda masukkan salah.",
    };
  }

  const session = res.data.data.session;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  await startSync(getCurrentElection); // load the shared event data for this role before the first page renders
  notifyUpdate();
  return { success: true, session };
}

export function logoutUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  postJson("/api/auth/logout").finally(() => startSync(getCurrentElection));
  notifyUpdate();
}

const ROLE_HOME_PATHS = {
  superadmin: "/superadmin",
  ketua: "/ketua",
  registrator: "/registration",
  caller: "/caller",
  saksi: "/results",
};

export const ROLE_LABELS = {
  superadmin: "Superadmin",
  ketua: "Ketua OSIS",
  registrator: "Registrator",
  caller: "Caller",
  saksi: "Saksi",
};

export function getHomePathForRole(role) {
  return ROLE_HOME_PATHS[role] || "/";
}

// ========================================
// LOGIN PERANGKAT BILIK
// ========================================

export function getBoothSession() {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(BOOTH_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export async function loginBooth(boothId, accessCode) {
  if (!isBrowser()) return { success: false, message: "Lingkungan browser tidak tersedia." };

  const res = await postJson("/api/booth/login", { boothId: Number(boothId), code: (accessCode || "").trim() });
  if (!res.ok) {
    return {
      success: false,
      message: res.offline
        ? "Tidak dapat menghubungi server. Periksa koneksi internet."
        : res.data?.message || "Kode akses bilik salah.",
    };
  }

  const session = res.data.data.session;
  localStorage.setItem(BOOTH_SESSION_KEY, JSON.stringify(session));
  await startSync(getCurrentElection);
  notifyUpdate();
  return { success: true, session };
}

// Valid while the server still accepts this device; syncClient clears the session when it does not
// (booth removed, or its access code regenerated).
export function isBoothSessionValid(boothId) {
  const session = getBoothSession();
  return Boolean(session) && session.boothId === Number(boothId);
}

export function logoutBooth() {
  if (!isBrowser()) return;
  localStorage.removeItem(BOOTH_SESSION_KEY);
  postJson("/api/booth/logout").finally(() => startSync(getCurrentElection));
  notifyUpdate();
}