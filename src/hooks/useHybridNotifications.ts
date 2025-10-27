import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationData {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actionUrl?: string;
}

export function useHybridNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidAvailable, setVapidAvailable] = useState(false);

  useEffect(() => {
    // Check browser support
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      setVapidAvailable('PushManager' in window);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendLocalNotification = useCallback((
    title: string,
    message: string,
    options: NotificationOptions = {}
  ) => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        tag: `notification-${Date.now()}`,
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return false;
    }
  }, [isSupported, permission]);

  const sendScheduledNotification = useCallback((
    delay: number,
    title: string,
    message: string,
    options: NotificationOptions = {}
  ) => {
    if (!isSupported || permission !== 'granted') return;

    setTimeout(() => {
      sendLocalNotification(title, message, options);
    }, delay);
  }, [isSupported, permission, sendLocalNotification]);

  const attemptVAPIDSubscription = useCallback(async () => {
    if (!vapidAvailable || !session?.user?.id) {
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-minimal.js');
      await navigator.serviceWorker.ready;

      // Clear existing subscription
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Try VAPID subscription
      const VAPID_PUBLIC_KEY = 'BJ6NDq5YKRpCVy9j05QOl2v3ZVm2XQVJOYdlK1hCN2zadOEU5TQhgNvjF18VOGHO5mlEodxhlROY5oZv5pCq110';

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save to server
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('✅ VAPID subscription saved');
        return pushSubscription;
      }

      return null;
    } catch (error) {
      console.log('🔍 VAPID failed (expected in some environments):', error.message);
      return null;
    }
  }, [vapidAvailable, session?.user?.id]);

  const sendNotification = useCallback(async (data: NotificationData) => {
    // Always try local notification first (guaranteed to work)
    const localSuccess = sendLocalNotification(data.title, data.message, {
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data
    });

    // Try VAPID if available
    if (vapidAvailable && session?.user?.id) {
      try {
        // Try to create VAPID subscription if not exists
        const subscription = await attemptVAPIDSubscription();

        if (subscription) {
          // Send push notification via server
          const response = await fetch('/api/notifications/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ukm-band-push-2025-secret-key'
            },
            body: JSON.stringify({
              userId: session.user.id,
              title: data.title,
              message: data.message,
              icon: data.icon || '/icons/favicon.png',
              badge: data.badge || '/icons/favicon.png',
              tag: data.tag,
              data: data.data
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`📊 Push notification sent to ${result.sent} device(s)`);
          }
        }
      } catch (error) {
        console.log('🔍 Push notification failed, using local only');
      }
    }

    return localSuccess;
  }, [sendLocalNotification, vapidAvailable, session?.user?.id, attemptVAPIDSubscription]);

  return {
    isSupported,
    permission,
    vapidAvailable,
    requestPermission,
    sendNotification,
    sendLocalNotification,
    sendScheduledNotification,
    attemptVAPIDSubscription
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}