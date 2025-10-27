'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code } from '@chakra-ui/react';

export default function TestSimplePush() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 30));
  };

  useEffect(() => {
    if (status === 'authenticated') {
      addLog(`✅ Logged in as ${session.user.name}`);
    } else if (status === 'unauthenticated') {
      addLog('❌ Not authenticated');
    }

    // Check basic support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    addLog(`🔔 Push supported: ${supported}`);

    if (supported) {
      addLog(`📱 Permission: ${Notification.permission}`);
    }
  }, [status, session]);

  const testBasicNotification = async () => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      addLog(`📋 Permission result: ${permission}`);

      if (permission !== 'granted') {
        addLog('❌ Permission denied');
        return;
      }
    }

    try {
      const notification = new Notification('Basic Test', {
        body: 'This is a basic notification test!',
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png'
      });

      addLog('✅ Basic notification sent!');
      setTimeout(() => notification.close(), 3000);
    } catch (error) {
      addLog(`❌ Basic notification failed: ${error}`);
    }
  };

  const registerServiceWorker = async () => {
    try {
      addLog('🔄 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      addLog(`✅ Service worker registered: ${registration.scope}`);

      await navigator.serviceWorker.ready;
      addLog('✅ Service worker ready');

      return registration;
    } catch (error) {
      addLog(`❌ Service worker registration failed: ${error}`);
      return null;
    }
  };

  const subscribeSimple = async () => {
    try {
      addLog('📡 Starting subscription process...');

      // Step 1: Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        addLog('❌ Failed to register service worker');
        return;
      }

      // Step 2: Check existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        addLog('✅ Already subscribed!');
        setSubscription(existingSubscription);
        return;
      }

      // Step 3: Create new subscription
      const VAPID_PUBLIC_KEY = 'BHrOcPd8j5aRb0I61s9C4nSOs-JxrdAf-Acgi9ZfyX6wvPUfvp0TPEtSFQ_5Ed2MFK2cjTpPfM8A0XVJqK3Rs4E';

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      addLog('✅ Push subscription created!');
      setSubscription(pushSubscription);

      // Step 4: Send to server
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON()
        })
      });

      if (response.ok) {
        addLog('✅ Subscription saved to server!');
      } else {
        addLog(`❌ Failed to save subscription: ${response.status}`);
      }

    } catch (error) {
      addLog(`❌ Subscription failed: ${error.message}`);
    }
  };

  const testPushFromServer = async () => {
    if (!session?.user?.id) {
      addLog('❌ User not logged in');
      return;
    }

    try {
      addLog('📤 Sending test push from server...');

      const response = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ukm-band-push-2025-secret-key'
        },
        body: JSON.stringify({
          userId: session.user.id,
          title: '🔔 Test Push',
          message: 'This is a test push notification from server!',
          icon: '/icons/favicon.png',
          data: {
            type: 'TEST',
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      addLog(`📊 Server response: ${result.message}`);
      addLog(`📊 Sent to ${result.sent} device(s)`);

    } catch (error) {
      addLog(`❌ Server test failed: ${error.message}`);
    }
  };

  // Helper function
  function urlBase64ToUint8Array(base64String: string) {
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

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🧪 Simple Push Test</Heading>
          <Text color="gray.600">Step-by-step push notification testing</Text>
        </Box>

        {status !== 'authenticated' ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please sign in to test push notifications</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Step 1: Basic Notification */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Step 1: Basic Browser Notification</Heading>
              <Button onClick={testBasicNotification} colorScheme="blue" mb={2}>
                🔔 Test Basic Notification
              </Button>
              <Text fontSize="sm" color="gray.600">
                This tests if browser notifications work at all
              </Text>
            </Box>

            {/* Step 2: Service Worker */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Step 2: Service Worker Registration</Heading>
              <Button onClick={registerServiceWorker} colorScheme="green" mb={2}>
                🔄 Register Service Worker
              </Button>
              <Text fontSize="sm" color="gray.600">
                Register the push service worker
              </Text>
            </Box>

            {/* Step 3: Push Subscription */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Step 3: Push Subscription</Heading>
              <Button onClick={subscribeSimple} colorScheme="orange" mb={2}>
                📡 Subscribe to Push Notifications
              </Button>
              <Text fontSize="sm" color="gray.600">
                Create a push subscription and save it to server
              </Text>
            </Box>

            {/* Step 4: Test Push */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Step 4: Test Push from Server</Heading>
              <Button onClick={testPushFromServer} colorScheme="purple" mb={2}>
                📤 Test Push Notification
              </Button>
              <Text fontSize="sm" color="gray.600">
                Send a push notification from the server
              </Text>
            </Box>

            {/* Subscription Info */}
            {subscription && (
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={3}>Subscription Info</Heading>
                <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto" maxW="100%">
                  {JSON.stringify(subscription.toJSON(), null, 2)}
                </Code>
              </Box>
            )}

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
              <Heading size="md" mb={3}>Logs</Heading>
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
                  <Text color="gray.500">No logs yet...</Text>
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