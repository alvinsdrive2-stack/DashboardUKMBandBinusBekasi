import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FCMV1Notification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actionUrl?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  topic?: string;
}

export function useFCMv1() {
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

    // Listen for foreground messages (API V1)
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

  const subscribeToFCMv1 = useCallback(async () => {
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
            timestamp: new Date().toISOString(),
            apiVersion: 'v1'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token to server');
      }

      setFcmToken(token);
      console.log('FCM V1 subscription successful');
      return token;

    } catch (error) {
      console.error('FCM V1 subscription failed:', error);
      setError(error instanceof Error ? error.message : 'FCM V1 subscription failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, permission]);

  const unsubscribeFromFCMv1 = useCallback(async () => {
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
      console.log('FCM V1 unsubscription successful');
    } catch (error) {
      console.error('FCM V1 unsubscription failed:', error);
      setError('Failed to unsubscribe from FCM V1');
    }
  }, [fcmToken, session?.user?.id]);

  const sendFCMv1Notification = useCallback(async (notification: FCMV1Notification) => {
    if (!session?.user?.id && !notification.topic) {
      setError('User not logged in and no topic specified');
      return false;
    }

    try {
      const response = await fetch('/api/fcm/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          topic: notification.topic,
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/favicon.png',
          badge: notification.badge || '/icons/favicon.png',
          tag: notification.tag,
          image: notification.image,
          actions: notification.actions,
          data: {
            ...notification.data,
            apiVersion: 'v1',
            timestamp: new Date().toISOString()
          },
          actionUrl: notification.actionUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send FCM V1 notification');
      }

      const result = await response.json();
      console.log('FCM V1 notification sent:', result);
      return true;

    } catch (error) {
      console.error('Failed to send FCM V1 notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send FCM V1 notification');
      return false;
    }
  }, [session?.user?.id]);

  // Send notification to topic (API V1 feature)
  const sendToTopic = useCallback(async (topic: string, notification: Omit<FCMV1Notification, 'topic'>) => {
    return sendFCMv1Notification({
      ...notification,
      topic
    });
  }, [sendFCMv1Notification]);

  // Send notification with action buttons (API V1 feature)
  const sendWithActions = useCallback(async (notification: FCMV1Notification) => {
    const actions = [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ];

    return sendFCMv1Notification({
      ...notification,
      actions: notification.actions || actions
    });
  }, [sendFCMv1Notification]);

  return {
    isSupported,
    permission,
    fcmToken,
    isLoading,
    error,
    requestPermission,
    subscribeToFCM: subscribeToFCMv1,
    unsubscribeFromFCM: unsubscribeFromFCMv1,
    sendFCMNotification: sendFCMv1Notification,
    sendToTopic,
    sendWithActions
  };
}