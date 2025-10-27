// VAPID Push Service Worker for UKM Band Dashboard
console.log('🚀 VAPID Push Service Worker installing...');

// Install event
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed');
});

// Push event
self.addEventListener('push', (event) => {
  console.log('📨 Push message received');

  if (!event.data) {
    console.log('❌ Push event but no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('📝 Notification data:', notificationData);
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
    notificationData = {
      title: 'UKM Band Bekasi',
      message: 'Anda memiliki notifikasi baru',
      icon: '/icons/favicon.png'
    };
  }

  const options = {
    body: notificationData.message || 'Anda memiliki notifikasi baru',
    icon: notificationData.icon || '/icons/favicon.png',
    badge: '/icons/favicon.png',
    tag: notificationData.tag || 'general-notification',
    data: notificationData.data || {},
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'UKM Band Bekasi',
      options
    ).then(() => {
      console.log('✅ Notification shown successfully');
    }).catch((error) => {
      console.error('❌ Error showing notification:', error);
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');

  const notification = event.notification;
  const data = notification.data || {};

  notification.close();

  let urlToOpen = '/dashboard/member';

  if (data.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fetch event (optional caching)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});

console.log('✅ Simple Push Service Worker loaded');