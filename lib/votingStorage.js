import initialCandidates from "@/data/candidates";
import initialStudents from "@/data/students";

const QUEUE_KEY = "osis_queue";
const BOOTHS_KEY = "osis_booths";
const VOTED_KEY = "osis_voted";
const VOTES_KEY = "osis_votes";
const EVENT_CONFIG_KEY = "osis_event_config";
const ACADEMIC_YEAR_KEY = "osis_academic_year";
const KETUA_OSIS_KEY = "osis_ketua_identity";
const COMMITTEE_KEY = "osis_committee_list";
const CUSTOM_CANDIDATES_KEY = "osis_custom_candidates";
const CUSTOM_STUDENTS_KEY = "osis_custom_dpt";
const AUTH_SESSION_KEY = "osis_auth_session";
const AUTH_CREDS_KEY = "osis_auth_creds";

const defaultAuthCreds = {
  superadmin: {
    username: "superadmin",
    password: "admin123",
    name: "Pembina OSIS / Tim IT",
    role: "superadmin",
  },
  ketua: {
    username: "ketua",
    password: "ketua123",
    name: "Ketua OSIS Saat Ini",
    role: "ketua",
  },
};

const defaultAcademicYear = "2026/2027";
const defaultKetuaOsis = {
  nama: "Ahmad Hilbram Dzulqa",
  nis: "001",
  kelas: "XII RPL 1",
  jabatan: "Ketua OSIS Saat Ini (Demisioner)",
};
const defaultCommittee = [
  { id: "1", nama: "Budi Santoso", username: "registrator1", role: "Registrator" },
  { id: "2", nama: "Daffa Alfarizi", username: "caller1", role: "Caller" },
  { id: "3", nama: "Nabila Zahra", username: "saksi1", role: "Saksi" },
];

const defaultEventConfig = {
  status: "open",
  startTime: "",
  endTime: "",
  isResultRevealed: false,
};


