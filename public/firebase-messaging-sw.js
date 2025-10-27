// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

// Firebase configuration (harus sama dengan di frontend)
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || "",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "",
  projectId: self.FIREBASE_PROJECT_ID || "",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: self.FIREBASE_APP_ID || "",
  measurementId: self.FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'UKM Band Dashboard';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/favicon.png',
    badge: '/icons/favicon.png',
    tag: payload.notification?.tag || 'fcm-background',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
    vibration: [200, 100, 200],
    timestamp: Date.now()
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const data = notification.data || {};

  notification.close();

  // Default URL
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
            type: 'FCM_NOTIFICATION_CLICKED',
            data: {
              url: urlToOpen,
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

console.log('Firebase Messaging Service Worker loaded');