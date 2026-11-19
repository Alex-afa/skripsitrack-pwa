const $ = s => document.querySelector(s);
const app = $("#app"), hero = $("#hero");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr = x => Array.isArray(x) ? x : (x && x.data) || [];
const one = x => (x && x.data && !Array.isArray(x.data)) ? x.data : x;
const tgl = d => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
const pad = n => String(n).padStart(2, "0");
const byDate = (p, q) => String(q.tanggal).localeCompare(String(p.tanggal));
const initials = n => String(n || "?").replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

async function api(path, opt = {}) {
  const r = await fetch(API_BASE + path, { headers: { "Content-Type": "application/json" }, ...opt });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.status === 204 ? null : r.json();
}
const getAll = async () => {
  const [b, d] = await Promise.all([api(EP.bimbingan), api(EP.dosen)]);
  return { b: arr(b), d: arr(d) };
};
const dosenName = (d, id) => (d.find(x => x.id == id) || {}).nama || "-";
const chip = s => `<span class="chip ${esc(s)}">${esc(s)}</span>`;
const babStatus = (b, i) => {
  const l = b.filter(x => Number(x.bab) === i);
  if (!l.length) return "Belum";
  return l.some(x => x.status === "ACC") ? "ACC" : l.sort(byDate)[0].status;
};
const tracker = b => `<div class="tracker">${Array.from({ length: TOTAL_BAB }, (_, i) =>
  `<div class="seg ${babStatus(b, i + 1)}"><small>Bab</small><b>${i + 1}</b></div>`).join("")}</div>`;
const sec = t => `<h2 class="sec"><span>${esc(t)}</span></h2>`;
const item = (x, d) => `<a class="item ${esc(x.status)}" href="#/detail/${x.id}">
  <div class="babno"><small>Bab</small><b>${esc(x.bab)}</b></div>
  <div class="ib"><h3>${esc(x.topik)}</h3><p>${tgl(x.tanggal)} · ${esc(dosenName(d, x.dosenId))}</p></div>${chip(x.status)}</a>`;
const ART = `<svg viewBox="0 0 400 110" width="100%" height="110" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2">
  <rect x="150" y="16" width="70" height="86" style="fill:var(--paper)"/><rect x="172" y="8" width="70" height="86" style="fill:var(--card)"/>
  <path d="M186 32h42M186 44h42M186 56h28"/><path d="M200 76l8 8 17-19" stroke="#0f7b4d" stroke-width="4"/></g>
  <path d="M20 102h360" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="5 5"/></svg>`;

