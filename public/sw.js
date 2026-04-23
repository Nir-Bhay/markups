// Service Worker for Markdown Live Preview
const APP_CACHE_PREFIX = 'markdown-live-preview-app';
const APP_CACHE_VERSION = 'v2';
const APP_CACHE_NAME = `${APP_CACHE_PREFIX}-${APP_CACHE_VERSION}`;
const STATIC_ASSETS = ['/', '/index.html', '/favicon.png'];

const STATIC_ASSET_PATTERN = /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Precache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const staleCaches = cacheNames.filter(
        (name) => name.startsWith(APP_CACHE_PREFIX) && name !== APP_CACHE_NAME
      );

      return Promise.all(staleCaches.map((name) => caches.delete(name)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ensure navigations and app shell check network first.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets get instant cached responses with background refresh.
  if (STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default for same-origin GET requests.
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (isCacheable(networkResponse)) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    return cachedResponse || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (isCacheable(networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkPromise || Response.error();
}

function isCacheable(response) {
  return !!response && response.status === 200 && response.type === 'basic';
}
