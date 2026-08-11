const QUEUE_KEY = "osis_queue";
const BOOTHS_KEY = "osis_booths";
const VOTED_KEY = "osis_voted";
const VOTES_KEY = "osis_votes";

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
// RESET SIMULASI
// ========================================

export function resetVotingSimulation() {
  if (!isBrowser()) return;

  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(BOOTHS_KEY);
  localStorage.removeItem(VOTED_KEY);
  localStorage.removeItem(VOTES_KEY);

  notifyUpdate();
}