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