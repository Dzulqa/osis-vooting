// Seeds the first superadmin and, outside production, a REHEARSAL election with sample data.
// Idempotent: safe to run more than once.
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

const WEAK_PASSWORDS = new Set(["", "admin", "admin123", "password", "changeme", "ChangeMe-Local-123"]);

async function seedSuperadmin() {
  const username = process.env.SEED_SUPERADMIN_USERNAME || "superadmin";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "";

  if (isProd && (password.length < 12 || WEAK_PASSWORDS.has(password))) {
    throw new Error("SEED_SUPERADMIN_PASSWORD must be set to a strong value (>= 12 chars) in production.");
  }
  if (!password) {
    throw new Error("SEED_SUPERADMIN_PASSWORD is empty. Set it in .env.local before seeding.");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`superadmin "${username}" already exists, leaving it untouched`);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hash(password),
      name: "Pembina OSIS / Tim IT",
      isSuperadmin: true,
      mustChangePassword: true,
    },
  });
  console.log(`created superadmin "${username}" (must change password on first login)`);
  return user;
}

// ---------------------------------------------------------------- dev sample data

const sampleCandidates = [
  {
    number: 1,
    chairName: "M. Azka Dimaputra",
    viceName: "Fara Saravi",
    slogan: "Bersama kita bisa, bersama kita juara.",
    photoPath: "/candidates/paslon-01.png",
  },
  {
    number: 2,
    chairName: "Fatimah Azahra",
    viceName: "Putri Aulia Zahra",
    slogan: "Muda, kreatif, solutif, siap menginspirasi.",
    photoPath: "/candidates/paslon-02.png",
  },
  {
    number: 3,
    chairName: "Khanza Inaya",
    viceName: "Fathir Nuraqli Permana",
    slogan: "Bergerak bersama, OSIS luar biasa.",
    photoPath: "/candidates/paslon-03.png",
  },
];

const sampleStudents = [
  ["001", "Ahmad Hilbram", "XII RPL 1"],
  ["002", "Andi Saputra", "XII RPL 1"],
  ["003", "Budi Santoso", "XI TKJ 1"],
  ["004", "Citra Lestari", "XI TKJ 1"],
  ["005", "Dewi Anggraini", "X AKL 1"],
  ["006", "Eka Prasetyo", "X AKL 1"],
  ["007", "Fajar Nugroho", "X AKL 1"],
  ["008", "Gita Permata", "XII RPL 1"],
];

const sampleStaff = [
  { username: "ketua", name: "Ketua OSIS Saat Ini", role: "KETUA" },
  { username: "registrator1", name: "Registrator 1", role: "REGISTRATOR" },
  { username: "caller1", name: "Caller 1", role: "CALLER" },
  { username: "saksi1", name: "Saksi 1", role: "SAKSI" },
];

async function seedDevElection(superadmin) {
  const existing = await prisma.election.findFirst({ where: { currentFlag: 1 } });
  if (existing) {
    console.log(`current election "${existing.name}" already exists, skipping sample data`);
    return;
  }

  const election = await prisma.election.create({
    data: {
      name: "Pemilihan Ketua OSIS 2026/2027 (Latihan)",
      academicYearLabel: "2026/2027",
      kind: "REHEARSAL",
      currentFlag: 1,
      createdBy: superadmin.id,
      ketuaName: "Ahmad Hilbram Dzulqa",
      ketuaNis: "001",
      ketuaClass: "XII RPL 1",
      ketuaTitle: "Ketua OSIS Saat Ini (Demisioner)",
    },
  });

  for (const c of sampleCandidates) {
    await prisma.candidate.create({
      data: {
        electionId: election.id,
        ...c,
        vision: "Mewujudkan OSIS yang aktif, kreatif, dan menjadi ruang aspirasi seluruh siswa.",
        missions: [
          "Meningkatkan partisipasi siswa dalam kegiatan sekolah.",
          "Membangun komunikasi yang terbuka antara OSIS dan siswa.",
          "Mengembangkan kegiatan yang kreatif dan bermanfaat.",
        ],
        programs: ["OSIS Berbagi", "Jumat Bersih", "Pekan Kreativitas Siswa"],
      },
    });
  }

  // Same shape as the e-raport /master/classrooms and /master/students items.
  const classNames = [...new Set(sampleStudents.map(([, , classroom]) => classroom))];
  await prisma.classroom.createMany({
    data: classNames.map((name, i) => ({
      electionId: election.id,
      sourceId: i + 1,
      name,
      yearName: "2026/2027",
      studentCount: sampleStudents.filter(([, , c]) => c === name).length,
    })),
  });

  await prisma.voter.createMany({
    data: sampleStudents.map(([nis, name, classroom]) => ({
      electionId: election.id,
      type: "STUDENT",
      externalId: nis,
      nis,
      name,
      classroom,
      classroomId: classNames.indexOf(classroom) + 1,
      year: "2026/2027",
      source: "MANUAL",
    })),
  });

  for (let number = 1; number <= 3; number++) {
    await prisma.booth.create({ data: { electionId: election.id, number, label: `Bilik ${number}` } });
  }

  const staffPassword = await hash(process.env.SEED_SUPERADMIN_PASSWORD);
  for (const s of sampleStaff) {
    const user = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: { username: s.username, name: s.name, passwordHash: staffPassword, mustChangePassword: true },
    });
    await prisma.electionMember.create({ data: { electionId: election.id, userId: user.id, role: s.role } });
  }

  console.log(`created rehearsal election #${election.id} with ${sampleCandidates.length} candidates, ${sampleStudents.length} voters, 3 booths, ${sampleStaff.length} staff`);
}

async function main() {
  const superadmin = await seedSuperadmin();
  if (isProd) {
    console.log("production: skipping sample election");
  } else {
    await seedDevElection(superadmin);
  }
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
