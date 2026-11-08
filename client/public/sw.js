// FENEC Digital - Service Worker com Atualização Forçada e Cache-Busting
const BUILD_TIME = '1794148312878';
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
// - version.json, /api e /fenec-api/ -> sempre direto da rede
// - Páginas HTML / Navegação -> Network-First (sempre busca a versão mais recente do GitHub Pages)
// - Assets estáticos -> Network-First com fallback de cache para uso offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Version.json e chamadas de API nunca passam pelo cache do SW
  if (url.pathname.includes('version.json') || url.pathname.includes('/api') || url.pathname.includes('/fenec-api/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // 2. Requisições de navegação (HTML principal do app)
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

  // 3. Demais recursos estáticos (JS, CSS, Imagens)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
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
