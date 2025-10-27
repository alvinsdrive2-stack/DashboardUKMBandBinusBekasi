import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UniversalNotification {
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
  requireInteraction?: boolean;
  silent?: boolean;
  vibration?: number[];
}

export function useUniversalNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmAvailable, setFcmAvailable] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
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
      setFcmAvailable('PushManager' in navigator);

      addLog('🔔 Universal Notifications initialized');
      addLog(`📱 Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
      addLog(`🌐 Protocol: ${window.location.protocol}`);
      addLog(`🔒 Secure Context: ${window.isSecureContext}`);
    }
  }, [mounted]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 20)]);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      addLog(`📋 Permission result: ${result}`);
      return result === 'granted';
    } catch (error) {
      addLog(`❌ Permission error: ${error.message}`);
      return false;
    }
  }, [isSupported]);

  const sendLocalNotification = useCallback((
    title: string,
    body: string,
    options: NotificationOptions = {}
  ) => {
    if (!isSupported || permission !== 'granted') {
      addLog('❌ Local notification not supported or permission denied');
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        tag: `universal-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        vibration: [200, 100, 200],
        timestamp: Date.now(),
        ...options
      });

      addLog(`✅ Local notification sent: ${title}`);

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        addLog(`🔕 Local notification closed: ${title}`);
      }, 5000);

      return true;
    } catch (error) {
      addLog(`❌ Local notification failed: ${error.message}`);
      return false;
    }
  }, [isSupported, permission, addLog]);

  const sendScheduledNotification = useCallback((
    delay: number,
    title: string,
    body: string,
    options: NotificationOptions = {}
  ) => {
    if (!isSupported || permission !== 'granted') return;

    addLog(`⏰ Scheduling notification in ${delay}ms: ${title}`);

    setTimeout(() => {
      sendLocalNotification(title, body, options);
    }, delay);
  }, [isSupported, permission, sendLocalNotification]);

  const attemptFCM = useCallback(async () => {
    if (!session?.user?.id || !fcmAvailable) {
      addLog('❌ FCM not available (no user or no PushManager support)');
      return null;
    }

    if (permission !== 'granted') {
      addLog('❌ FCM requires notification permission');
      return null;
    }

    try {
      addLog('🚀 Attempting FCM subscription...');

      // Dynamic import Firebase
      const { getFCMToken } = await import('@/lib/firebase');
      const token = await getFCMToken();

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Save to server
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

      addLog(`✅ FCM subscription successful! Token: ${token.substring(0, 30)}...`);
      return token;

    } catch (error) {
      addLog(`❌ FCM failed: ${error.message}`);
      addLog('🔍 This is expected in some environments - falling back to local notifications');
      return null;
    }
  }, [session?.user?.id, fcmAvailable, permission, addLog]);

  const sendUniversalNotification = useCallback(async (notification: UniversalNotification) => {
    addLog(`📤 Sending universal notification: ${notification.title}`);

    // Always try local notification first (guaranteed to work)
    const localSuccess = sendLocalNotification(
      notification.title,
      notification.body,
      {
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
        image: notification.image,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        vibration: notification.vibration
      }
    );

    // Try FCM Admin (new implementation) if available
    let fcmSuccess = false;
    if (fcmAvailable && session?.user?.id) {
      try {
        addLog('📤 Trying FCM Admin API...');
        const response = await fetch('/api/fcm/admin/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icons/favicon.png',
            badge: notification.badge || '/icons/favicon.png',
            tag: notification.tag,
            image: notification.image,
            data: {
              ...notification.data,
              type: 'UNIVERSAL_NOTIFICATION',
              timestamp: new Date().toISOString()
            },
            actionUrl: notification.actionUrl
          })
        });

        if (response.ok) {
          const result = await response.json();
          addLog(`📊 FCM Admin result: ${result.message}`);
          addLog(`📊 FCM Admin sent: ${result.sent}, failed: ${result.failed}`);
          if (result.setup) {
            addLog(`🔧 FCM Admin setup: ${JSON.stringify(result.setup)}`);
          }
          fcmSuccess = result.sent > 0;
        } else {
          const error = await response.json();
          addLog(`❌ FCM Admin HTTP error: ${error.error || error.details || 'Unknown error'}`);
        }
      } catch (error) {
        addLog(`❌ FCM Admin send failed: ${error.message}`);
      }
    }

    // Try FCM API V1 if FCM available
    if (!fcmSuccess && fcmAvailable && session?.user?.id) {
      try {
        const response = await fetch('/api/fcm/v1/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icons/favicon.png',
            badge: notification.badge || '/icons/favicon.png',
            tag: notification.tag,
            image: notification.image,
            actions: notification.actions,
            data: {
              ...notification.data,
              type: 'UNIVERSAL_NOTIFICATION_V1',
              timestamp: new Date().toISOString()
            },
            actionUrl: notification.actionUrl
          })
        });

        if (response.ok) {
          const result = await response.json();
          addLog(`📊 FCM V1 result: ${result.message}`);
          fcmSuccess = result.sent > 0;
        }
      } catch (error) {
        addLog(`❌ FCM V1 send failed: ${error.message}`);
      }
    }

    addLog(`📊 Results: Local=${localSuccess ? '✅' : '❌'}, FCM=${fcmSuccess ? '✅' : '❌'}`);

    return localSuccess || fcmSuccess;
  }, [session?.user?.id, fcmAvailable, sendLocalNotification, addLog]);

  const sendToTopic = useCallback(async (topic: string, notification: Omit<UniversalNotification, 'userId'>) => {
    addLog(`📢 Sending to topic "${topic}": ${notification.title}`);

    try {
      const response = await fetch('/api/fcm/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/favicon.png',
          badge: notification.badge || '/icons/favicon.png',
          tag: notification.tag,
          image: notification.image,
          data: {
            ...notification.data,
            type: 'TOPIC_NOTIFICATION',
            timestamp: new Date().toISOString()
          },
          actionUrl: notification.actionUrl
        })
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Topic notification sent: ${result.message}`);
        return true;
      }
    } catch (error) {
      addLog(`❌ Topic notification failed: ${error.message}`);
    }

    return false;
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isSupported,
    permission,
    fcmAvailable,
    logs,
    mounted,
    requestPermission,
    sendLocalNotification,
    sendScheduledNotification,
    attemptFCM,
    sendUniversalNotification,
    sendToTopic,
    clearLogs
  };
}