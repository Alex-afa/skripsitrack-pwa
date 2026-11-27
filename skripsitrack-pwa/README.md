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
| PUT | /api/bimbingan/:id | Ubah bimbingan (kirim `version`; versi tidak cocok -> **409 Conflict**) |
| DELETE | /api/bimbingan/:id?version=N | Hapus bimbingan (versi tidak cocok -> **409 Conflict**) |
| GET/POST | /api/dosen | Daftar / tambah dosen |
| GET/PUT/DELETE | /api/dosen/:id | Detail / ubah / hapus dosen |

## Konflik edit antar tab (HTTP 409)
Tabel `bimbingan` punya kolom `version` yang naik 1 setiap kali data diubah. Saat mengubah status, klien mengirim versi yang sedang dilihatnya.
Jika di database sudah berbeda (data sudah diubah di tab/perangkat lain), server membalas **409 Conflict** beserta data terbaru, lalu aplikasi menyinkronkan tampilan dan memberi tahu pengguna. Jika data sudah dihapus, server membalas 404.

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
