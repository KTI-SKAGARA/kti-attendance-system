# KTI SKAGARA — Sistem Absensi & Kas Rutin

Aplikasi Web Full-Stack berbasis **Next.js (App Router)**, **TypeScript**, dan **Tailwind CSS** untuk manajemen absensi dan kas rutin organisasi **KTI SMK Negeri 3 Jepara (SKAGARA)**. Database terhubung langsung dengan **Google Sheets API**.

---

## 🔒 Fitur Autentikasi & Keamanan Admin
- **Protected Routes**: Hanya pengguna berwewenang (Admin) yang dapat mengakses Dashboard & Form Input.
- **Default Password**: `ktiskagara2026`
- **Kustomisasi Password**: Set variabel lingkungan `ADMIN_PASSWORD` di Vercel atau `.env.local`.

---

## 📊 Fitur Utama
1. **Dashboard & Analisis Statistik**:
   - Persentase Tingkat Kehadiran Organisasi.
   - Total Kas Terkumpul & Rata-rata per catatan.
   - Grafik distribusi status (Hadir, Sakit, Izin, Alfa).
   - Rekap total kas terkumpul per kelas di SKAGARA.
   - **Export CSV**: Mengunduh rekapitulasi data dalam format file CSV sekali klik.
2. **Filter Terpisah (Angkatan & Kelas)**:
   - Filter **Angkatan X / XI / XII**.
   - Filter **Kelas Resmi SKAGARA** (`AKL 1-4`, `MP 1-2`, `DKV 1-2`, `TKJ 1-2`, `PSPT`, `PM 1-2`).
   - Filter Bulan & Pencarian Nama Siswa.
3. **Form Input Otomatis**:
   - **FULL KAPITAL**: Format nama siswa otomatis diubah menjadi Kapital Full.
   - **Auto-Select Kelas**: Memilih siswa terdaftar otomatis memilih kelasnya.
   - **Auto Reset**: Form otomatis bersih (`blank`) begitu data sukses disimpan.
   - **Tanggal & Bulan_Tahun**: Dihasilkan otomatis oleh sistem.

---

## 🚀 Panduan Connect ke Google Sheets & Deploy ke Vercel

### Langkah 1: Buat Google Sheet
1. Buat Google Sheet baru.
2. Buat 3 Tab Sheet sesuai Angkatan:
   - `Kelas_X`
   - `Kelas_XI`
   - `Kelas_XII`
3. Tambahkan baris Header berikut di **baris 1** pada setiap tab:
   ```
   Tanggal | Nama | Kelas | Status_Absen | Nominal_Kas | Bulan_Tahun
   ```

### Langkah 2: Buat Google Service Account
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat Service Account baru, lalu **Create Key** (pilih format JSON).
3. Salin email Service Account (contoh: `my-sa@project.iam.gserviceaccount.com`).
4. Buka Google Sheet Anda -> Klik tombol **Share (Bagikan)** -> Masukkan email Service Account tersebut dengan hak akses **Editor**.

### Langkah 3: Set Environment Variables di Vercel
Saat mendeploy proyek ke **Vercel**:
1. Impor repositori GitHub Anda ke Vercel.
2. Tambahkan **Environment Variables**:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email Service Account Google Cloud Anda
   - `GOOGLE_PRIVATE_KEY`: Isinya private_key dari file JSON (pastikan tanda petik ganda diawal/akhir ada)
   - `GOOGLE_SPREADSHEET_ID`: ID file Google Sheet Anda (dapat diambil dari URL Google Sheet antara `/d/` dan `/edit`)
   - `ADMIN_PASSWORD`: Password admin untuk login (opsional, default: `ktiskagara2026`)

3. Klik **Deploy**!

---

## 💻 Jalankan Lokal (Development)

```bash
# Install dependensi
npm install

# Jalankan server development
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.
