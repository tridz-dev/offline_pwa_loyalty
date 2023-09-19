// service-worker.js
const CACHE_NAME = "my-cache-v1";
const urlsToCache = [
  "https://cdn.jsdelivr.net/npm/tailwindcss@3.3.3/tailwind.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.css",
  "https://code.jquery.com/jquery-3.6.4.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.4/dexie.min.js",
  // Add other URLs you want to cache
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
