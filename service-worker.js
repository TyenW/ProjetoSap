/**
 * Service Worker
 * Offline-first caching strategy for BitLab
 * - SHELL strategy: Cache HTML/CSS/JS on first install
 * - NETWORK_FIRST: For data (questions.json, achievements.json)
 * - CACHE_FIRST: For assets (images, audio)
 */

const CACHE_VERSION = 'v3';

// Resources to cache on install (app shell)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/quiz.html',
  '/home.html',
  '/oqueesap.html',
  '/equipesap.html',
  '/privacy.html',
  '/terms.html',
  
  // CSS
  '/assets/css/base.css',
  '/assets/css/emular.css',
  '/assets/css/equipe.css',
  '/assets/css/footer.css',
  '/assets/css/home.css',
  '/assets/css/oqueesap.css',
  '/assets/css/quiz.css',
  '/assets/css/style.css',
  
  // Core JS
  '/assets/js/core/memory-store.js',
  '/assets/js/core/assembler-core.js',
  '/assets/js/core/emulator-core.js',
  
  // Modules
  '/assets/js/modules/asset-loader.js',
  '/assets/js/modules/quiz-analytics.js',
  '/assets/js/modules/user-profile.js',
  '/assets/js/modules/challenge-scaffolding.js',
  '/assets/js/modules/telemetry.js',
  
  // Main scripts
  '/assets/js/script.js',
  '/assets/js/quiz.js',
  '/assets/js/ui-effects.js',
  '/assets/js/nav.js',
  '/assets/js/audio-menu.js',
  '/assets/js/media-opt.js',
  '/assets/js/bg-anim.js',
  '/assets/js/oqesap.js',
  '/assets/js/carrosel.js',
  
  // Workers
  '/assets/js/workers/emulator.worker.js',
  '/assets/js/workers/assembler.worker.js'
];

// Network-first: Try network first, fallback to cache
const NETWORK_FIRST_RESOURCES = [
  '/assets/data/questions.json',
  '/assets/data/achievements.json'
];

// Install event: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('Failed to cache some shell assets:', err);
        // Não falhar a instalação se alguns assets não estiverem disponíveis
        return cache.addAll(
          SHELL_ASSETS.filter(asset => asset.includes('.html') || asset.includes('.css'))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: use appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network-first for data files
  if (NETWORK_FIRST_RESOURCES.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return empty offline data if no cache
            if (url.pathname.includes('questions.json')) {
              return new Response(JSON.stringify({ questions: [] }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            if (url.pathname.includes('achievements.json')) {
              return new Response(JSON.stringify({ achievements: [] }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            throw new Error('Network error');
          });
        })
    );
    return;
  }

  // Cache-first for assets (images, audio)
  if (request.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ogg|mp3|wav)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          // Cache new assets
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for HTML
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clonedResponse = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});

// Background sync (optional: sync quiz results if offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  }
});

async function syncQuizResults() {
  // TODO: Implement sync of offline quiz results when connection restored
  console.log('Background sync triggered for quiz results');
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação da BitLab',
    icon: '/assets/img/logoBitLab.png',
    badge: '/assets/img/logoBitLab.png',
    tag: data.tag || 'bitlab-notification',
    requireInteraction: false
  };

  event.waitUntil(self.registration.showNotification(data.title || 'BitLab', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
