// Direct VAPID Service Worker - No caching, no complexity
console.log('🚀 Direct VAPID Service Worker loading...');

self.addEventListener('install', (event) => {
  console.log('✅ Direct VAPID Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Direct VAPID Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event handler - simple and reliable
self.addEventListener('push', (event) => {
  console.log('📨 Push message received');

  if (!event.data) {
    console.log('❌ No push data received');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('📝 Push data:', notificationData);
  } catch (error) {
    console.error('❌ Failed to parse push data:', error);
    // Fallback notification
    notificationData = {
      title: 'UKM Band Dashboard',
      message: 'You have a new notification',
      icon: '/icons/favicon.png',
      badge: '/icons/favicon.png'
    };
  }

  const options = {
    body: notificationData.message || 'You have a new notification',
    icon: notificationData.icon || '/icons/favicon.png',
    badge: notificationData.badge || '/icons/favicon.png',
    tag: notificationData.tag || 'general-notification',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    silent: false,
    vibration: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'UKM Band Dashboard',
      options
    ).then(() => {
      console.log('✅ Push notification shown successfully');

      // Update badge if supported
      if ('setAppBadge' in navigator) {
        // Get unread count from API
        fetch('/api/notifications/unread-count')
          .then(response => response.json())
          .then(data => {
            if (data.unreadCount > 0) {
              navigator.setAppBadge(data.unreadCount);
            } else {
              navigator.clearAppBadge();
            }
          })
          .catch(() => {
            console.log('⚠️ Could not update badge');
          });
      }
    }).catch((error) => {
      console.error('❌ Failed to show notification:', error);
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');

  const notification = event.notification;
  const data = notification.data || {};

  notification.close();

  let urlToOpen = '/dashboard/member';

  // Handle custom URLs from data
  if (data.url) {
    urlToOpen = data.url;
  }

  // Handle event-specific redirects
  if (data.eventId) {
    if (data.type === 'EVENT_REMINDER' || data.type === 'PERSONNEL_ASSIGNED') {
      urlToOpen = `/dashboard/member/schedule?eventId=${data.eventId}`;
    } else if (data.type === 'SONG_ADDED') {
      urlToOpen = `/dashboard/songs?eventId=${data.eventId}`;
    }
  }

  console.log('🔗 Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if needed
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then((focusedClient) => {
        console.log('✅ Client focused or window opened');

        // Send message to the client
        if (focusedClient) {
          focusedClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              url: urlToOpen,
              notificationData: data
            }
          });
        }
      })
      .catch((error) => {
        console.error('❌ Error handling notification click:', error);
      })
  );
});

// Simple fetch handler (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

console.log('✅ Direct VAPID Service Worker ready');