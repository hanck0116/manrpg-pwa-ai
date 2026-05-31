const CACHE_NAME = 'manrpg-pwa-ai-v1';
const APP_SCOPE = new URL(self.registration.scope).pathname;
const APP_SHELL = [APP_SCOPE, `${APP_SCOPE}index.html`, `${APP_SCOPE}manifest.webmanifest`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
