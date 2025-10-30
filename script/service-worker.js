const CACHE_NAME = "inventario-qr-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./scan.css",      // si tienes CSS
  "./Scanner.js",
  "./Script.js",          // tu script principal
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Instalar y guardar archivos en caché
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activar y limpiar cachés viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// Interceptar peticiones para usar caché
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
