const CACHE_NAME = 'kavio-static-v1';
const DYNAMIC_CACHE_NAME = 'kavio-dynamic-v1';

const PRECACHE_ASSETS = [
  '/offline',
  '/favicon.svg',
];

// Install Event - Pre-cache the custom offline page and essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline fallback page shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Evict outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache store:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic and Static Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. log mutations, ledger postings, oauth checks)
  if (request.method !== 'GET') return;

  // 1. API Route Strategy: Network-First falling back to Dynamic Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If connection is dropped or offline, serve cached endpoint result
          return caches.match(request);
        })
    );
    return;
  }

  // 2. Static Assets Strategy: Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.includes('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        });

        // Serve instantly from cache if found, updating assets in the background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Document/Page navigations: Network-First, falling back to cached /offline page shell
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match('/offline') || Response.error();
    })
  );
});
