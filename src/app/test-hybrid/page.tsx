'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Code, Alert, AlertIcon } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestHybrid() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  useEffect(() => {
    if (session) {
      addLog(`✅ Logged in: ${session.user.name}`);
      addLog(`🌐 Protocol: ${window.location.protocol}`);
      addLog(`🔒 Secure: ${window.isSecureContext}`);
      checkNotificationSupport();
    }
  }, [session]);

  const checkNotificationSupport = () => {
    if ('Notification' in window) {
      addLog('📱 Browser supports notifications');
      setNotificationsEnabled(true);
    } else {
      addLog('❌ Browser does not support notifications');
    }

    if ('serviceWorker' in navigator) {
      addLog('🔧 Service Worker supported');
    } else {
      addLog('❌ Service Worker not supported');
    }

    if ('PushManager' in window) {
      addLog('📡 Push API supported');
    } else {
      addLog('❌ Push API not supported');
    }
  };

  const testLocalNotifications = async () => {
    try {
      addLog('🔔 Testing LOCAL notifications...');

      // Request permission
      const permission = await Notification.requestPermission();
      addLog(`📋 Permission: ${permission}`);

      if (permission === 'granted') {
        // Test local notification
        const notification = new Notification('🎉 LOCAL Test Success!', {
          body: 'Local notifications work perfectly!',
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: 'local-test',
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });

        addLog('✅ Local notification sent!');

        setTimeout(() => {
          notification.close();
          addLog('🔕 Local notification closed');
        }, 3000);

        // Test notification scheduling
        setTimeout(() => {
          const scheduledNotification = new Notification('⏰ Scheduled Notification', {
            body: 'This is a scheduled local notification!',
            icon: '/icons/favicon.png',
            tag: 'scheduled'
          });

          setTimeout(() => scheduledNotification.close(), 3000);
        }, 5000);

        addLog('⏰ Scheduled notification in 5 seconds...');
      }
    } catch (error) {
      addLog(`❌ Local notification error: ${error.message}`);
    }
  };

  const testVAPIDAlternative = async () => {
    try {
      addLog('🚀 Testing VAPID Alternative Method...');

      // Step 1: Register service worker
      const registration = await navigator.serviceWorker.register('/sw-minimal.js');
      addLog(`✅ SW registered: ${registration.scope}`);

      // Step 2: Wait for ready
      await navigator.serviceWorker.ready;
      addLog('✅ SW ready!');

      // Step 3: Try different VAPID approaches
      const vapidKeys = [
        'BJ6NDq5YKRpCVy9j05QOl2v3ZVm2XQVJOYdlK1hCN2zadOEU5TQhgNvjF18VOGHO5mlEodxhlROY5oZv5pCq110', // Production
        'BOw4uECLLAg3lm21OLwnl9r53fbf9v7TiN5hHakuul_pX36TmBsXh6-tram7FHbnajLlXyH4oMfqqzqMiZ1LhaU', // Previous
        'BDMV9QTsJUiztwC45zaIVjuo37ZlFTCFH5q7Lmr8S3N504nHjMKnywicY_RtlU58V0Bc2XIJSLgVhW6sXRTDJtI', // Web-push generated
      ];

      for (const [index, key] of vapidKeys.entries()) {
        try {
          addLog(`🔑 Trying VAPID key ${index + 1}...`);

          // Clear existing
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            await existingSub.unsubscribe();
          }

          // Try subscription
          const pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key)
          });

          addLog('🎉 VAPID SUCCESS! Key ' + (index + 1) + ' worked!');
          setSubscription(pushSubscription);

          // Save to server
          const response = await fetch('/api/notifications/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: pushSubscription.toJSON()
            })
          });

          if (response.ok) {
            addLog('✅ Subscription saved to server!');

            // Test push notification
            if (session?.user?.id) {
              const pushResponse = await fetch('/api/notifications/push/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ukm-band-push-2025-secret-key'
                },
                body: JSON.stringify({
                  userId: session.user.id,
                  title: '🎉 VAPID WORKS!',
                  message: 'VAPID push notifications are working!',
                  icon: '/icons/favicon.png',
                  tag: 'vapid-success'
                })
              });

              const result = await pushResponse.json();
              addLog(`📊 Push result: ${result.message}`);
            }
          }

          return; // Success, exit loop
        } catch (error) {
          addLog(`❌ Key ${index + 1} failed: ${error.message}`);
          if (index === vapidKeys.length - 1) {
            addLog('🔥 All VAPID keys failed - using fallback');
          }
        }
      }

    } catch (error) {
      addLog(`❌ VAPID test failed: ${error.message}`);
    }
  };

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

  return (
    <Box p={6} maxW="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔔 Hybrid Notification Test</Heading>
          <Text color="gray.600">Test both local and VAPID notifications</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login first</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Notification Support */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 Browser Support</Heading>
              <VStack spacing={2} align="start">
                <Text>🔔 Notifications: {notificationsEnabled ? '✅' : '❌'}</Text>
                <Text>🔧 Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</Text>
                <Text>📡 Push API: {'PushManager' in window ? '✅' : '❌'}</Text>
              </VStack>
            </Box>

            {/* Test Buttons */}
            <VStack spacing={3}>
              <Button
                onClick={testLocalNotifications}
                colorScheme="green"
                size="lg"
                isDisabled={!notificationsEnabled}
              >
                🔔 Test Local Notifications
              </Button>

              <Button
                onClick={testVAPIDAlternative}
                colorScheme="blue"
                size="lg"
                isDisabled={!('PushManager' in window)}
              >
                🚀 Test VAPID (3 Keys)
              </Button>
            </VStack>

            {/* Success Messages */}
            {subscription && (
              <Alert status="success">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text>✅ VAPID subscription active!</Text>
                  <Text fontSize="sm">Endpoint: {subscription.toJSON().endpoint.substring(0, 50)}...</Text>
                </VStack>
              </Alert>
            )}

            {/* Instructions */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Heading size="md" mb={3}>💡 Instructions:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>Local Notifications</strong>: Always work, no server needed</Text>
                <Text>• <strong>VAPID Push</strong>: Requires push service, may fail in some environments</Text>
                <Text>• <strong>Hybrid Approach</strong>: Use VAPID when available, fallback to local</Text>
                <Text>• <strong>Production</strong>: VAPID works better in production environment</Text>
              </VStack>
            </Box>

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Logs</Heading>
              <Box
                bg="gray.900"
                color="green.400"
                p={3}
                borderRadius="md"
                fontFamily="monospace"
                fontSize="xs"
                height="300px"
                overflowY="auto"
              >
                {logs.length === 0 ? (
                  <Text color="gray.500">Click test buttons above...</Text>
                ) : (
                  logs.map((log, index) => (
                    <Text key={index} mb={1}>{log}</Text>
                  ))
                )}
              </Box>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}