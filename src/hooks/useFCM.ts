import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actionUrl?: string;
}

export function useFCM() {
  const { data: session } = useSession();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check browser support
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    // Listen for foreground messages (only if Firebase is available)
    if (typeof window !== 'undefined') {
      import('@/lib/firebase').then(({ onForegroundMessage }) => {
        onForegroundMessage();
      }).catch(() => {
        console.log('Firebase not available');
      });
    }
  }, [mounted]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setError('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const subscribeToFCM = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not logged in');
      return null;
    }

    if (permission !== 'granted') {
      setError('Notification permission not granted');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import Firebase functions
      const { getFCMToken } = await import('@/lib/firebase');
      const token = await getFCMToken();

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Save FCM token to server
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          fcmToken: token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token to server');
      }

      setFcmToken(token);
      console.log('FCM subscription successful');
      return token;

    } catch (error) {
      console.error('FCM subscription failed:', error);
      setError(error instanceof Error ? error.message : 'FCM subscription failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, permission]);

  const unsubscribeFromFCM = useCallback(async () => {
    if (!fcmToken || !session?.user?.id) return;

    try {
      await fetch('/api/fcm/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          fcmToken: fcmToken
        })
      });

      setFcmToken(null);
      console.log('FCM unsubscription successful');
    } catch (error) {
      console.error('FCM unsubscription failed:', error);
      setError('Failed to unsubscribe from FCM');
    }
  }, [fcmToken, session?.user?.id]);

  const sendFCMNotification = useCallback(async (notification: FCMNotification) => {
    if (!session?.user?.id) {
      setError('User not logged in');
      return false;
    }

    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/favicon.png',
          badge: notification.badge || '/icons/favicon.png',
          tag: notification.tag,
          data: notification.data,
          actionUrl: notification.actionUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send FCM notification');
      }

      const result = await response.json();
      console.log('FCM notification sent:', result);
      return true;

    } catch (error) {
      console.error('Failed to send FCM notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send FCM notification');
      return false;
    }
  }, [session?.user?.id]);

  return {
    isSupported,
    permission,
    fcmToken,
    isLoading,
    error,
    requestPermission,
    subscribeToFCM,
    unsubscribeFromFCM,
    sendFCMNotification
  };
}