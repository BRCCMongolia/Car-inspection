// Офлайн ажиллагаа: аппын файлуудыг утсанд хадгална. Апп шинэчлэхдээ VERSION-ийг өөрчилнө.
const VERSION = 'v1.0.9';
const SHELL = 'shell-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/brcc.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google фонт: эхний удаа татаад хадгална
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('fonts-v1').then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }
      catch (err) { return new Response('', { status: 504 }); }
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Нүүр хуудас: сүлжээ байвал шинэ хувилбар (4 сек хүлээнэ), үгүй бол хадгалсан хувь
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
        if (res.ok) cache.put('index.html', res.clone());
        return res;
      } catch (err) {
        return (await cache.match('index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); }
    return res;
  })));
});
