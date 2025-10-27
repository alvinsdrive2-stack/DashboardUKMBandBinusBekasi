'use client';

import { useEffect, useState } from 'react';

export function useBrowserNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const checkNotificationSupport = () => {
      const supported = 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkNotificationSupport();
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported || typeof window === 'undefined') {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || typeof window === 'undefined') {
      return null;
    }

    try {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification
  };
}