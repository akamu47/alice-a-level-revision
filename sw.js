// Service worker — network-first, version-stamped cache.
// Every deploy bumps CACHE_VERSION so Alice always gets the latest content.
const CACHE_VERSION = '20260503184446';
const CACHE_NAME = 'alice-revision-' + CACHE_VERSION;

// Files we want available offline (best-effort)
const PRECACHE_URLS = [
  './',
  './index.html',
  './subjects/english.html',
  './subjects/politics.html',
  './subjects/art.html',
];

self.addEventListener('install', (event) => {
  // Activate this SW immediately on install
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
  );
});

self.addEventListener('activate', (event) => {
  // Delete any cache that doesn't match the current version
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('alice-revision-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first: try the network, fall back to cache. This guarantees
  // Alice always sees the freshest version when online.
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache same-origin successful responses
        if (res && res.status === 200 && new URL(req.url).origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => null);
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
