const CACHE_NAME = 'muyenzi-kiosk-v1'
const urlsToCache = [
  '/',
  '/offline.html',
]

// Install event: cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential files')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and API calls
  if (request.method !== 'GET') {
    return
  }

  // For API calls, use network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - unable to fetch data', { status: 503 })
          })
        })
    )
    return
  }

  // For document requests, use cache-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          return cached || fetch(request)
            .catch(() => {
              return caches.match('/offline.html') || new Response('Offline', { status: 503 })
            })
        })
    )
    return
  }

  // For other assets, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        return cached || fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            // Offline fallback for missing assets
            return new Response('Asset not available offline', { status: 503 })
          })
      })
  )
})

// Handle messages from clients (for manual sync trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
