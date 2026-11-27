// Backend SkripsiTrack: Express + PostgreSQL (Neon)
// Frontend memanggil API ini, API inilah yang membaca dan menulis ke database.
const express = require("express");
const { neon } = require("@neondatabase/serverless");

const app = express();
app.use(express.json());

// CORS (agar API juga bisa dipanggil dari domain lain bila perlu)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---- koneksi database (Neon) ----
let sql;
function query(text, params = []) {
  if (!process.env.DATABASE_URL) {
    const e = new Error("DATABASE_URL belum diatur (lihat .env.example / Environment Variables Vercel).");
    e.status = 500;
    throw e;
  }
  sql = sql || neon(process.env.DATABASE_URL);
  return sql.query(text, params);
}
const n = v => (v === undefined || v === "" ? null : v); // undefined -> NULL
const toId = v => (/^\d+$/.test(v) ? Number(v) : null);
const notFound = res => res.status(404).json({ message: "Data tidak ditemukan" });

// Dipanggil saat UPDATE/DELETE tidak mengenai baris apa pun:
// data masih ada -> versinya sudah berubah di tempat lain -> 409 Conflict (sertakan data terbaru)
// data sudah tidak ada -> 404
async function conflictOrNotFound(res, id) {
  const rows = await query(`SELECT ${B_COLS} FROM bimbingan WHERE id = $1`, [id]);
  if (!rows.length) return notFound(res);
  res.status(409).json({ message: "Konflik: data ini sudah diubah di tab/perangkat lain.", current: rows[0] });
}

// kolom bimbingan dalam format yang dipakai frontend (dosenId, tanggal YYYY-MM-DD)
const B_COLS = `id, topik, to_char(tanggal,'YYYY-MM-DD') AS tanggal, dosen_id AS "dosenId", bab, status, catatan, version`;

const api = express.Router();

api.get("/", (req, res) => res.json({ app: "SkripsiTrack API", database: "PostgreSQL (Neon)", resources: ["/api/dosen", "/api/bimbingan"] }));

// ===== DOSEN =====
api.get("/dosen", async (req, res) => res.json(await query("SELECT * FROM dosen ORDER BY id")));

api.get("/dosen/:id", async (req, res) => {
  const id = toId(req.params.id);
  const rows = id ? await query("SELECT * FROM dosen WHERE id = $1", [id]) : [];
  rows.length ? res.json(rows[0]) : notFound(res);
});

api.post("/dosen", async (req, res) => {
  const { nama, peran, bidang, email } = req.body;
  if (!nama) return res.status(400).json({ message: "nama wajib diisi" });
  const rows = await query("INSERT INTO dosen (nama, peran, bidang, email) VALUES ($1,$2,$3,$4) RETURNING *", [nama, n(peran), n(bidang), n(email)]);
  res.status(201).json(rows[0]);
});

api.put("/dosen/:id", async (req, res) => {
  const id = toId(req.params.id);
  const { nama, peran, bidang, email } = req.body;
  const rows = id ? await query(
    "UPDATE dosen SET nama=COALESCE($1,nama), peran=COALESCE($2,peran), bidang=COALESCE($3,bidang), email=COALESCE($4,email) WHERE id=$5 RETURNING *",
    [n(nama), n(peran), n(bidang), n(email), id]) : [];
  rows.length ? res.json(rows[0]) : notFound(res);
});

api.delete("/dosen/:id", async (req, res) => {
  const id = toId(req.params.id);
  const rows = id ? await query("DELETE FROM dosen WHERE id = $1 RETURNING id", [id]) : [];
  rows.length ? res.json({}) : notFound(res);
});

// ===== BIMBINGAN =====
api.get("/bimbingan", async (req, res) => res.json(await query(`SELECT ${B_COLS} FROM bimbingan ORDER BY id`)));

api.get("/bimbingan/:id", async (req, res) => {
  const id = toId(req.params.id);
  const rows = id ? await query(`SELECT ${B_COLS} FROM bimbingan WHERE id = $1`, [id]) : [];
  rows.length ? res.json(rows[0]) : notFound(res);
});

api.post("/bimbingan", async (req, res) => {
  const { topik, tanggal, dosenId, bab, status, catatan } = req.body;
  if (!topik || !tanggal || !bab) return res.status(400).json({ message: "topik, tanggal, dan bab wajib diisi" });
  const rows = await query(
    `INSERT INTO bimbingan (topik, tanggal, dosen_id, bab, status, catatan)
     VALUES ($1,$2,$3,$4,COALESCE($5,'Menunggu'),$6) RETURNING ${B_COLS}`,
    [topik, tanggal, n(dosenId), bab, n(status), n(catatan)]);
  res.status(201).json(rows[0]);
});

// Ubah bimbingan. Kirim "version" (versi yang sedang dilihat klien).
// Jika versi di database sudah berbeda -> 409 Conflict.
api.put("/bimbingan/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return notFound(res);
  const { topik, tanggal, dosenId, bab, status, catatan, version } = req.body;
  const rows = await query(
    `UPDATE bimbingan SET topik=COALESCE($1,topik), tanggal=COALESCE($2,tanggal), dosen_id=COALESCE($3,dosen_id),
       bab=COALESCE($4,bab), status=COALESCE($5,status), catatan=COALESCE($6,catatan), version = version + 1
     WHERE id=$7 AND ($8::int IS NULL OR version = $8::int) RETURNING ${B_COLS}`,
    [n(topik), n(tanggal), n(dosenId), n(bab), n(status), n(catatan), id, n(version)]);
  if (rows.length) return res.json(rows[0]);
  await conflictOrNotFound(res, id);
});

// Hapus bimbingan. Boleh menyertakan ?version=N; jika versi sudah berubah -> 409 Conflict.
api.delete("/bimbingan/:id", async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return notFound(res);
  const rows = await query("DELETE FROM bimbingan WHERE id = $1 AND ($2::int IS NULL OR version = $2::int) RETURNING id", [id, n(req.query.version)]);
  if (rows.length) return res.json({});
  await conflictOrNotFound(res, id);
});

app.use("/api", api);

// penanganan error (kesalahan input -> 400, lainnya -> 500)
app.use((err, req, res, next) => {
  const code = String(err.code || "");
  const status = err.status || (/^2[23]/.test(code) ? 400 : 500);
  res.status(status).json({ message: status === 400 ? "Data tidak valid: " + err.message : err.message || "Kesalahan server" });
});

module.exports = app;
