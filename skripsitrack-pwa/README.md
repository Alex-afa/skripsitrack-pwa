# SkripsiTrack PWA

Aplikasi pencatat progres bimbingan skripsi. Praktikum PPB Ganjil 2026 (platform: PWA).

**Arsitektur**

```
PWA (HTML/CSS/JS)  --fetch /api-->  Backend Express (folder api/)  -->  PostgreSQL (Neon)
```

- Frontend memanggil API buatan sendiri (`/api/...`), bukan langsung ke database.
- Backend (Express) yang membaca dan menulis ke PostgreSQL di Neon.
- `db/schema.sql` hanya untuk membuat tabel dan data awal (seed). Sumber data utama = Neon.

## Fitur
Riwayat bimbingan (list + detail), daftar dosen (list + detail), tambah/ubah status/hapus bimbingan, progres per bab, profile, bottom navigation, PWA installable + offline.

## Endpoint API
| Metode | Alamat | Fungsi |
|---|---|---|
| GET | /api/bimbingan | Daftar bimbingan |
| GET | /api/bimbingan/:id | Detail bimbingan |
| POST | /api/bimbingan | Tambah bimbingan |
| PUT | /api/bimbingan/:id | Ubah bimbingan (mis. status) |
| DELETE | /api/bimbingan/:id | Hapus bimbingan |
| GET/POST | /api/dosen | Daftar / tambah dosen |
| GET/PUT/DELETE | /api/dosen/:id | Detail / ubah / hapus dosen |

## Menjalankan di komputer
1. `npm install`
2. Salin `.env.example` menjadi `.env`, isi `DATABASE_URL` dengan connection string Neon.
3. Jalankan `db/schema.sql` di Neon (SQL Editor) satu kali.
4. `npm start`, lalu buka http://localhost:3000

## Deploy (Vercel)
1. Import repository ini di Vercel (Framework: Other).
2. Environment Variables: `DATABASE_URL` = connection string Neon.
3. Deploy. Frontend dan API berjalan di domain yang sama.

## Teknologi
HTML, CSS, JavaScript, Service Worker, Express, PostgreSQL (Neon), Vercel.
