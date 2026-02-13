const CACHE_NAME = "makakatrade";
const API_CACHE_NAME = "makakatrade-api";
const IMAGE_CACHE_NAME = "makakatrade-images";

// Assets to cache on install
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// Cache duration
const API_CACHE_DURATION = 5 * 60 * 1000;
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000;

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== IMAGE_CACHE_NAME
          ) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - network first, then cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.protocol === "chrome-extension:") {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else if (url.hostname.includes("api.binance.com")) {
    event.respondWith(
      networkFirstWithCache(request, API_CACHE_NAME, API_CACHE_DURATION),
    );
  } else if (
    url.pathname.includes("image") ||
    url.hostname.includes("ui-avatars.com") ||
    url.hostname.includes("coincap.io") ||
    url.hostname.includes("cryptoicons.org")
  ) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE_NAME, IMAGE_CACHE_DURATION),
    );
  } else if (url.origin === location.origin) {
    event.respondWith(networkFirst(request, CACHE_NAME));
  } else {
    event.respondWith(fetch(request));
  }
});

// Cache first strategy
async function cacheFirst(request, cacheName, maxAge = Infinity) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Check if cache is still valid
    const cachedTime = await getCacheTime(request, cacheName);
    const now = Date.now();

    if (cachedTime && now - cachedTime < maxAge) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await setCacheTime(request, cacheName, Date.now());
    }
    return response;
  } catch (error) {
    // If network fails and we have cached version, use it
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network first with cache and expiration
async function networkFirstWithCache(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await setCacheTime(request, cacheName, Date.now());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
      const cachedTime = await getCacheTime(request, cacheName);
      const now = Date.now();

      // Only use cache if it's not too old
      if (cachedTime && now - cachedTime < maxAge) {
        return cached;
      } else {
      }
    }

    throw error;
  }
}

// Helper functions to track cache time
async function getCacheTime(request, cacheName) {
  const timeCache = await caches.open(`${cacheName}-time`);
  const cached = await timeCache.match(request);
  if (cached) {
    const text = await cached.text();
    return parseInt(text, 10);
  }
  return null;
}

async function setCacheTime(request, cacheName, time) {
  const timeCache = await caches.open(`${cacheName}-time`);
  const response = new Response(time.toString());
  await timeCache.put(request, response);
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          }),
        );
      }),
    );
  }
});
