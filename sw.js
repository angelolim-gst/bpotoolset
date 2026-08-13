const CACHE_NAME = 'gusto-offline-v3';

// 1. Install phase: Cache the HTML and the Google Font CSS files
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the SW to activate immediately!
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([
            './', 
            './index.html',
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap'
        ]))
    );
});

// 2. Activate phase: Take control of the page instantly
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 3. Fetch phase: Intercept everything else
self.addEventListener('fetch', (event) => {
    // DO NOT cache your custom network ping!
    if (event.request.url.includes('cloudflare.com')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Serve from cache
            }

            // Fetch from internet and cache dynamically (catches the .woff2 font files)
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Ignore offline errors
            });
        })
    );
});
