// Minimal service worker for the music PWA.
// Strategy: cache the app shell + runtime cache for same-origin GETs so the
// player opens offline once visited. Media files are cached on first play.
const CACHE = "music-cache-v2";
const SCOPE = self.registration.scope; // e.g. https://host/Viktor/

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([SCOPE]).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache live API or audio

  // Navigation requests: network-first, fall back to cached shell (offline).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SCOPE, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SCOPE).then((r) => r || caches.match(req)))
    );
    return;
  }

  // Everything else: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
