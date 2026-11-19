const CACHE = "skripsitrack-v3";
const SHELL = ["./", "index.html", "style.css", "app.js", "config.js", "manifest.json", "icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Network dulu (selalu versi terbaru), cache dipakai saat offline
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })
    .catch(() => caches.match(e.request)));
});
