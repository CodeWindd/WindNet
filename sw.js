/* ==========================================================================
   WINDYWEATHER OFFLINE SERVICE WORKER
   ========================================================================== */

const CACHE_NAME = 'windyweather-pixel-cache-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/icons.js',
    './js/location.js',
    './js/weather.js',
    './backdrop.png',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});