const defaultBooths = [
  {
    id: 1,
    status: "waiting",
    student: null,
  },
  {
    id: 2,
    status: "waiting",
    student: null,
  },
  {
    id: 3,
    status: "waiting",
    student: null,
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyUpdate() {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new Event("osis-storage-update")
  );
}

// ========================================
// QUEUE
// ========================================

export function getQueue() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(QUEUE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveQueue(queue) {
  if (!isBrowser()) return;

  localStorage.setItem(
    QUEUE_KEY,
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

  saveQueue([
    ...queue,
    newStudent,
  ]);

  return true;
}

export function removeFromQueue(studentId) {
  const queue = getQueue();

  saveQueue(
    queue.filter(
      (student) => student.id !== studentId
    )
  );
}

// ========================================
// BOOTHS
// ========================================

export function getBooths() {
  if (!isBrowser()) {
    return defaultBooths;
  }

  const data = localStorage.getItem(BOOTHS_KEY);

  if (!data) {
    localStorage.setItem(
      BOOTHS_KEY,
      JSON.stringify(defaultBooths)
    );

    return defaultBooths;
  }

  return JSON.parse(data);
}

export function saveBooths(booths) {
  if (!isBrowser()) return;

  localStorage.setItem(
    BOOTHS_KEY,
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
  };
  saveBooths([...booths, newBooth]);
  return newBooth;
}

export function removeBooth(boothId) {
  const booths = getBooths();
  if (booths.length <= 1) return false;
  const id = Number(boothId);
  const updated = booths.filter((b) => b.id !== id);
  saveBooths(updated);
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

  const updatedBooths = booths.map(
    (booth) =>
      booth.id === id
        ? {
            ...booth,
            status: "assigned",
            student,
          }
        : booth
  );

  saveBooths(updatedBooths);

  removeFromQueue(student.id);

  return true;
}

export function activateBooth(boothId) {
  const booths = getBooths();

  const id = Number(boothId);

  const updatedBooths = booths.map(
    (booth) => {
      if (
        booth.id === id &&
        booth.status === "assigned" &&
        booth.student
      ) {
        return {
          ...booth,
          status: "active",
        };
      }

      return booth;
    }
  );

  saveBooths(updatedBooths);
}

export function resetBooth(boothId) {
  const booths = getBooths();

  const id = Number(boothId);

  const updatedBooths = booths.map(
    (booth) =>
      booth.id === id
        ? {
            ...booth,
            status: "waiting",
            student: null,
          }
        : booth
  );

  saveBooths(updatedBooths);
}

// ========================================
// VOTED STUDENTS
// ========================================

export function getVotedStudents() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(VOTED_KEY);

  return data ? JSON.parse(data) : [];
}

export function hasStudentVoted(studentId) {
  return getVotedStudents().includes(studentId);
}

export function markStudentAsVoted(studentId) {
  const voted = getVotedStudents();

  if (voted.includes(studentId)) {
    return false;
  }

  const updated = [
    ...voted,
    studentId,
  ];

  localStorage.setItem(
    VOTED_KEY,
    JSON.stringify(updated)
  );

  notifyUpdate();

  return true;
}

// ========================================
// VOTES
// ========================================

export function getVotes() {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(VOTES_KEY);

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

export function saveVote({
  candidateId,
  boothId,
  studentId,
}) {
  if (!isBrowser()) return false;

  // Double vote protection untuk simulasi
  if (hasStudentVoted(studentId)) {
    return false;
  }

  const votes = getVotes();

  const vote = {
    id: crypto.randomUUID(),
    candidateId: Number(candidateId),
    boothId: Number(boothId),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(
    VOTES_KEY,
    JSON.stringify([
      ...votes,
      vote,
    ])
  );

  markStudentAsVoted(studentId);

  notifyUpdate();

  return true;
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

  const data = localStorage.getItem(EVENT_CONFIG_KEY);
  if (!data) {
    localStorage.setItem(
      EVENT_CONFIG_KEY,
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

  localStorage.setItem(
    EVENT_CONFIG_KEY,
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

  saveEventConfig({ isResultRevealed: nextState });
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

  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(BOOTHS_KEY);
  localStorage.removeItem(VOTED_KEY);
  localStorage.removeItem(VOTES_KEY);
  localStorage.removeItem(EVENT_CONFIG_KEY);

  notifyUpdate();
}

// ========================================
// SUPERADMIN & MASTER DATA
// ========================================

export function getAcademicYear() {
  if (!isBrowser()) return defaultAcademicYear;
  return localStorage.getItem(ACADEMIC_YEAR_KEY) || defaultAcademicYear;
}

export function saveAcademicYear(year) {
  if (!isBrowser()) return;
  localStorage.setItem(ACADEMIC_YEAR_KEY, year);
  notifyUpdate();
}

export function getKetuaOsisIdentity() {
  if (!isBrowser()) return defaultKetuaOsis;
  const data = localStorage.getItem(KETUA_OSIS_KEY);
  return data ? JSON.parse(data) : defaultKetuaOsis;
}

export function saveKetuaOsisIdentity(identity) {
  if (!isBrowser()) return;
  localStorage.setItem(KETUA_OSIS_KEY, JSON.stringify(identity));
  notifyUpdate();
}

export function getCommitteeList() {
  if (!isBrowser()) return defaultCommittee;
  const data = localStorage.getItem(COMMITTEE_KEY);
  return data ? JSON.parse(data) : defaultCommittee;
}

export function saveCommitteeList(list) {
  if (!isBrowser()) return;
  localStorage.setItem(COMMITTEE_KEY, JSON.stringify(list));
  notifyUpdate();
}

export function addCommitteeMember(member) {
  const list = getCommitteeList();
  const newMember = {
    id: crypto.randomUUID(),
    ...member,
  };
  saveCommitteeList([...list, newMember]);
}

export function removeCommitteeMember(id) {
  const list = getCommitteeList();
  saveCommitteeList(list.filter((m) => m.id !== id));
}

// ========================================
// DYNAMIC MASTER PASLON & DPT (STUDENTS)
// ========================================

export function getCandidatesList() {
  if (!isBrowser()) return initialCandidates;
  const data = localStorage.getItem(CUSTOM_CANDIDATES_KEY);
  return data ? JSON.parse(data) : initialCandidates;
}

export function saveCandidatesList(list) {
  if (!isBrowser()) return;
  localStorage.setItem(CUSTOM_CANDIDATES_KEY, JSON.stringify(list));
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

export function removeCandidate(id) {
  const candidates = getCandidatesList();
  saveCandidatesList(candidates.filter((c) => c.id !== Number(id)));
}

export function getStudentsList() {
  if (!isBrowser()) return initialStudents;
  const data = localStorage.getItem(CUSTOM_STUDENTS_KEY);
  return data ? JSON.parse(data) : initialStudents;
}

export function saveStudentsList(list) {
  if (!isBrowser()) return;
  localStorage.setItem(CUSTOM_STUDENTS_KEY, JSON.stringify(list));
  notifyUpdate();
}

export function importDptFromData(list) {
  saveStudentsList(list);
}

// ========================================
// AUTHENTICATION & CREDENTIALS
// ========================================

export function getAuthCreds() {
  if (!isBrowser()) return defaultAuthCreds;
  const data = localStorage.getItem(AUTH_CREDS_KEY);
  if (!data) {
    localStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(defaultAuthCreds));
    return defaultAuthCreds;
  }
  const parsed = JSON.parse(data);
  return {
    superadmin: { ...defaultAuthCreds.superadmin, ...(parsed.superadmin || {}) },
    ketua: { ...defaultAuthCreds.ketua, ...(parsed.ketua || {}) },
  };
}

export function saveAuthCreds(creds) {
  if (!isBrowser()) return;
  const current = getAuthCreds();
  const updated = {
    superadmin: { ...current.superadmin, ...(creds.superadmin || {}) },
    ketua: { ...current.ketua, ...(creds.ketua || {}) },
  };
  localStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(updated));
  notifyUpdate();
}

export function getAuthSession() {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(AUTH_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function loginUser(username, password, selectedRole) {
  if (!isBrowser()) return { success: false, message: "Lingkungan browser tidak tersedia." };

  const creds = getAuthCreds();
  const u = (username || "").trim();
  const p = (password || "").trim();

  // Verifikasi Superadmin
  if (
    (!selectedRole || selectedRole === "superadmin") &&
    u === creds.superadmin.username &&
    p === creds.superadmin.password
  ) {
    const session = {
      username: creds.superadmin.username,
      name: creds.superadmin.name,
      role: "superadmin",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    notifyUpdate();
    return { success: true, session };
  }

  // Verifikasi Ketua OSIS
  if (
    (!selectedRole || selectedRole === "ketua") &&
    u === creds.ketua.username &&
    p === creds.ketua.password
  ) {
    const session = {
      username: creds.ketua.username,
      name: creds.ketua.name,
      role: "ketua",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    notifyUpdate();
    return { success: true, session };
  }

  return {
    success: false,
    message: "Username atau password yang Anda masukkan salah.",
  };
}

export function logoutUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  notifyUpdate();
}