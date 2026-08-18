# Spesifikasi & Arsitektur Sistem E-Voting OSIS SMK Al Amanah

Dokumen ini berisi spesifikasi sistem E-Voting OSIS berdasarkan fungsionalitas Front-End yang sudah ada saat ini, serta rencana pengembangan sistem (termasuk Backend) untuk menjadikan aplikasi ini sebagai sistem yang utuh, aman, dan bisa diakses secara sinkron antar perangkat.

---

## 1. Daftar Peran (Role) & Tupoksi

Berikut adalah daftar peran yang terlibat dalam sistem E-Voting OSIS yang direncanakan:

### 🌟 1. Superadmin (Pembina OSIS / Tim IT)
Peran dengan hak akses tertinggi dalam sistem.
*   **Tupoksi & Fitur:**
    *   Mengatur Manajemen Tahun Ajaran (Academic Year).
    *   Menetapkan identitas/akun **Ketua OSIS Saat Ini (Demisioner)** yang akan bertanggung jawab atas pelaksanaan pemilu.
    *   **Manajemen Panitia:** Membuatkan akun untuk seluruh Panitia Event dan menetapkan peran mereka (menentukan siapa yang jadi Registrator, Caller, atau Saksi).
    *   **Manajemen Bilik:** Bisa menambah atau mengurangi jumlah Bilik Suara (Bilik 1, 2, 3, 4, dst) secara dinamis sesuai kebutuhan di lapangan.
    *   *System Override*: Mereset data, membersihkan database dari uji coba (dummy data), dan mengontrol akses utama jika terjadi kendala teknis.
    *   Import DPT (Daftar Pemilih Tetap) dari file Excel/CSV.
    *   Input data Master Paslon (Nama Ketua/Wakil, Visi, Misi, Program Kerja, dan Foto).

### 👑 2. Ketua OSIS Saat Ini (Penyelenggara)
Ketua OSIS yang sedang menjabat dan bertindak sebagai penanggung jawab acara pemilihan.
*   **Tupoksi & Fitur:**
    *   **Manajemen Event (Jadwal):** Mengatur kapan tepatnya event E-Voting dibuka dan ditutup.
    *   **Otorisasi Penghitungan Suara:** Hasil perolehan suara *tidak akan dihitung/ditampilkan* secara otomatis. Ketua OSIS (atau Ketua Kelas) harus menekan tombol aksi (click action) seperti "Mulai Perhitungan / Tampilkan Hasil" agar hasil voting direkapitulasi dan bisa dilihat oleh Saksi.
    *   Mengawasi seluruh panitia dan memiliki akses untuk melihat kesiapan Bilik dan Antrean.

### 📝 3. Registrator Admin (Meja Pendaftaran)
*   **Tupoksi & Fitur:**
    *   Menerima pemilih (siswa) yang datang ke TPS.
    *   Mencocokkan wajah dan Kartu Pelajar dengan data DPT di dalam sistem.
    *   Memasukkan pemilih yang valid ke dalam **Sistem Antrean (Queue)** aplikasi.

### 🗣️ 4. Caller Admin (Meja Pemanggil)
*   **Tupoksi & Fitur:**
    *   Memantau daftar siswa yang ada di antrean (yang sudah di-input Registrator).
    *   Memantau status Bilik Suara (Bilik 1, 2, 3) apakah sedang kosong atau sedang digunakan.
    *   Memanggil siswa dari antrean dan "mengirimkan" akses memilih (assign) ke bilik yang kosong secara sistem.

### 🗳️ 5. Pemilih / Siswa (Bilik Suara)
*   **Tupoksi & Fitur:**
    *   Membaca Visi Misi dan Program Kerja Paslon di layar bilik.
    *   Melakukan pemungutan suara dengan menekan tombol Paslon pilihan.
    *   *Catatan:* Layar bilik hanya akan terbuka jika Caller Admin sudah melempar akses ke bilik tersebut.

### 📊 6. Saksi / KPU OSIS (Pemantau Hasil)
*   **Tupoksi & Fitur:**
    *   Memantau **Live Count** (Rekapitulasi Suara). Namun, grafik perolehan suara *hanya akan muncul* setelah Ketua OSIS mengaktifkan kalkulasi hasil.
    *   Melihat log UUID masuk untuk memastikan keabsahan suara (tidak ada kecurangan ganda).

---

## 2. Fitur "Event Countdown" (Masa Tunggu)

Sesuai kebutuhan, event E-Voting tidak boleh bisa diakses jika belum dibuka secara resmi. 
*   **Logika Sistem:** 
    Selama **Ketua OSIS Saat Ini** belum menekan tombol "Start Event" atau waktu yang dijadwalkan belum tiba, maka **seluruh pengguna (User/Siswa)** yang membuka website/domain aplikasi (kecuali Admin/Superadmin yang sudah login) akan **dialihkan ke halaman Countdown (Hitung Mundur)**.
*   **Tampilan Halaman Countdown:**
    *   Pesan bahwa "Pemilihan Ketua OSIS SMK Al Amanah Belum Dimulai".
    *   Menampilkan *Timer Countdown* (Hari, Jam, Menit, Detik) menuju waktu pembukaan.
    *   Mencegah akses curi start ke API atau halaman Bilik.

---

## 3. Kebutuhan Transisi Infrastruktur (Frontend ke Full-Stack)

Aplikasi yang ada saat ini (`fe-suara`) baru berupa fondasi antarmuka (Front-End) yang menggunakan `localStorage` sebagai tempat menyimpan data sementara. 

Agar fitur Role, Countdown, dan Sinkronisasi Data (seperti dari Meja Pendaftaran ke Meja Pemanggil ke Bilik) bisa berjalan di perangkat yang berbeda-beda secara online, sistem ini **harus dilengkapi dengan Backend & Database**.

### Keuntungan menggunakan Backend (Database Asli):
1.  **Multi-Device Sinkron (Real-time):** Registrator pakai HP, Caller pakai Laptop, dan Bilik pakai Tablet/iPad bisa saling terhubung via jaringan WiFi/Internet tanpa *delay*.
2.  **Sistem Keamanan Login:** Halaman Superadmin, Ketua OSIS, Caller, dan Live Count akan dilindungi oleh sistem Login (Username & Password), sehingga siswa biasa tidak bisa mengaksesnya sembarangan.
3.  **Integritas Data:** Data hasil voting akan masuk ke database server yang aman dan tersimpan permanen (tidak hilang saat browser ditutup / ter-clear cache).
4.  **Dinamis:** Data Paslon, DPT, dan Jadwal Event tidak perlu di-*hardcode* lagi ke dalam *source code*, melainkan bisa diganti kapan saja oleh Superadmin lewat Dashboard.
