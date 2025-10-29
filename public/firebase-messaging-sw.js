console.log('🚀 [PUBLIC-SW] Firebase Service Worker LOADED!');

importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

console.log('🚀 [PUBLIC-SW] Firebase scripts loaded!');

// Android PWA Background Sync Support
self.addEventListener('install', (event) => {
  console.log('🚀 [PUBLIC-SW] Service Worker Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 [PUBLIC-SW] Service Worker Activating...');
  event.waitUntil(self.clients.claim());
});

// Background Sync for Android PWA
self.addEventListener('sync', (event) => {
  console.log('🔄 [PUBLIC-SW] Background Sync Event:', event.tag);
  if (event.tag === 'background-notification-sync') {
    event.waitUntil(handleBackgroundNotificationSync());
  }
});

// Handle periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ [PUBLIC-SW] Periodic Sync Event:', event.tag);
  if (event.tag === 'notification-check') {
    event.waitUntil(checkPendingNotifications());
  }
});

async function handleBackgroundNotificationSync() {
  try {
    console.log('🔄 [PUBLIC-SW] Handling background notification sync...');

    // Check for any pending notifications from server
    const response = await fetch('/api/notifications/pending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📨 [PUBLIC-SW] Found pending notifications:', data);

      // Process pending notifications
      for (const notification of data.notifications || []) {
        await showBackgroundNotification(notification);
      }
    }
  } catch (error) {
    console.error('❌ [PUBLIC-SW] Background sync error:', error);
  }
}

async function checkPendingNotifications() {
  try {
    console.log('⏰ [PUBLIC-SW] Checking for pending notifications...');

    // Register for FCM token refresh if needed
    const token = await getFCMToken();
    if (token) {
      console.log('✅ [PUBLIC-SW] FCM Token active for background checks');
    }
  } catch (error) {
    console.error('❌ [PUBLIC-SW] Periodic sync error:', error);
  }
}

async function getFCMToken() {
  try {
    const token = await firebase.messaging().getToken();
    console.log('📱 [PUBLIC-SW] FCM Token for background:', token);
    return token;
  } catch (error) {
    console.error('❌ [PUBLIC-SW] Failed to get FCM token:', error);
    return null;
  }
}

async function showBackgroundNotification(notificationData) {
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  const title = notificationData.title || 'UKM Band Notification';
  const body = notificationData.body || 'You have a new notification';
  const icon = '/icons/favicon.png';
  const badge = '/icons/favicon.png';
  const tag = notificationData.tag || `bg-${uniqueId}`;
  const actionUrl = notificationData.actionUrl || '/dashboard/member';

  // Production URL for Android
  const productionBaseUrl = 'https://ukmbandbinusbekasi.vercel.app';
  const fullActionUrl = actionUrl.startsWith('http')
    ? actionUrl
    : `${productionBaseUrl}${actionUrl}`;

  console.log(`🔔 [PUBLIC-SW-${uniqueId}] Showing background notification:`, {
    title,
    body,
    actionUrl: fullActionUrl
  });

  return self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    data: {
      actionUrl: fullActionUrl,
      source: 'background-sync',
      uniqueId
    },
    requireInteraction: false,
    silent: false,
    renotify: true,
    // Android specific options
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  });
}

firebase.initializeApp({
  apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
  authDomain: "ukm-band-dashboard.firebaseapp.com",
  projectId: "ukm-band-dashboard",
  messagingSenderId: "317047973293",
  appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
});

console.log('🚀 [PUBLIC-SW] Firebase app initialized!');

const messaging = firebase.messaging();

console.log('🚀 [PUBLIC-SW] Firebase messaging initialized!');

