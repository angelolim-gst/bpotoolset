const CACHE_NAME = 'gusto-offline-v2';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html']))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('cdn-cgi/trace')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Serve from cache instantly
            }

            return fetch(event.request).then((networkResponse) => {
                // Check if it's a valid response or a font file (opaque response)
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
            });
        })
    );
});
