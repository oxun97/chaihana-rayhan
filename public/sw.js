// Minimal service worker: it exists so the site is installable and so a
// guest who loses signal mid-order sees the restaurant's own offline page
// instead of the browser's error screen.
//
// Deliberately conservative about caching. The menu, prices and order
// endpoints must never be served stale — a cached price is a wrong price —
// so only the offline fallback is precached, and every navigation goes to
// the network first.

const CACHE = "chaihana-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only page navigations are handled; everything else (API calls, images,
  // scripts) is left to the browser so nothing is ever served stale.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(OFFLINE_URL);
      return cached || Response.error();
    })
  );
});