// Handle background message - RETURN promise biar FCM gak auto-display
messaging.onBackgroundMessage((payload) => {
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  console.log(`📨 [SERVICE WORKER-${uniqueId}] === BACKGROUND MESSAGE RECEIVED ===`);
  console.log(`📋 [SERVICE WORKER-${uniqueId}] Full Payload:`, JSON.stringify(payload, null, 2));
  console.log(`📋 [SERVICE WORKER-${uniqueId}] FCM Data:`, payload.data);
  console.log(`📋 [SERVICE WORKER-${uniqueId}] FCM Notification:`, payload.notification);

  // Ambil data dari payload.data (bukan payload.notification)
  const title = payload.data?.title || payload.notification?.title || 'UKM Band Bekasi';
  const body = payload.data?.body || payload.notification?.body || 'Anda memiliki notifikasi baru';
  const icon = payload.data?.icon || payload.notification?.icon || "/icons/favicon.png";
  const badge = payload.data?.badge || payload.notification?.badge || "/icons/favicon.png";
  // Use tag from data or notification, with fallback
  const tag = payload.data?.tag || payload.notification?.tag || `fcm-${uniqueId}`;
  const image = payload.data?.image || payload.notification?.image || undefined;
  const actionUrl = payload.data?.actionUrl || "/dashboard/member";

  // Check for duplicate prevention flag
  const preventDuplicate = payload.data?.preventDuplicate === 'true';

  if (preventDuplicate) {
    console.log(`🚫 [SERVICE WORKER-${uniqueId}] DUPLICATE PREVENTION ACTIVE - Using fixed tag: ${tag}`);
  }

  console.log(`🔔 [SERVICE WORKER-${uniqueId}] PARSED NOTIFICATION DATA:`);
  console.log(`  - Title: "${title}"`);
  console.log(`  - Body: "${body}"`);
  console.log(`  - Icon: "${icon}"`);
  console.log(`  - Action URL: "${actionUrl}"`);
  console.log(`  - Tag: "${tag}"`);

  console.log(`🔔 [SERVICE WORKER-${uniqueId}] ATTEMPTING TO SHOW NOTIFICATION...`);

  // RETURN promise biar FCM gak auto-display (ini yang penting!)
  const notificationPromise = self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    image,
    data: {
      ...payload.data,
      actionUrl,
      source: 'service-worker',
      uniqueId: uniqueId
    },
    requireInteraction: false, // Changed back to false untuk multiple notifications
    silent: false,
    // Add renotify to ensure new notifications appear
    renotify: true
  });

  notificationPromise.then(() => {
    console.log(`✅ [SERVICE WORKER-${uniqueId}] NOTIFICATION SHOWN SUCCESSFULLY!`);
  }).catch((error) => {
    console.error(`❌ [SERVICE WORKER-${uniqueId}] FAILED TO SHOW NOTIFICATION:`, error);
  });

  return notificationPromise;
});

// Enhanced Notification Click Handler for Android PWA
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [SERVICE WORKER] Notification clicked:', event);
  console.log('🖱️ [SERVICE WORKER] Action:', event.action);
  console.log('🖱️ [SERVICE WORKER] Notification data:', event.notification.data);

  event.notification.close();

  let actionUrl = event.notification.data?.actionUrl || '/dashboard/member';

  // Always open production PWA URL for direct access
  const productionBaseUrl = 'https://ukmbandbinusbekasi.vercel.app';
  const fullActionUrl = actionUrl.startsWith('http')
    ? actionUrl
    : `${productionBaseUrl}${actionUrl}`;

  console.log(`🖱️ [SERVICE WORKER] Opening URL: ${fullActionUrl}`);

  // Handle Android notification actions
  if (event.action === 'dismiss') {
    console.log('🚫 [SERVICE WORKER] Dismissed notification');
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        console.log(`🔍 [SERVICE WORKER] Found ${clientList.length} existing clients`);

        // Focus existing production window if found
        for (const client of clientList) {
          console.log(`🔍 [SERVICE WORKER] Checking client: ${client.url}`);
          if (client.url.includes('ukmbandbinusbekasi.vercel.app') && 'focus' in client) {
            console.log(`🎯 [SERVICE WORKER] Focusing existing production window: ${client.url}`);

            // Navigate to the specific action URL if different
            if (client.url !== fullActionUrl) {
              await client.navigate(fullActionUrl);
            }
            return client.focus();
          }
        }

        // Try to focus existing localhost window for development
        for (const client of clientList) {
          if (client.url.includes('localhost:3000') && 'focus' in client) {
            console.log(`🎯 [SERVICE WORKER] Focusing localhost window: ${client.url}`);

            // For development, use localhost
            const devActionUrl = actionUrl.startsWith('http')
              ? actionUrl.replace('ukmbandbinusbekasi.vercel.app', 'localhost:3000')
              : `http://localhost:3000${actionUrl}`;

            if (client.url !== devActionUrl) {
              await client.navigate(devActionUrl);
            }
            return client.focus();
          }
        }

        // Open new production window
        if (clients.openWindow) {
          console.log(`🚀 [SERVICE WORKER] Opening new production window: ${fullActionUrl}`);
          return clients.openWindow(fullActionUrl);
        }
      })
      .catch((error) => {
        console.error('❌ [SERVICE WORKER] Error handling notification click:', error);
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('🚫 [SERVICE WORKER] Notification closed:', event.notification.data);
});
