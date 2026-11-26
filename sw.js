const CACHE_NAME = 'drugdaily-static-v1';
const PRECACHE = [
  './',
  './index.html',
  './script.js',
  './style.css',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    self.clients.claim();
  })());
});

function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('.googleusercontent.com')) {
    return false;
  }
  if (url.origin !== self.location.origin) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('.googleusercontent.com')) {
    return; // never intercept Apps Script; always go to network
  }
  if (!shouldHandle(request)) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
