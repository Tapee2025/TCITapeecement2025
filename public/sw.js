const CACHE_NAME = 'tapee-cement-v3';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event with network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Try network first for API calls
    fetch(event.request)
      .then((response) => {
        // If we got a response, clone it and store it in cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache and it's a navigation request, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            throw new Error('No cached version available');
          });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any queued actions when connection is restored
      console.log('Background sync triggered')
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Tapee Cement',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Tapee Cement', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in service worker:', event.reason);
  event.preventDefault();
});