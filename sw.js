const CACHE_NAME = 'windyweather-pwa-cache-v2';
const ASSETS = [
  'index.html',
  'css/style.css',
  'js/icons.js',
  'js/location.js',
  'js/weather.js',
  'manifest.json',
  'backdrop.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});