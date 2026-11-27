-- Jalankan SEKALI di Neon SQL Editor jika tabel bimbingan sudah ada (menambah kolom version).
ALTER TABLE bimbingan ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
