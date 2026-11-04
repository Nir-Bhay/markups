// Service Worker for Markdown Live Preview
const APP_CACHE_PREFIX = 'markdown-live-preview-app';
const APP_CACHE_VERSION = 'v5';
const APP_CACHE_NAME = `${APP_CACHE_PREFIX}-${APP_CACHE_VERSION}`;
const STATIC_ASSETS = ['/', '/index.html', '/favicon.png'];

const STATIC_ASSET_PATTERN = /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then(async (cache) => {
      return (async () => {
        await cache.addAll(STATIC_ASSETS);
        // Initial scripts may finish loading before this worker controls the
        // page. Precache the compiled shell's local script/style/preload URLs,
        // otherwise the first offline reload has HTML but cannot boot JS.
        const shell = await cache.match('/');
        const html = await shell.text();
        const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
          .map(match => new URL(match[1], self.location.origin))
          .filter(url => url.origin === self.location.origin && /\.(?:js|css|woff2?)(?:$|\?)/i.test(url.pathname))
          .map(url => url.href);
        await cache.addAll([...new Set(assets)]);
        const manifestResponse = await fetch('/precache-manifest.json', { cache: 'no-cache' });
        if (!manifestResponse.ok) throw new Error('Offline asset manifest is unavailable.');
        const manifest = await manifestResponse.json();
        const compiledAssets = manifest.filter(path => typeof path === 'string' && path.startsWith('/assets/') && !path.includes('..'));
        await cache.addAll(compiledAssets);
      })().catch((err) => {
        console.warn('Precache failed for some assets:', err);
      });
    })
  );
  // Updates wait for existing editor tabs to close, or an explicit safe
  // activation request. Do not replace a worker underneath an active draft.
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
  // Authenticated/provider endpoints are never app-shell cache entries.
  if (url.pathname.startsWith('/api/')) return;

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
    // Static HTML may be served with Vary: Origin by the preview/CDN. A
    // worker precache fetch and a navigation send different Origin headers,
    // although they address the exact same public shell URL.
    const cachedResponse = await cache.match(request, { ignoreVary: request.mode === 'navigate' });
    return cachedResponse || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(APP_CACHE_NAME);
  const cachedResponse = await cache.match(request, { ignoreVary: true });

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (isCacheable(networkResponse)) {
        return cache.put(request, networkResponse.clone()).then(() => networkResponse);
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkPromise || Response.error();
}

function isCacheable(response) {
  return !!response && response.status === 200 && response.type === 'basic';
}
