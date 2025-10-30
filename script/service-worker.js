// Nombre del caché (cámbialo para forzar actualización)
const CACHE_NAME = "inventario-qr-v1";

// Archivos que se guardarán en caché
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./Scan.css", // si tienes estilos
  "./Script.js", // tu JS principal
  "./Scanner.js" // si usas un lector QR externo
];

// Instalación: cachea los archivos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Archivos cacheados correctamente");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activación: limpia cachés viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("Eliminando caché antiguo:", name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si el recurso está en caché, lo devuelve. Si no, lo descarga.
      return response || fetch(event.request);
    })
  );
});
