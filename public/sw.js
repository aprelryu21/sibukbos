const CACHE_NAME = 'sibukbos-auto-cache';

// 1. Langsung aktif tanpa menunggu
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Hapus cache lawas yang mungkin masih nyangkut dari sistem sebelumnya
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Strategi Jitu: NETWORK FIRST (Internet Dulu, Cache Belakangan)
self.addEventListener('fetch', (event) => {
  // Abaikan request yang bukan GET (seperti POST ke database)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika sukses ambil dari internet (ada versi baru), simpan salinannya ke cache secara diam-diam
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse; // Tampilkan yang paling fresh
      })
      .catch(() => {
        // Jika internet mati / gagal fetch, baru panggil file dari cache (Mode Offline)
        return caches.match(event.request);
      })
  );
});