function setHero({ title, sub, stats, back }) {
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  hero.className = "hero" + (stats ? " big" : "");
  hero.innerHTML = `<div class="top">${back ? `<button class="back" id="bk" aria-label="Kembali">←</button>` : `<span class="mark"><i></i><i></i><i></i></span>`}<span>${today}</span></div>
    <h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}
    ${stats ? `<div class="stats">${stats.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}`;
  if (back) $("#bk").onclick = () => history.back();
}

const pages = {
  async home() {
    const { b, d } = await getAll();
    b.sort(byDate);
    const acc = new Set(b.filter(x => x.status === "ACC").map(x => Number(x.bab))).size;
    setHero({ title: "SkripsiTrack", sub: "Catatan bimbingan dan progres skripsi, rapi di satu tempat.",
      stats: [[pad(b.length), "bimbingan"], [pad(d.length), "dosen"], [`${acc}/${TOTAL_BAB}`, "bab ACC"]] });
    const f = b[0];
    app.innerHTML = sec("Progres per bab") + tracker(b) + (f ? sec("Bimbingan terakhir") +
      `<a class="feat" href="#/detail/${f.id}"><div class="art">${ART}</div><div class="fb">${chip(f.status)}
        <h3>${esc(f.topik)}</h3><p>${esc(f.catatan || "Belum ada catatan revisi.")}</p><span class="more">Buka catatan</span></div></a>` +
      sec("Semua riwayat") + b.map(x => item(x, d)).join("")
      : `<p class="msg">Belum ada bimbingan. Ketuk Tambah untuk mencatat yang pertama.</p>`);
  },
  async detail(id) {
    const [x, dd] = await Promise.all([api(`${EP.bimbingan}/${id}`).then(one), api(EP.dosen)]);
    const d = arr(dd);
    setHero({ title: x.topik, sub: "Bimbingan dengan " + dosenName(d, x.dosenId), back: true });
    app.innerHTML = `<div class="box">${chip(x.status)}
      <dl class="kv"><dt>Dosen</dt><dd>${esc(dosenName(d, x.dosenId))}</dd><dt>Tanggal</dt><dd>${tgl(x.tanggal)}</dd><dt>Bab</dt><dd>Bab ${esc(x.bab)}</dd></dl>
      <b>Catatan revisi</b><div class="note">${esc(x.catatan || "Tidak ada catatan.")}</div></div>
      <div class="box"><label for="st" style="margin-top:0">Ubah status</label>
      <select id="st">${STATUS.map(s => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button class="btn" id="upd">Simpan status</button><button class="btn ghost" id="del">Hapus catatan</button></div>`;
    $("#upd").onclick = async () => {
      await api(`${EP.bimbingan}/${id}`, { method: "PUT", body: JSON.stringify({ ...x, status: $("#st").value }) });
      pages.detail(id);
    };
    $("#del").onclick = async () => {
      if (!confirm("Hapus catatan ini?")) return;
      await api(`${EP.bimbingan}/${id}`, { method: "DELETE" });
      location.hash = "#/";
    };
  },
  async dosen() {
    const { b, d } = await getAll();
    setHero({ title: "Dosen", sub: "Pembimbing skripsi dan riwayat bimbingannya." });
    app.innerHTML = d.map(x => `<a class="item" href="#/dosen/${x.id}"><div class="av">${esc(initials(x.nama))}</div>
      <div class="ib"><h3>${esc(x.nama)}</h3><p>${esc(x.peran)} · ${esc(x.bidang)}</p></div>
      <span class="cnt">${b.filter(y => y.dosenId == x.id).length}</span></a>`).join("") || `<p class="msg">Belum ada dosen.</p>`;
  },
  async dosenDetail(id) {
    const { b, d } = await getAll();
    const x = d.find(y => y.id == id) || {};
    const list = b.filter(y => y.dosenId == id).sort(byDate);
    setHero({ title: x.nama || "Dosen", sub: `${x.peran || ""} · ${x.bidang || ""}`, back: true });
    app.innerHTML = `<div class="box center"><div class="av lg">${esc(initials(x.nama))}</div><b>${esc(x.nama)}</b><br><span style="color:var(--mut)">${esc(x.email || "-")}</span></div>` +
      sec(`Riwayat bimbingan (${list.length})`) + (list.map(y => item(y, d)).join("") || `<p class="msg">Belum ada bimbingan dengan dosen ini.</p>`);
  },
  async tambah() {
    const d = arr(await api(EP.dosen));
    setHero({ title: "Catat bimbingan", sub: "Tulis hasil bimbingan selagi masih segar di ingatan." });
    app.innerHTML = `<div class="box"><form id="f">
      <label for="a" style="margin-top:0">Topik bimbingan</label><input id="a" name="topik" required placeholder="Contoh: Revisi latar belakang">
      <label for="b">Dosen</label><select id="b" name="dosenId">${d.map(x => `<option value="${esc(x.id)}">${esc(x.nama)}</option>`).join("")}</select>
      <label for="c">Bab</label><select id="c" name="bab">${Array.from({ length: TOTAL_BAB }, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
      <label for="e">Tanggal</label><input id="e" name="tanggal" type="date" required value="${new Date().toISOString().slice(0, 10)}">
      <label for="g">Status</label><select id="g" name="status">${STATUS.map(s => `<option>${s}</option>`).join("")}</select>
      <label for="h">Catatan revisi</label><textarea id="h" name="catatan" rows="3"></textarea>
      <button class="btn">Simpan bimbingan</button></form></div>`;
    $("#f").onsubmit = async e => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(e.target));
      v.bab = Number(v.bab);
      v.dosenId = isNaN(v.dosenId) ? v.dosenId : Number(v.dosenId);
      await api(EP.bimbingan, { method: "POST", body: JSON.stringify(v) });
      location.hash = "#/";
    };
  },
  async progres() {
    const { b } = await getAll();
    const acc = new Set(b.filter(x => x.status === "ACC").map(x => Number(x.bab))).size;
    const pct = Math.round(acc / TOTAL_BAB * 100);
    const cnt = s => b.filter(x => x.status === s).length;
    setHero({ title: "Progres", sub: "Seberapa jauh skripsimu sudah berjalan." });
    app.innerHTML = `<div class="box center"><svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${pct} persen">
      <circle class="rb" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" transform="rotate(-90 60 60)" style="stroke-dasharray:326.7;stroke-dashoffset:${(326.7 * (1 - pct / 100)).toFixed(1)}"/>
      <text x="60" y="69" text-anchor="middle">${pct}%</text></svg>
      <b>${acc} dari ${TOTAL_BAB} bab sudah ACC</b></div>` +
      sec("Per bab") + tracker(b) +
      sec("Ringkasan status") + `<div class="box"><div class="row"><span>Total bimbingan</span><b>${b.length}</b></div>
      <div class="row">${chip("Menunggu")}<b>${cnt("Menunggu")}</b></div><div class="row">${chip("Revisi")}<b>${cnt("Revisi")}</b></div><div class="row">${chip("ACC")}<b>${cnt("ACC")}</b></div></div>`;
  },
  profile() {
    setHero({ title: "Profile", sub: "Tentang aplikasi dan pembuatnya." });
    app.innerHTML = `<div class="box center"><div class="av lg">${esc(initials(PROFILE.nama))}</div><b style="font-size:18px">${esc(PROFILE.nama)}</b><br>
      <span style="color:var(--mut)">${esc(PROFILE.nim)} · ${esc(PROFILE.kelas)}</span></div>` +
      sec("Tentang aplikasi") + `<div class="box"><b>SkripsiTrack PWA</b> v1.0<p style="margin:6px 0 0;color:var(--mut)">Aplikasi untuk mencatat bimbingan skripsi, memantau status revisi, dan melihat progres tiap bab. Praktikum PPB Ganjil 2026.</p></div>` +
      sec("Teknologi") + `<div class="tags"><span>HTML</span><span>CSS</span><span>JavaScript</span><span>Service Worker</span><span>REST API</span></div>`;
  }
};

async function route() {
  const [, r = "", id] = location.hash.replace("#", "").split("/");
  const name = r === "" ? "home" : r;
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.dataset.r === (name === "detail" ? "home" : name)));
  app.innerHTML = `<p class="msg">Memuat...</p>`;
  window.scrollTo(0, 0);
  try {
    if (name === "detail") await pages.detail(id);
    else if (name === "dosen" && id) await pages.dosenDetail(id);
    else await (pages[name] || pages.home)();
  } catch (e) {
    setHero({ title: "Ups", sub: "Data belum bisa dimuat." });
    app.innerHTML = `<p class="msg">Gagal memuat data (${esc(e.message)}).<br>Pastikan API menyala dan API_BASE di config.js sudah benar.</p>`;
  }
}
addEventListener("hashchange", route);
route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
