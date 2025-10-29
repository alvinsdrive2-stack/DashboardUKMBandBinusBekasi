importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
  authDomain: "ukm-band-dashboard.firebaseapp.com",
  projectId: "ukm-band-dashboard",
  messagingSenderId: "317047973293",
  appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
});

const messaging = firebase.messaging();

// Handle background message - RETURN promise biar FCM gak auto-display
messaging.onBackgroundMessage((payload) => {
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  console.log(`📨 [SRC-SERVICE-WORKER-${uniqueId}] === BACKGROUND MESSAGE RECEIVED ===`);
  console.log(`📋 [SRC-SERVICE-WORKER-${uniqueId}] Full Payload:`, JSON.stringify(payload, null, 2));
  console.log(`📋 [SRC-SERVICE-WORKER-${uniqueId}] FCM Data:`, payload.data);
  console.log(`📋 [SRC-SERVICE-WORKER-${uniqueId}] FCM Notification:`, payload.notification);

  // Ambil data dari payload.data (bukan payload.notification)
  const title = payload.data?.title || payload.notification?.title || 'UKM Band Bekasi';
  const body = payload.data?.body || payload.notification?.body || 'Anda memiliki notifikasi baru';
  const icon = payload.data?.icon || payload.notification?.icon || "/icons/favicon.png";
  const badge = payload.data?.badge || payload.notification?.badge || "/icons/favicon.png";
  const tag = payload.data?.tag || payload.notification?.tag || "fcm-background";
  const image = payload.data?.image || payload.notification?.image || undefined;
  const actionUrl = payload.data?.actionUrl || "/dashboard/member";

  console.log(`🔔 [SRC-SERVICE-WORKER-${uniqueId}] PARSED NOTIFICATION DATA:`);
  console.log(`  - Title: "${title}"`);
  console.log(`  - Body: "${body}"`);
  console.log(`  - Icon: "${icon}"`);
  console.log(`  - Action URL: "${actionUrl}"`);
  console.log(`  - Tag: "${tag}"`);

  console.log(`🔔 [SRC-SERVICE-WORKER-${uniqueId}] ATTEMPTING TO SHOW NOTIFICATION...`);

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
      source: 'src-service-worker',
      uniqueId: uniqueId
    },
    requireInteraction: true, // Changed to true untuk testing
    silent: false
  });

  notificationPromise.then(() => {
    console.log(`✅ [SRC-SERVICE-WORKER-${uniqueId}] NOTIFICATION SHOWN SUCCESSFULLY!`);
  }).catch((error) => {
    console.error(`❌ [SRC-SERVICE-WORKER-${uniqueId}] FAILED TO SHOW NOTIFICATION:`, error);
  });

  return notificationPromise;
});

// Event listener HARUS di luar onBackgroundMessage!
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [SRC-SERVICE-WORKER] Notification clicked:', event);

  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || '/dashboard/member';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if found
        for (const client of clientList) {
          if (client.url.includes(actionUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
  );
});