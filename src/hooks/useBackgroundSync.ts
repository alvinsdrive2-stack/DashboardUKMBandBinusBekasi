import { useEffect, useCallback } from 'react';

export const useBackgroundSync = () => {
  const registerBackgroundSync = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('BackgroundSyncManager' in window)) {
      console.log('⚠️ Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Register background sync for notifications
      if ('sync' in registration) {
        await registration.sync.register('background-notification-sync');
        console.log('✅ Background sync registered for notifications');
      }

      // Register periodic sync (if supported)
      if ('periodicSync' in registration) {
        try {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName
          });

          if (status.state === 'granted') {
            await registration.periodicSync.register('notification-check', {
              minInterval: 60 * 60 * 1000 // 1 hour
            });
            console.log('✅ Periodic sync registered for notifications');
          }
        } catch (error) {
          console.log('⚠️ Periodic sync not available:', error);
        }
      }

    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  const subscribeToPushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('⚠️ Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      // Send subscription to server
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          }
        })
      });

      if (response.ok) {
        console.log('✅ Push subscription registered');
        return subscription;
      }
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
    }

    return null;
  }, []);

  useEffect(() => {
    // Auto-register on mount
    registerBackgroundSync();
  }, [registerBackgroundSync]);

  return {
    registerBackgroundSync,
    requestNotificationPermission,
    subscribeToPushNotifications,
    isSupported: 'serviceWorker' in navigator && 'BackgroundSyncManager' in window
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}