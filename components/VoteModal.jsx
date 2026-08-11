export default function VoteModal({ candidate, onClose, onConfirm, isSubmitting }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

        {/* Nomor Paslon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-600">
          {candidate.nomor}
        </div>

        {/* Judul */}
        <div className="mt-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Yakin dengan pilihanmu?
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Kamu akan memilih Paslon {candidate.nomor}
          </p>
        </div>

        {/* Kandidat */}
        <div className="mt-6 rounded-2xl bg-violet-50 p-4 text-center">
          <p className="font-bold text-slate-900">
            {candidate.ketua}
          </p>

          <p className="my-1 text-sm font-semibold text-violet-500">
            &
          </p>

          <p className="font-bold text-slate-900">
            {candidate.wakil}
          </p>
        </div>

        {/* Warning */}
        <p className="mt-5 text-center text-sm leading-6 text-slate-500">
          Pastikan pilihanmu sudah benar. Suara yang telah dikirim
          tidak dapat diubah kembali.
        </p>

        {/* Buttons */}
        <div className="mt-7 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 cursor-pointer rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim Suara..." : "Ya, Pilih"}
          </button>
        </div>

      </div>
    </div>
  );
}