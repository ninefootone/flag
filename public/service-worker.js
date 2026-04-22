const CACHE_NAME = 'referee-app-cache-v0.4.50';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/style-dark.css',
  '/display.css',
  '/script.js',
  '/websocket.js',
  '/ui.js',
  '/game-logic.js',
  '/penalties.js',
  '/assets/favicon-96x96.png',
  '/assets/apple-touch-icon.png',
  '/teams.json',
  '/penalties.json'
];

// 1. Install Event: Cache all necessary assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Fetch Event: Serve cached assets, falling back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request);
      })
  );
});

// 3. Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});