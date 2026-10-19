import { NextResponse } from "next/server";

const DEFAULT_API_URL = "https://sinar.smkalamanah.sch.id/api/service";
const DEFAULT_API_KEY = "NTUJ9X720O3YFoHY5pzUV6nr9DpVMi6nkaOxHXHv";
const DEFAULT_API_SECRET = "eTHcGkHPGoWKBNcGh4rOO8H9blTdtQj5SeoOteGDtnKngwyExG7RS2XDYUWY";

// Memory cache
let cachedToken = null;
let tokenExpiresAt = 0;
let cachedPayload = null;
let cachedPayloadExpiresAt = 0;

async function getAccessToken(apiUrl, apiKey, apiSecret) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const tokenRes = await fetch(`${apiUrl}/auth/token`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
    },
    cache: "no-store",
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.success || !tokenData.data?.access_token) {
    throw new Error(tokenData.message || "Gagal mendapatkan token autentikasi API Sinar");
  }

  cachedToken = tokenData.data.access_token;
  tokenExpiresAt = now + (tokenData.data.expires_in || 86400) * 1000;
  return cachedToken;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const now = Date.now();

    // Gunakan cache payload jika masih valid (5 menit) kecuali dipaksa refresh
    if (!forceRefresh && cachedPayload && now < cachedPayloadExpiresAt) {
      return NextResponse.json({
        ...cachedPayload,
        fromCache: true,
      });
    }

    const apiUrl = process.env.SCHOOL_API_URL || DEFAULT_API_URL;
    const apiKey = process.env.SCHOOL_API_KEY || DEFAULT_API_KEY;
    const apiSecret = process.env.SCHOOL_API_SECRET || DEFAULT_API_SECRET;

    const token = await getAccessToken(apiUrl, apiKey, apiSecret);

    // 1. Fetch Teachers & Page 1 of Students in parallel
    const [teachersRes, studentPage1Res] = await Promise.all([
      fetch(`${apiUrl}/master/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${apiUrl}/master/students?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const [teachersData, studentPage1Data] = await Promise.all([
      teachersRes.json(),
      studentPage1Res.json(),
    ]);

    // 2. Map & Filter Teachers (hanya status aktif: active === true || active === 1)
    const rawTeachers = teachersData.data || [];
    const activeTeachers = rawTeachers
      .filter((t) => t.active === true || t.active === 1 || t.active === "1")
      .map((t) => ({
        id: t.code || `guru-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
        nis: t.code || "-", // Kode guru dipakai di slot identitas/NIS
        nama: t.last_study ? `${t.name}, ${t.last_study}` : t.name,
        kelas: "Guru",
        gender: t.gender || "-",
        type: "guru",
        email: t.email || "",
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));

    // 3. Fetch remaining pages of students if any
    const lastPage = studentPage1Data.meta?.last_page || 1;
    const remainingPromises = [];
    for (let p = 2; p <= lastPage; p++) {
      remainingPromises.push(
        fetch(`${apiUrl}/master/students?page=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).then((r) => r.json())
      );
    }

    const remainingPages = await Promise.all(remainingPromises);
    const allRawStudents = [
      ...(studentPage1Data.data || []),
      ...remainingPages.flatMap((r) => r.data || []),
    ];

    // 4. Filter & Map Students (hanya status aktif: active === 1 / active === true dan belum lulus)
    const activeStudents = allRawStudents
      .filter(
        (s) =>
          (s.active === 1 || s.active === true || s.active === "1") &&
          !s.graduated
      )
      .map((s) => ({
        id: String(s.nis),
        nis: String(s.nis),
        nisn: s.nisn || "",
        nama: s.name,
        kelas: s.classroom,
        gender: s.gender || "-",
        level: s.level,
        type: "siswa",
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));

    // 5. Unique Classes (diurutkan logis: 10, 11, 12 lalu nama jurusan)
    const rawClasses = [...new Set(activeStudents.map((s) => s.kelas))].filter(Boolean);
    const classes = rawClasses.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const payload = {
      success: true,
      students: activeStudents,
      teachers: activeTeachers,
      classes,
      stats: {
        totalStudents: activeStudents.length,
        totalTeachers: activeTeachers.length,
        totalClasses: classes.length,
      },
      fetchedAt: new Date().toISOString(),
    };

    // Cache selama 5 menit
    cachedPayload = payload;
    cachedPayloadExpiresAt = now + 5 * 60 * 1000;

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching school voters:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memproses data pemilih sekolah",
      },
      { status: 500 }
    );
  }
}
