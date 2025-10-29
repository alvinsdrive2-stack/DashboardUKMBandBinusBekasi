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

    // Get all existing registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('📋 Existing service workers:', registrations.length);

    // Find firebase-messaging-sw.js registrations
    const firebaseSWRegistrations = registrations.filter(reg =>
      reg.active && reg.active.scriptURL && reg.active.scriptURL.includes('firebase-messaging-sw.js')
    );

    console.log('📋 Firebase service workers found:', firebaseSWRegistrations.length);

    // If there are duplicate firebase service workers, unregister all except one
    if (firebaseSWRegistrations.length > 1) {
      console.log('🚨 Found duplicate Firebase service workers, cleaning up...');

      // Keep the first one, unregister the rest
      const toKeep = firebaseSWRegistrations[0];
      const toUnregister = firebaseSWRegistrations.slice(1);

      console.log('📋 Keeping:', toKeep.active?.scriptURL);

      for (const reg of toUnregister) {
        console.log('🗑️ Unregistering duplicate Firebase service worker:', reg.active?.scriptURL);
        await reg.unregister();
      }

      // Wait for unregistration to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check if we have a valid firebase service worker
    const hasValidFirebaseSW = registrations.some(reg =>
      reg.active &&
      reg.active.scriptURL &&
      reg.active.scriptURL.includes('firebase-messaging-sw.js')
    );

    let registration;
    if (!hasValidFirebaseSW) {
      console.log('🔧 No valid Firebase service worker found, registering new one...');
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('✅ Firebase Service Worker registered:', registration.scope);
    } else {
      console.log('✅ Firebase Service Worker already active and valid');
      // Get the existing registration
      registration = await navigator.serviceWorker.ready;
    }

    // Wait for service worker to be ready
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }
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

// Listen for foreground messages (DISABLED - let service worker handle all notifications)
export const onForegroundMessage = () => {
  onMessage(messaging, (payload) => {
    console.log('📱 [lib/firebase.ts] FCM Foreground message received (logging only):', payload);
    console.log('📝 [lib/firebase.ts] Notification will be handled by service worker');
    console.log('🕵️ [lib/firebase.ts] NOT creating client-side notification - DISABLED');
    // DISABLED: No client-side notification creation - let service worker handle it
    // const notification = new Notification(...) - REMOVED
  });
};

export default app;