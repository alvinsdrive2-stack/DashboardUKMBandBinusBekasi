// Custom Service Worker for Push Notifications
const CACHE_NAME = 'ukm-band-push-v1';
const WEBPUSH_PUBLIC_KEY = 'BHrOcPd8j5aRb0I61s9C4nSOs-JxrdAf-Acgi9ZfyX6wvPUfvp0TPEtSFQ_5Ed2MFK2cjTpPfM8A0XVJqK3Rs4E';

// Install event - cache important assets
self.addEventListener('install', (event) => {
  console.log('🚀 Push Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard/member',
        '/api/notifications/unread-count',
        '/icons/favicon.png'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Push Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📨 Push message received:', event);

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
      icon: '/icons/favicon.png',
      badge: '/icons/favicon.png',
      tag: 'general-notification'
    };
  }

  const options = {
    body: notificationData.message || 'Anda memiliki notifikasi baru',
    icon: notificationData.icon || '/icons/favicon.png',
    badge: notificationData.badge || '/icons/favicon.png',
    tag: notificationData.tag || 'general-notification',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
    silent: false
  };

  // Add image if provided
  if (notificationData.image) {
    options.image = notificationData.image;
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'UKM Band Bekasi',
      options
    ).then((notificationShown) => {
      console.log('✅ Notification shown successfully');

      // Update unread count badge
      updateBadgeCount();

      return notificationShown;
    }).catch((error) => {
      console.error('❌ Error showing notification:', error);
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle different actions
  let urlToOpen = '/dashboard/member';

  if (action && data.actions) {
    const clickedAction = data.actions.find(a => a.action === action);
    if (clickedAction && clickedAction.url) {
      urlToOpen = clickedAction.url;
    }
  } else if (data.url) {
    urlToOpen = data.url;
  } else if (data.actionUrl) {
    urlToOpen = data.actionUrl;
  }

  // Handle event-specific redirects
  if (data.eventId) {
    if (data.type === 'EVENT_REMINDER' || data.type === 'PERSONNEL_ASSIGNED') {
      urlToOpen = `/dashboard/member/schedule?modal=open&eventId=${data.eventId}`;
    } else if (data.type === 'SONG_ADDED') {
      urlToOpen = `/dashboard/songs?eventId=${data.eventId}`;
    }
  }

  console.log('🔗 Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window with the same URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then((focusedClient) => {
        console.log('✅ Client focused or window opened');

        // Send message to the client about the notification click
        if (focusedClient) {
          focusedClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              action,
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

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event);

  // Optionally update badge count when notification is closed
  updateBadgeCount();
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  } else if (event.tag === 'reminder-sync') {
    event.waitUntil(syncReminders());
  }
});

// Periodic background sync for checking reminders
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);

  if (event.tag === 'reminders-check') {
    event.waitUntil(checkAndSendReminders());
  }
});

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If network fails, try to return cached version
        return caches.match(event.request);
      });
    })
  );
});

// Helper functions
async function updateBadgeCount() {
  try {
    // Try to get unread count from API
    const response = await fetch('/api/notifications/unread-count');
    if (response.ok) {
      const data = await response.json();
      const count = data.unreadCount || 0;

      // Set application badge (if supported)
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count);
        } else {
          navigator.clearAppBadge();
        }
      }

      console.log('🔢 Badge updated to:', count);
    }
  } catch (error) {
    console.error('❌ Error updating badge:', error);
  }
}

async function syncNotifications() {
  console.log('🔄 Syncing notifications...');
  try {
    // Sync any pending notification actions
    const pendingActions = await getPendingActions();
    for (const action of pendingActions) {
      await processPendingAction(action);
    }
    console.log('✅ Notifications synced');
  } catch (error) {
    console.error('❌ Error syncing notifications:', error);
  }
}

async function syncReminders() {
  console.log('🔄 Syncing reminders...');
  try {
    // Sync reminder settings and scheduled reminders
    await checkAndSendReminders();
    console.log('✅ Reminders synced');
  } catch (error) {
    console.error('❌ Error syncing reminders:', error);
  }
}

async function checkAndSendReminders() {
  console.log('⏰ Checking and sending reminders...');
  try {
    // This would connect to your reminder API
    // For now, just log that the check was performed
    console.log('✅ Reminder check completed');
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
}

async function getPendingActions() {
  // Get pending notification actions from IndexedDB
  return [];
}

async function processPendingAction(action) {
  // Process a pending notification action
  console.log('🔄 Processing pending action:', action);
}

// Handle subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed');

  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await event.newSubscription;
        const oldSubscription = await event.oldSubscription;

        if (newSubscription) {
          // Send new subscription to server
          await sendSubscriptionToServer(newSubscription);
          console.log('✅ New subscription sent to server');
        } else if (oldSubscription) {
          // Remove old subscription from server
          await removeSubscriptionFromServer(oldSubscription);
          console.log('🗑️ Old subscription removed from server');
        }
      } catch (error) {
        console.error('❌ Error handling subscription change:', error);
      }
    })()
  );
});

async function sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }
  } catch (error) {
    console.error('❌ Error sending subscription to server:', error);
    throw error;
  }
}

async function removeSubscriptionFromServer(subscription) {
  try {
    const response = await fetch('/api/notifications/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from server');
    }
  } catch (error) {
    console.error('❌ Error removing subscription from server:', error);
    throw error;
  }
}

// Log service worker lifecycle events
self.addEventListener('install', () => console.log('🚀 Push Service Worker installed'));
self.addEventListener('activate', () => console.log('✅ Push Service Worker activated'));
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});