import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration dengan credentials dari environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
  authDomain: "ukm-band-dashboard.firebaseapp.com",
  projectId: "ukm-band-dashboard",
  storageBucket: "ukm-band-dashboard.firebasestorage.app",
  messagingSenderId: "317047973293",
  appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
  measurementId: "G-EKGK8JCEQJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// FCM Public VAPID Key dari environment variables
export const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || "BKAvI-YTsaAm6v6bmwp3CXgndd7ooY-fhhyyhw3LVyoaiDMMToJvSz2xn_n4jw163ko-wKFWKtWcys_kDY-rpDw";

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔥 Starting FCM token generation...');

    // Check environment
    console.log('🌐 Protocol:', window.location.protocol);
    console.log('🔒 Secure Context:', window.isSecureContext);
    console.log('📱 User Agent:', navigator.userAgent);

    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker not supported');
      return null;
    }

    console.log('✅ Service Worker supported');

    // Unregister existing service workers first
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.scope.includes(window.location.origin)) {
        console.log('🗑️ Unregistering existing service worker:', reg.scope);
        await reg.unregister();
      }
    }

    // Wait for a bit before registering new one
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Register service worker untuk FCM V1
    console.log('🔧 Registering Firebase Service Worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('✅ Firebase Service Worker registered:', registration.scope);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker is ready');

    // Check notification permission
    console.log('📋 Checking notification permission...');
    const permission = Notification.permission;
    console.log('📋 Current permission:', permission);

    if (permission === 'default') {
      console.log('📋 Requesting notification permission...');
      const result = await Notification.requestPermission();
      console.log('📋 Permission result:', result);
      if (result !== 'granted') {
        console.log('❌ Notification permission denied');
        return null;
      }
    } else if (permission === 'denied') {
      console.log('❌ Notification permission already denied');
      return null;
    }

    console.log('✅ Notification permission granted');

    // Get FCM token with more detailed logging
    console.log('🔑 Getting FCM token...');
    console.log('🔑 Using VAPID key:', VAPID_KEY ? VAPID_KEY.substring(0, 30) + '...' : 'NOT SET');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('🎉 SUCCESS! FCM Token obtained:', token.substring(0, 50) + '...');
      console.log('📊 Token length:', token.length);
      return token;
    } else {
      console.log('❌ FCM Token is null or empty');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Specific error handling
    if (error.message.includes('messaging/')) {
      console.log('🔍 Possible cause: Firebase SDK configuration issue');
    } else if (error.message.includes('vapidKey')) {
      console.log('🔍 Possible cause: Invalid VAPID key format');
    } else if (error.message.includes('serviceWorker')) {
      console.log('🔍 Possible cause: Service worker registration issue');
    } else if (error.message.includes('push service') || error.message.includes('AbortError')) {
      console.log('🔍 Possible cause: Push service blocked or unavailable');
    }

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