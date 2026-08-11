export default function BoothWaiting() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#F8F7FF]">
      <div className="text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <span className="text-3xl font-bold text-violet-600">
            01
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Bilik 01 Siap
        </h1>

        <p className="mt-3 text-slate-500">
          Menunggu petugas memulai sesi pemilih berikutnya.
        </p>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />

          <span className="text-sm font-semibold text-violet-600">
            Menunggu Sesi
          </span>
        </div>

      </div>
    </main>
  );
}