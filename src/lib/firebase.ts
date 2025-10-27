import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// FCM Public VAPID Key dari Firebase Console
export const VAPID_KEY = "BKAvI-YTsaAm6v6bmwp3CXgndd7ooY-fhhyyhw3LVyoaiDMMToJvSz2xn_n4jw163ko-wKFWKtWcys_kDY-rpDw";

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    // Register service worker untuk FCM V1
    const registration = await navigator.serviceWorker.register('/firebase-messaging-v1-sw.js');
    console.log('Firebase Service Worker registered:', registration);

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    console.log('FCM Token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = () => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    if (payload.notification) {
      // Show notification when app is in foreground
      const notification = new Notification(payload.notification.title || 'UKM Band Dashboard', {
        body: payload.notification.body || 'You have a new notification',
        icon: payload.notification.icon || '/icons/favicon.png',
        badge: '/icons/favicon.png',
        tag: payload.notification.tag || 'fcm-foreground',
        data: payload.data || {}
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  });
};

export default app;