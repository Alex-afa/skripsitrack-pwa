const $ = s => document.querySelector(s);
const app = $("#app"), title = $("#title"), back = $("#back");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr = x => Array.isArray(x) ? x : (x && x.data) || [];
const one = x => (x && x.data && !Array.isArray(x.data)) ? x.data : x;
const tgl = d => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

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
const tag = s => `<span class="tag ${esc(s)}">${esc(s)}</span>`;

const pages = {
  async home() {
    title.textContent = "Riwayat Bimbingan";
    const { b, d } = await getAll();
    b.sort((x, y) => String(y.tanggal).localeCompare(String(x.tanggal)));
    app.innerHTML = b.length ? b.map(x => `
      <a class="card" href="#/detail/${x.id}">
        <div><b>${esc(x.topik)}</b><br><small>${tgl(x.tanggal)} • Bab ${esc(x.bab)} • ${esc(dosenName(d, x.dosenId))}</small></div>
        ${tag(x.status)}</a>`).join("") : `<p class="msg">Belum ada catatan bimbingan.</p>`;
  },
  async detail(id) {
    title.textContent = "Detail Bimbingan";
    const [x, dd] = await Promise.all([api(`${EP.bimbingan}/${id}`).then(one), api(EP.dosen)]);
    app.innerHTML = `<div class="box">
      <h2>${esc(x.topik)}</h2>${tag(x.status)}
      <p>Dosen: <b>${esc(dosenName(arr(dd), x.dosenId))}</b></p>
      <p>Tanggal: <b>${tgl(x.tanggal)}</b></p>
      <p>Bab: <b>${esc(x.bab)}</b></p>
      <p>Catatan / revisi:<br>${esc(x.catatan || "-")}</p>
      <label>Ubah status</label>
      <select id="st">${STATUS.map(s => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button class="btn" id="upd">Simpan Status</button>
      <button class="btn red" id="del">Hapus</button></div>`;
    $("#upd").onclick = async () => {
      await api(`${EP.bimbingan}/${id}`, { method: "PUT", body: JSON.stringify({ ...x, status: $("#st").value }) });
      alert("Status diperbarui"); pages.detail(id);
    };
    $("#del").onclick = async () => {
      if (!confirm("Hapus catatan ini?")) return;
      await api(`${EP.bimbingan}/${id}`, { method: "DELETE" });
      location.hash = "#/";
    };
  },
  async dosen() {
    title.textContent = "Dosen Pembimbing";
    const { b, d } = await getAll();
    app.innerHTML = d.map(x => `
      <a class="card" href="#/dosen/${x.id}"><div><b>${esc(x.nama)}</b><br><small>${esc(x.peran)} • ${esc(x.bidang)}</small></div>
      <small>${b.filter(y => y.dosenId == x.id).length}x</small></a>`).join("") || `<p class="msg">Belum ada dosen.</p>`;
  },
  async dosenDetail(id) {
    const { b, d } = await getAll();
    const x = d.find(y => y.id == id) || {};
    title.textContent = "Profil Dosen";
    const list = b.filter(y => y.dosenId == id).sort((p, q) => String(q.tanggal).localeCompare(String(p.tanggal)));
    app.innerHTML = `<div class="box"><h2>${esc(x.nama)}</h2><p>${esc(x.peran)}<br>Bidang: ${esc(x.bidang)}<br>Email: ${esc(x.email || "-")}</p></div>
      <h3>Riwayat bimbingan (${list.length})</h3>` +
      (list.map(y => `<a class="card" href="#/detail/${y.id}"><div><b>${esc(y.topik)}</b><br><small>${tgl(y.tanggal)} • Bab ${esc(y.bab)}</small></div>${tag(y.status)}</a>`).join("") || `<p class="msg">Belum ada bimbingan.</p>`);
  },
  async tambah() {
    title.textContent = "Tambah Bimbingan";
    const d = arr(await api(EP.dosen));
    app.innerHTML = `<div class="box"><form id="f">
      <label>Topik bimbingan</label><input name="topik" required placeholder="Revisi latar belakang">
      <label>Dosen</label><select name="dosenId">${d.map(x => `<option value="${x.id}">${esc(x.nama)}</option>`).join("")}</select>
      <label>Bab</label><select name="bab">${Array.from({ length: TOTAL_BAB }, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
      <label>Tanggal</label><input name="tanggal" type="date" required value="${new Date().toISOString().slice(0, 10)}">
      <label>Status</label><select name="status">${STATUS.map(s => `<option>${s}</option>`).join("")}</select>
      <label>Catatan / revisi</label><textarea name="catatan" rows="3"></textarea>
      <button class="btn">Simpan</button></form></div>`;
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
    title.textContent = "Progres Skripsi";
    const { b } = await getAll();
    const acc = b.filter(x => x.status === "ACC").map(x => Number(x.bab));
    const babAcc = new Set(acc).size;
    const pct = Math.round(babAcc / TOTAL_BAB * 100);
    const cnt = s => b.filter(x => x.status === s).length;
    app.innerHTML = `<div class="box"><small>Progres bab ter-ACC</small><div class="big">${pct}%</div>
      <div class="track"><div class="bar" style="width:${pct}%"></div></div><small>${babAcc} dari ${TOTAL_BAB} bab</small></div>
      <div class="box"><b>Total bimbingan: ${b.length}</b><p>${tag("Menunggu")} ${cnt("Menunggu")} &nbsp; ${tag("Revisi")} ${cnt("Revisi")} &nbsp; ${tag("ACC")} ${cnt("ACC")}</p></div>` +
      Array.from({ length: TOTAL_BAB }, (_, i) => {
        const l = b.filter(x => Number(x.bab) === i + 1);
        const s = l.some(x => x.status === "ACC") ? "ACC" : l.length ? l.sort((p, q) => String(q.tanggal).localeCompare(String(p.tanggal)))[0].status : "Belum";
        return `<div class="card"><span>Bab ${i + 1}</span>${s === "Belum" ? "<small>Belum mulai</small>" : tag(s)}</div>`;
      }).join("");
  },
  profile() {
    title.textContent = "Profile";
    app.innerHTML = `<div class="box" style="text-align:center">
      <img src="icon.svg" width="80" alt="logo"><h2>SkripsiTrack PWA</h2>
      <p>Pencatat Progres Bimbingan Skripsi</p><small>Versi 1.0</small></div>
      <div class="box"><b>Pembuat</b><p>Nama: Alexis Pratama Bahar<br>NIM: 21120124120013<br>Praktikum PPB Ganjil 2026</p>
      <b>Teknologi</b><p>HTML, CSS, JavaScript, Service Worker, REST API</p></div>`;
  }
};

async function route() {
  const [, r = "", id] = location.hash.replace("#", "").split("/");
  const name = r === "" ? "home" : r;
  const nav = name === "detail" ? "home" : name;
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.dataset.r === nav));
  back.hidden = !id;
  app.innerHTML = `<p class="msg">Memuat...</p>`;
  try {
    if (name === "detail") await pages.detail(id);
    else if (name === "dosen" && id) await pages.dosenDetail(id);
    else await (pages[name] || pages.home)();
  } catch (e) {
    app.innerHTML = `<p class="msg">Gagal memuat data (${esc(e.message)}).<br>Cek koneksi/API_BASE di config.js.</p>`;
  }
}
back.onclick = () => history.back();
addEventListener("hashchange", route);
route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
