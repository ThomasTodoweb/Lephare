const CACHE_NAME = 'lephare-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls and external resources
  if (url.pathname.startsWith('/api') || url.origin !== location.origin) return

  // Network first for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // Cache first for static assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      })
    )
    return
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    tag: data.tag || 'lephare-notification',
    data: {
      url: data.url || '/dashboard',
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})
