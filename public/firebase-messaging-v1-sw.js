// Firebase Cloud Messaging API V1 Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

// Firebase configuration dengan credentials dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
  authDomain: "ukm-band-dashboard.firebaseapp.com",
  projectId: "ukm-band-dashboard",
  storageBucket: "ukm-band-dashboard.firebasestorage.app",
  messagingSenderId: "317047973293",
  appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
  measurementId: "G-EKGK8JCEQJ"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages (API V1 compatible)
messaging.onBackgroundMessage((payload) => {
  console.log('FCM V1 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'UKM Band Dashboard';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/favicon.png',
    badge: '/icons/favicon.png',
    tag: payload.notification?.tag || 'fcm-v1-background',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
    vibration: [200, 100, 200],
    timestamp: Date.now(),
    // API V1 specific options
    actions: payload.data?.actions || [],
    image: payload.notification?.image || null,
    renotify: true
  };

  // Show notification with enhanced features
  self.registration.showNotification(notificationTitle, notificationOptions);

  // Update badge if supported
  if ('setAppBadge' in navigator && payload.data?.unreadCount) {
    navigator.setAppBadge(payload.data.unreadCount);
  }
});

// Handle notification clicks (API V1 compatible)
self.addEventListener('notificationclick', (event) => {
  console.log('FCM V1 Notification clicked:', event);

  const notification = event.notification;
  const data = notification.data || {};
  const action = event.action;

  notification.close();

  // Handle action buttons (API V1 feature)
  let urlToOpen = '/dashboard/member';

  if (action) {
    switch (action) {
      case 'view':
        urlToOpen = data.actionUrl || '/dashboard/member';
        break;
      case 'dismiss':
        return; // Don't open anything
      case 'reply':
        // Handle reply action
        if (event.reply) {
          console.log('User replied:', event.reply);
          // Send reply to server
          fetch('/api/notifications/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId: data.notificationId,
              reply: event.reply,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error('Failed to send reply:', err));
        }
        return;
      default:
        urlToOpen = data.actionUrl || '/dashboard/member';
    }
  } else {
    // Handle default click
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
  }

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
        console.log('Client focused or window opened:', urlToOpen);

        // Send message to the client
        if (focusedClient) {
          focusedClient.postMessage({
            type: 'FCM_V1_NOTIFICATION_CLICKED',
            data: {
              url: urlToOpen,
              action: action,
              notificationData: data
            }
          });
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Handle notification close (API V1 feature)
self.addEventListener('notificationclose', (event) => {
  console.log('FCM V1 Notification closed:', event);

  const data = event.notification.data || {};

  // Track notification dismissal
  if (data.notificationId) {
    fetch('/api/notifications/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error('Failed to track dismissal:', err));
  }
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);

  // Sync new subscription with server
  if (event.newSubscription) {
    fetch('/api/fcm/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldEndpoint: event.oldSubscription?.endpoint,
        newSubscription: event.newSubscription.toJSON()
      })
    }).catch(err => console.error('Failed to sync subscription:', err));
  }
});

console.log('FCM V1 Service Worker loaded');