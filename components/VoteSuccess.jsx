export default function VoteSuccess() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F7FF]">
      <div className="text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-4xl text-emerald-600">✓</span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Suara Berhasil Dikirim!
        </h1>

        <p className="mt-3 text-slate-500">
          Terima kasih telah menggunakan hak pilihmu.
        </p>

        <p className="mt-8 text-sm text-slate-400">
          Bilik akan disiapkan untuk pemilih berikutnya...
        </p>

      </div>
    </div>
  );
}