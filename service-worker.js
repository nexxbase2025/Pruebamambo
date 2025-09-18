
const CACHE_NAME = 'radio-mambo-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Puedes agregar CSS, JS y otras imágenes si tienes
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Limpiar caches antiguas
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // No cachear el stream en vivo para evitar problemas
  if (requestUrl.href.includes('zeno.fm')) {
    return event.respondWith(fetch(event.request));
  }

  // Cache first strategy para recursos estáticos
  event.respondWith(
    caches.match(event.request).then(cachedResp => {
      return cachedResp || fetch(event.request).then(networkResp => {
        return caches.open(CACHE_NAME).then(cache => {
          // Solo cachear si es GET y es un recurso estático (puedes ajustar si quieres)
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResp.clone());
          }
          return networkResp;
        });
      }).catch(() => {
        // Puedes devolver página offline o imagen predeterminada aquí si quieres
        return caches.match('./index.html');
      });
    })
  );
});