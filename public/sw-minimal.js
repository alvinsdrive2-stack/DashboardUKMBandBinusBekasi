// Minimal VAPID Test Service Worker
console.log('🚀 Minimal VAPID SW loading...');

self.addEventListener('install', (event) => {
  console.log('✅ Minimal VAPID SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Minimal VAPID SW activated');
  event.waitUntil(clients.claim());
});

// Simple push handler
self.addEventListener('push', (event) => {
  console.log('📨 Push received (minimal)');

  const options = {
    body: 'Minimal VAPID test notification',
    icon: '/icons/favicon.png',
    badge: '/icons/favicon.png',
    tag: 'minimal-test'
  };

  event.waitUntil(
    self.registration.showNotification('Minimal VAPID Test', options)
  );
});

// Simple notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked (minimal)');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/dashboard/member')
  );
});

console.log('✅ Minimal VAPID SW ready');