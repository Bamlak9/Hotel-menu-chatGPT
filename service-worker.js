// service-worker.js

const CACHE_NAME = "nuha-pastry-v3";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./flip.mp3",
  "./icon-192.png",
  "./icon-512.png",
  "./images/placeholder.jpg"
];

// INSTALL → pre‑cache everything
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// ACTIVATE → remove older caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH → network‑first for navigation, cache‑first elsewhere
self.addEventListener("fetch", event => {
  const request = event.request;

  // Handle HTML navigation separately so you can refresh pages correctly
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});