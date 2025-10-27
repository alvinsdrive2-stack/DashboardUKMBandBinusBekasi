'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code, Badge, HStack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestVapidFinal() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [manifestInfo, setManifestInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (session) {
      addLog(`✅ Logged in as ${session.user.name}`);
      checkManifest();
    }
  }, [session]);

  const checkManifest = async () => {
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      setManifestInfo(manifest);
      addLog(`📋 Manifest loaded: ${manifest.name}`);
      addLog(`📋 GCM Sender ID: ${manifest.gcm_sender_id}`);
      addLog(`📋 Theme Color: ${manifest.theme_color}`);
      addLog(`📋 Display Mode: ${manifest.display}`);
    } catch (error) {
      addLog(`❌ Failed to load manifest: ${error.message}`);
    }
  };

  const testVapidSubscription = async () => {
    try {
      addLog('🚀 Starting VAPID subscription test...');

      // Step 1: Clear existing service workers
      addLog('🧹 Clearing existing service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        addLog(`🗑️ Unregistered: ${registration.scope}`);
      }

      // Step 2: Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Register new service worker
      addLog('🔄 Registering VAPID service worker...');
      const registration = await navigator.serviceWorker.register('/sw-simple.js', {
        scope: '/'
      });
      addLog(`✅ Service worker registered: ${registration.scope}`);

      // Step 4: Wait for service worker to be ready
      addLog('⏳ Waiting for service worker to be ready...');
      await navigator.serviceWorker.ready;
      addLog('✅ Service worker is ready');

      // Step 5: Clear any existing subscriptions
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        addLog('🗑️ Cleared existing subscription');
      }

      // Step 6: Create VAPID subscription
      addLog('📡 Creating VAPID subscription...');
      const VAPID_PUBLIC_KEY = 'BOw4uECLLAg3lm21OLwnl9r53fbf9v7TiN5hHakuul_pX36TmBsXh6-tram7FHbnajLlXyH4oMfqqzqMiZ1LhaU';

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      addLog('✅ VAPID subscription created successfully!');
      setSubscription(pushSubscription);

      // Step 7: Log subscription details
      const subJson = pushSubscription.toJSON();
      addLog(`📋 Endpoint: ${subJson.endpoint.substring(0, 100)}...`);
      addLog(`📋 Keys: p256dh present, auth present`);

      // Step 8: Save to server
      addLog('💾 Saving subscription to server...');
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson
        })
      });

      if (response.ok) {
        addLog('✅ Subscription saved to server!');
      } else {
        addLog(`❌ Failed to save subscription: ${response.status}`);
      }

    } catch (error) {
      addLog(`❌ VAPID subscription failed: ${error.message}`);
      addLog(`🔍 Error details: ${error.stack}`);
    }
  };

  const testVapidPush = async () => {
    if (!session?.user?.id) {
      addLog('❌ User not logged in');
      return;
    }

    if (!subscription) {
      addLog('❌ No VAPID subscription found');
      return;
    }

    try {
      addLog('📤 Testing VAPID push notification...');

      const response = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ukm-band-push-2025-secret-key'
        },
        body: JSON.stringify({
          userId: session.user.id,
          title: '🔔 VAPID Test Success!',
          message: 'VAPID push notifications are working! 🎉',
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: 'vapid-test',
          data: {
            type: 'VAPID_TEST',
            url: '/dashboard/member',
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      addLog(`📊 Server response: ${result.message}`);
      addLog(`📊 Sent to ${result.sent} device(s)`);

      if (result.sent > 0) {
        addLog('🎉 VAPID push notification successful!');
      }

    } catch (error) {
      addLog(`❌ VAPID push test failed: ${error.message}`);
    }
  };

  const clearAll = async () => {
    try {
      addLog('🧹 Clearing everything...');

      // Clear service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      addLog('🗑️ All service workers cleared');

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
        addLog('🗑️ All caches cleared');
      }

      // Reset state
      setSubscription(null);
      setLogs([]);

      // Refresh
      addLog('🔄 Refreshing page...');
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      addLog(`❌ Clear failed: ${error.message}`);
    }
  };

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
    <Box p={6} maxW="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🚀 VAPID Push Notification Test</Heading>
          <Text color="gray.600">Final VAPID push notification test with proper manifest</Text>
        </Box>

        {!session && (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please sign in to test VAPID push notifications</Text>
          </Alert>
        )}

        {session && (
          <VStack spacing={4} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 Status</Heading>
              <VStack spacing={2} align="start">
                <HStack>
                  <Text>Session:</Text>
                  <Badge colorScheme="green">✅ Logged In</Badge>
                </HStack>
                <HStack>
                  <Text>Manifest:</Text>
                  <Badge colorScheme={manifestInfo ? 'green' : 'red'}>
                    {manifestInfo ? '✅ Loaded' : '❌ Error'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Subscription:</Text>
                  <Badge colorScheme={subscription ? 'green' : 'red'}>
                    {subscription ? '✅ Active' : '❌ None'}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Test Buttons */}
            <VStack spacing={3}>
              <Button onClick={testVapidSubscription} colorScheme="blue" size="lg">
                📡 Create VAPID Subscription
              </Button>

              <Button
                onClick={testVapidPush}
                colorScheme="purple"
                size="lg"
                isDisabled={!subscription}
              >
                📤 Test VAPID Push
              </Button>

              <Button onClick={clearAll} colorScheme="red" size="sm">
                🧹 Clear & Reset
              </Button>
            </VStack>

            {/* Manifest Info */}
            {manifestInfo && (
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={3}>📋 Manifest Info</Heading>
                <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto">
                  {JSON.stringify(manifestInfo, null, 2)}
                </Code>
              </Box>
            )}

            {/* Subscription Info */}
            {subscription && (
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={3}>📡 Subscription Info</Heading>
                <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto">
                  {JSON.stringify(subscription.toJSON(), null, 2)}
                </Code>
              </Box>
            )}

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
                height="400px"
                overflowY="auto"
              >
                {logs.length === 0 ? (
                  <Text color="gray.500">Click buttons above to start testing...</Text>
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