// Ojek Kite Service Worker v3
const CACHE_NAME = 'ojek-kite-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — Network first, fallback ke cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Skip Firebase & external API
  if (e.request.url.includes('firestore.googleapis.com')) return;
  if (e.request.url.includes('firebase')) return;
  if (e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('nominatim')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cached = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cached));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
