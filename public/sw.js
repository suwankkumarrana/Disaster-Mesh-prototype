/* DisasterMesh Offline-First Service Worker */
const CACHE_NAME = "disaster-mesh-v2.1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/main.css",
  "/css/text-only.css",
  "/js/i18n.js",
  "/js/db.js",
  "/js/mesh.js",
  "/js/api.js",
  "/js/map.js",
  "/js/admin.js",
  "/js/app.js",
  "/offline_handbook.html"
];

// Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline emergency assets");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Purging stale cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network interceptor
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If requesting API endpoint
  if (url.pathname.startsWith("/api/")) {
    // Only cache GET queries for read-only alerts and resources
    if (event.request.method === "GET" && (url.pathname.includes("/alerts") || url.pathname.includes("/resources") || url.pathname.includes("/stats"))) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then((cached) => {
              if (cached) return cached;
              return new Response(JSON.stringify({ error: "Offline: Served from local cache unavailable", offline: true }), {
                headers: { "Content-Type": "application/json" }
              });
            });
          })
      );
      return;
    }

    // POST / PATCH: let pass through or fail gracefully
    return;
  }

  // Static assets: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* offline, keep cached */});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // If navigation request fails, serve offline index
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// Background sync notification
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-sos-queue") {
    console.log("[ServiceWorker] Background sync event triggered for SOS queue");
    // Handled in client app via db.js and BroadcastChannel
  }
});
