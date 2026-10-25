import { redirect } from "next/navigation";

// Login bilik sekarang satu halaman dengan /login (tab "Bilik suara").
export default async function BoothLoginRedirect({ searchParams }) {
  const { booth } = await searchParams;
  redirect(booth ? `/login?mode=bilik&booth=${encodeURIComponent(booth)}` : "/login?mode=bilik");
}
