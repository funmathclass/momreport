// Service worker: aset statis stale-while-revalidate (buka instan, update otomatis). Permintaan ke Google Apps Script TIDAK pernah di-cache.
const V = 'nr-v1.1', A = ['./', './index.html', './css/style.css', './js/config.js', './js/api.js', './js/app.js', './js/modul.js', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(A))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(r).then(h => { const n = fetch(r).then(x => { if (x.ok) c.put(r, x.clone()); return x; }).catch(() => h); return h || n; })));
});
