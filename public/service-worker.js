const CACHE_NAME = 'woodcrest-public-v1';
const PUBLIC_ASSETS = [
  './',
  './manifest.json',
  './icons/icon.svg',
  './images/woodcrest-logo.jpg',
  './images/wood-interior-1.jpg',
  './images/wood-interior-2.jpg',
  './images/wood-interior-3.jpg',
  './images/wood-interior-4.webp',
  './images/wood-interior-5.jpg',
  './images/wood-interior-6.jpg',
  './images/wood-interior-7.jpg',
  './images/wood-interior-8.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
  if (url.pathname.includes('/functions/') || url.pathname.includes('/storage/') || url.hostname.includes('supabase')) return;
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
