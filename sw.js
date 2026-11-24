const CACHE_NAME = 'gusto-offline-v7'; // Bumped version to trigger the update
const FONT_CACHE = 'gusto-fonts-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html']))
    );
});

self.addEventListener('activate', (event) => {
    // 1. CACHE CLEANUP: Delete any caches that don't match the current versions
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== FONT_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // DO NOT cache your custom network ping!
    if (url.hostname.includes('cloudflare.com')) return;

    // Specialized Font Caching Strategy (Keep this as Cache-First)
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.open(FONT_CACHE).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    console.error('Font fetch failed:', error);
                }
            })
        );
        return;
    }

    // Main App Strategy: Network-First, Fallback to Cache
    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            // We got a good response from the internet! Cache it for later.
            if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
        }).catch(() => {
            // The internet is down. Serve the most recent version from the cache.
            console.log('Network fetch failed, falling back to cache');
            return caches.match(event.request);
        })
    );
});
