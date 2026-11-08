// FENEC Digital - Service Worker com Atualização Forçada e Cache-Busting
const BUILD_TIME = '1794151700000';
const CACHE_NAME = 'fenec-cache-v-' + BUILD_TIME;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './logo-fenec.svg',
  './logo-fenec-horizontal.svg',
  './pwa-192.png',
  './pwa-512.png',
  './apple-touch-icon.png'
];

// Instalação do Service Worker - Ativa imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

// Ativação - Limpa todos os caches antigos imediatamente e assume controle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Removendo cache obsoleto:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Comunicação com o cliente (atualização forçada)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PURGE_CACHE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    });
  }
});

// Estratégia de requisição:
// - Requisições POST/PUT/DELETE e chamadas para API externa (alfa-api) JAMAIS devem ser interceptadas pelo SW
// - Apenas recursos estáticos locais GET do próprio domínio são tratados com Network-First
self.addEventListener('fetch', (event) => {
  // 1. NUNCA interceptar requisições que não sejam GET (POST, PUT, DELETE, PATCH, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. NUNCA interceptar requisições para origens externas (Backend OCI duckdns, APIs externas, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. NUNCA interceptar version.json ou chamadas de API
  if (url.pathname.includes('version.json') || url.pathname.includes('/api') || url.pathname.includes('/fenec-api/')) {
    return;
  }

  // 4. Requisições de navegação (HTML principal do app)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html').then((cached) => {
            return cached || caches.match('./');
          });
        })
    );
    return;
  }

  // 5. Demais recursos estáticos GET da mesma origem (JS, CSS, Imagens locais)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
