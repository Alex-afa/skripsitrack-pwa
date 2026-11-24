// Frontend memanggil API buatan sendiri (Express) yang ada di folder api/ pada repo yang sama.
// "/api" = alamat relatif, jadi otomatis ikut domain tempat aplikasi dibuka (localhost / Vercel).
const API_BASE = "/api";
const EP = { bimbingan: "/bimbingan", dosen: "/dosen" };
const TOTAL_BAB = 5;
const STATUS = ["Menunggu", "Revisi", "ACC"];
// Isi data dirimu di sini (tampil di halaman Profile)
const PROFILE = { nama: "ISI NAMAMU", nim: "ISI NIM", kelas: "ISI KELAS" };
