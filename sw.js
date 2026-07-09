const CACHE_NAME = 'fedchat-v1';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Sedgwick+Ave+Display&display=swap'
];

// Lè Service Worker la ap enstale, li mete fichye yo nan memwa kach la
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Fichye yo byen anrejistre nan kach la');
      return cache.addAll(assetsToCache);
    })
  );
});

// Lè app la ap chaje, li gade si l jwenn fichye yo nan kach la anvan l al chache yo sou entènèt la
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si l jwenn li nan kach la, li bay li; sinon, li rale l sou rezo a
      return response || fetch(event.request);
    })
  );
});
