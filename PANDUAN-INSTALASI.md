# Panduan Instalasi — Notulensi Report

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**.
2. Ganti isi `Code.gs` dengan isi **Kode.gs** (nama file bebas). Buka ⚙ **Setelan Proyek** → centang *Show appsscript.json* → ganti isinya dengan **appsscript.json**.
3. Pilih fungsi `setupAppEnvironment` → ▶ Run (**sekali saja**) → izinkan akses. Log berisi tautan database; akun Anda otomatis menjadi Admin.
4. Buat **OAuth Client ID**: https://console.cloud.google.com → APIs & Services → Credentials → *Create credentials → OAuth client ID → Web application*. Pada *Authorized JavaScript origins* isi `https://USERNAME.github.io` (ganti USERNAME). Salin Client ID (berakhiran `.apps.googleusercontent.com`).
5. Buat **API key Gemini** di https://aistudio.google.com/apikey.
6. Apps Script → ⚙ Setelan Proyek → **Script Properties** → tambah `GOOGLE_CLIENT_ID` dan `GEMINI_API_KEY`. (Jangan taruh di kode/Sheets.) Nama model ada di `GEMINI_MODEL`; ganti bila model usang.
7. **Deploy → New deployment → Web app** · Execute as: **Me** · Who has access: **Anyone** → Deploy → salin URL **/exec**. Setiap mengubah kode, deploy ulang (*Manage deployments → Edit → New version*).
8. Tambah pengguna lain di sheet **Pengguna** (kolom: email, nama, peran `admin`/`peserta`, aktif `true`). Perubahan manual terbaca maksimal 10 menit kemudian.

## B. Frontend (GitHub Pages)
1. Ekstrak ZIP. Folder hasil ekstraksi **`notulensi-report`** adalah folder yang di-`git init` — di dalamnya harus langsung terlihat `index.html`, `css/`, `js/`.
2. Buka `js/config.js`, isi `GAS_URL` dengan URL /exec dan `NAMA_SEKOLAH`.
3. Buat repository **Public** di GitHub, lalu dari terminal di folder `notulensi-report`:
   ```
   dir        (Windows)  /  ls  (Mac/Linux)   ← pastikan index.html terlihat
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
4. GitHub → Settings → Pages → Branch **main** / folder **/(root)** → Save. Situs: `https://USERNAME.github.io/NAMA-REPO/`.
   Pastikan origin di langkah A4 sama dengan alamat `https://USERNAME.github.io`.

## C. Uji pertama
1. Login → buat rapat → **Ruang Rekam** → rekam **1–2 menit** → Selesai. Dalam beberapa menit status berubah *Menunggu Tinjauan*.
2. Tinjau → Terbitkan → PDF masuk Drive dan email terkirim ke peserta.
3. Bila transkripsi gagal pada audio WebM (Chrome), buka Executions di Apps Script untuk melihat pesan Gemini dan kabari saya.
