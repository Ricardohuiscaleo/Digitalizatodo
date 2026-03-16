const CACHE_NAME = 'digitaliza-cache-v2';
const urlsToCache = [
  '/manifest.json',
  '/icon.webp',
  '/DLogo-v2.webp'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // NEVER cache API calls — always go to network
  if (url.pathname.startsWith('/api') || url.hostname !== self.location.hostname) {
    return;
  }

  // Static assets only: cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
