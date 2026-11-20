/* Coquille de l'application seulement (installation sur l'écran d'accueil). Aucune donnée de production n'est mise en cache. */
var V = 'ab-scan-v1325', F = ['./', 'index.html', 'parser.js', 'manifest.webmanifest', 'icon-192.png', 'zxing-reader.js', 'ocr_lot.js', 'zxing_reader.wasm'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(F); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== V; }).map(function (x) { return caches.delete(x); })); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;   /* les appels au serveur ne passent jamais par le cache */
  e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); }));
});
