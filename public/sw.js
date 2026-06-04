// Service Worker lifecycle script for installable PWA check compliance
const CACHE_NAME = "kavio-cache-v1";
const ASSETS_TO_CACHE = [
  "/dashboard",
  "/dashboard/invoices",
  "/dashboard/clients"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Gracefully fetch assets to cache on install (optional/fallback)
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return fetch(url)
            .then((res) => cache.put(url, res))
            .catch(() => console.log(`SW: Offline fallback skip cache on ${url}`));
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network first, falling back to cache
self.addEventListener("fetch", (e) => {
  // Only intercept HTTP requests (ignore chrome-extension, internal schemes)
  if (!e.request.url.startsWith("http")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache valid responses dynamically
        if (res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        // Fallback to cache on network dropouts
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response("Offline mode. Connection required.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" }),
          });
        });
      })
  );
});
