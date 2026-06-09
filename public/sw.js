// Bump this version on any caching-strategy change to purge old caches.
const CACHE = 'wc2026-v2';
const SHELL = ['/', '/schedule', '/flights', '/hotels', '/transport'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

const putInCache = (request, response) => {
  if (response.ok) {
    const clone = response.clone();
    caches.open(CACHE).then((c) => c.put(request, clone));
  }
  return response;
};

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Only GET is cacheable; let the browser handle POST/PUT/etc. directly.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Network-first for API calls + cross-origin so data stays fresh.
  if (url.pathname.startsWith('/api') || url.hostname !== self.location.hostname) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Network-first for page navigations (HTML). This is the important one:
  // it means a new deploy shows up immediately instead of being masked by a
  // stale cached document. Falls back to the cached shell only when offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => putInCache(request, res))
        .catch(() => caches.match(request).then((c) => c ?? caches.match('/'))),
    );
    return;
  }

  // Cache-first for static, content-hashed assets (JS/CSS/images). Their URLs
  // change per build, so a cached hit is always the right version.
  e.respondWith(
    caches
      .match(request)
      .then((cached) => cached ?? fetch(request).then((res) => putInCache(request, res))),
  );
});
