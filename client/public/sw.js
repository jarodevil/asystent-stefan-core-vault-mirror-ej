const BUILD_ID = new URL(self.location.href).searchParams.get('build') || 'unknown';
const CACHE_VERSION = `stefan-${BUILD_ID}`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/stefan-icon.svg',
  '/offline.html', // Fallback page for offline
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', event);
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(err => {
      console.error('[SW] Failed to cache static assets:', err);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', event);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('stefan-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Dane konta i odpowiedzi API nie mogą pochodzić z Cache Storage.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyStrategy(request));
    return;
  }

  // Strategy 2: Cache First (for static assets)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Strategy 3: Network First for navigations.
  // A legal-assistant PWA must not show an obsolete application shell when online.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
});

/**
 * Network First Strategy
 * Try network first, fallback to cache if offline
 * Good for API calls where fresh data is important
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Return a basic offline response for API calls
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Brak połączenia z internetem. Funkcja wymaga dostępu online.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkOnlyStrategy(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Brak połączenia z internetem. Funkcja wymaga dostępu online.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 * Good for static assets that don't change often
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url, error);
    
    // Return a fallback response
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Stefan - Asystent Prawny';
  const options = {
    body: data.body || 'Masz nową wiadomość',
    icon: '/stefan-icon.svg',
    badge: '/stefan-icon.svg',
    data: data.url || '/',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
