const CACHE_NAME = "cajas-qr-v1";
const urlsToCache = [
  "index.html",
  "style.css",
  "Script.js",
  "manifest.json",
  "https://cdn.jsdelivr.net/npm/html5-qrcode/minified/html5-qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
