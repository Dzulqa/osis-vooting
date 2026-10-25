"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStudentsList,
  saveStudentsList,
  getTeachersList,
  saveTeachersList,
  isCurrentElectionLatest,
} from "@/lib/votingStorage";

// Data master (tahun ajaran, kelas, siswa, guru) hanya boleh berasal dari Sinar.
// Hook ini mengambilnya lewat /api/school/voters (kredensial Sinar tetap di server).
export default function useSinarData() {
  const [students, setStudents] = useState(() => []);
  const [teachers, setTeachers] = useState(() => []);
  const [years, setYears] = useState(() => []);
  const [classes, setClasses] = useState(() => []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/school/voters${force ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Gagal mengambil data Sinar");

      setStudents(data.students);
      setTeachers(data.teachers);
      setYears(data.years || []);
      setClasses(data.classes || []);
      // Cache untuk halaman lain (registrasi, bilik) yang membaca dari penyimpanan lokal.
      // Pemilihan arsip tetap memakai DPT saat pemilihan itu berlangsung.
      if (isCurrentElectionLatest()) saveStudentsList(data.students);
      saveTeachersList(data.teachers);
    } catch (err) {
      setError(err.message || "Gagal menghubungi Sinar");
      // Pakai cache terakhir bila ada, supaya pilihan tidak kosong saat koneksi putus
      setStudents((cur) => (cur.length ? cur : getStudentsList()));
      setTeachers((cur) => (cur.length ? cur : getTeachersList()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => refresh(false));
  }, [refresh]);

  return { students, teachers, years, classes, loading, error, refresh };
}
