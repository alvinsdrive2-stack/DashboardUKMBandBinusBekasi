'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotification() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    permission: 'default',
    isLoading: false,
    error: null,
  });

  // VAPID public key from environment variables
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BPUnG2xzifRUUCVHZgegyaMk5KT4adqPDUzsTzPK5G6oMNAI4SB9X6k69FQeHsTpzFvxfrVd1jY6yc-sgefR5ew';

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to request notification permission',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator &&
                         'PushManager' in window &&
                         'Notification' in window;

      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'default',
      }));

      if (isSupported) {
        // Register the push service worker
        registerPushServiceWorker();
        // Check existing subscription
        checkExistingSubscription();

        // Auto-request permission on first load if not yet requested
        if (Notification.permission === 'default') {
          console.log('🔔 Requesting notification permission on first load...');
          const granted = await requestPermission();

          // Auto-subscribe if permission granted and not already subscribed
          if (granted && !state.isSubscribed) {
            console.log('🔔 Permission granted, auto-subscribing to push notifications...');
            setTimeout(() => subscribe(), 1000); // Delay 1 second to ensure everything is ready
          }
        } else if (Notification.permission === 'granted' && !state.isSubscribed) {
          // Auto-subscribe if permission already granted but not subscribed
          console.log('🔔 Permission already granted, auto-subscribing to push notifications...');
          setTimeout(() => subscribe(), 1000);
        }
      }
    };

    if (status === 'authenticated') {
      checkSupport();
    }
  }, [status, requestPermission, state.isSubscribed]);

  const registerPushServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('✅ Push Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registering push service worker:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to register push service worker',
      }));
      return null;
    }
  };

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription: subscription.toJSON() as PushSubscription,
        }));
        console.log('✅ Found existing subscription:', subscription);
      }
    } catch (error) {
      console.error('❌ Error checking existing subscription:', error);
    }
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || status !== 'authenticated') {
      setState(prev => ({
        ...prev,
        error: 'Push notifications not supported or not authenticated',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission first
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      setState(prev => ({ ...prev, permission }));

      // Get service worker registration
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch (error) {
        console.log('🔄 Service worker not ready, registering...');
        registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;
        registration = await navigator.serviceWorker.ready;
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('✅ Already subscribed, using existing subscription');
        await sendSubscriptionToServer(existingSubscription.toJSON() as PushSubscription);
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          subscription: existingSubscription.toJSON() as PushSubscription,
          isLoading: false,
        }));
        return true;
      }

      // Subscribe to push notifications
      console.log('🔔 Subscribing to push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('✅ Push subscription created:', subscription);

      // Send subscription to server
      await sendSubscriptionToServer(subscription.toJSON() as PushSubscription);

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription: subscription.toJSON() as PushSubscription,
        isLoading: false,
      }));

      console.log('✅ Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }));
      return false;
    }
  }, [state.isSupported, status]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');

        // Remove subscription from server
        await removeSubscriptionFromServer(state.subscription);

        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null,
          isLoading: false,
        }));
      }
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }));
      return false;
    }
  }, [state.subscription]);

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      const result = await response.json();
      console.log('✅ Subscription sent to server:', result);
    } catch (error) {
      console.error('❌ Error sending subscription to server:', error);
      throw error;
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('✅ Subscription removed from server');
    } catch (error) {
      console.error('❌ Error removing subscription from server:', error);
      throw error;
    }
  };

  const testPushNotification = async () => {
    if (!state.isSubscribed || !session?.user?.id) {
      setState(prev => ({
        ...prev,
        error: 'Must be subscribed and authenticated to test notifications',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          title: '🔔 Test Push Notification',
          message: 'Ini adalah notifikasi push test dari UKM Band Bekasi!',
          icon: '/icons/favicon.png',
          data: {
            type: 'TEST_NOTIFICATION',
            url: '/dashboard/member',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const result = await response.json();
      console.log('✅ Test notification sent:', result);

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      }));
    }
  };

  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        ...options,
      });
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    testPushNotification,
    requestPermission,
    showLocalNotification,
  };
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}