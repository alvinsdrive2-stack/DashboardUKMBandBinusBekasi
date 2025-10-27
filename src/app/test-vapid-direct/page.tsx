'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code, Badge, HStack, Divider } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestVapidDirect() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (session) {
      addLog(`✅ Logged in as ${session.user.name}`);
      addLog(`🔍 Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
      addLog(`🌐 Protocol: ${window.location.protocol}`);
      addLog(`🔒 Secure Context: ${window.isSecureContext}`);
    }
  }, [session]);

  const testDirectVAPID = async () => {
    setIsTesting(true);
    try {
      addLog('🚀 Starting Direct VAPID Test...');

      // Test 1: Basic browser notification
      addLog('📋 Step 1: Testing basic notification...');
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        addLog(`📋 Permission result: ${permission}`);
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      const testNotification = new Notification('VAPID Test', {
        body: 'Testing direct VAPID subscription...',
        icon: '/icons/favicon.png'
      });
      setTimeout(() => testNotification.close(), 2000);
      addLog('✅ Basic notification works!');

      // Test 2: Direct service worker registration
      addLog('📋 Step 2: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw-direct.js');
      addLog(`✅ Service worker registered: ${registration.scope}`);

      // Test 3: Wait and ensure ready
      addLog('📋 Step 3: Waiting for service worker...');
      await navigator.serviceWorker.ready;
      addLog('✅ Service worker is ready!');

      // Test 4: Try multiple VAPID approaches
      const VAPID_KEYS = [
        {
          name: 'New Valid Key (2025)',
          key: 'BOw4uECLLAg3lm21OLwnl9r53fbf9v7TiN5hHakuul_pX36TmBsXh6-tram7FHbnajLlXyH4oMfqqzqMiZ1LhaU'
        },
        {
          name: 'Previous Key',
          key: 'BHrOcPd8j5aRb0I61s9C4nSOs-JxrdAf-Acgi9ZfyX6wvPUfvp0TPEtSFQ_5Ed2MFK2cjTpPfM8A0XVJqK3Rs4E'
        }
      ];

      let success = false;

      for (const vapidKey of VAPID_KEYS) {
        try {
          addLog(`📋 Step 4: Trying ${vapidKey.name}...`);

          // Clear any existing subscription
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            await existingSub.unsubscribe();
            addLog('🗑️ Cleared existing subscription');
          }

          // Try subscription
          const pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey.key)
          });

          addLog(`✅ ✅ SUCCESS with ${vapidKey.name}!`);

          // Save subscription
          const response = await fetch('/api/notifications/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: pushSubscription.toJSON()
            })
          });

          if (response.ok) {
            addLog(`✅ Subscription saved to server!`);
            setSubscription(pushSubscription);
            success = true;
            break;
          } else {
            addLog(`⚠️ Subscription created but failed to save to server`);
          }

        } catch (error) {
          addLog(`❌ ${vapidKey.name} failed: ${error.message}`);
          if (error.name === 'AbortError') {
            addLog(`🔍 This is a common VAPID issue - trying next key...`);
          }
        }
      }

      if (!success) {
        throw new Error('All VAPID keys failed');
      }

      // Test 5: Test push notification
      if (success && session?.user?.id) {
        addLog('📋 Step 5: Testing VAPID push...');

        const pushResponse = await fetch('/api/notifications/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ukm-band-push-2025-secret-key'
          },
          body: JSON.stringify({
            userId: session.user.id,
            title: '🎉 VAPID SUCCESS!',
            message: 'VAPID push notifications are working perfectly!',
            icon: '/icons/favicon.png',
            badge: '/icons/favicon.png',
            tag: 'vapid-success',
            data: {
              type: 'VAPID_SUCCESS',
              url: '/dashboard/member',
              timestamp: new Date().toISOString(),
              testKey: 'final'
            }
          })
        });

        const result = await pushResponse.json();
        addLog(`📊 Push result: ${result.message}`);
        addLog(`📊 Sent to ${result.sent} device(s)`);

        if (result.sent > 0) {
          addLog('🎉 VAPID push notification WORKING! 🚀');
        } else {
          addLog('⚠️ Push sent but no devices received it');
        }
      }

    } catch (error) {
      addLog(`❌ Direct VAPID test failed: ${error.message}`);
      addLog(`🔍 Error type: ${error.name}`);
      addLog(`🔍 This might be a browser or environment limitation`);

      // Fallback suggestion
      addLog('');
      addLog('💡 Fallback options:');
      addLog('   • Try in Chrome Incognito mode');
      addLog('   • Try different browser (Edge)');
      addLog('   • Check if localhost is in secure context');
      addLog('   • Local notifications work as alternative');
    }

    setIsTesting(false);
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
          <Heading size="2xl" mb={2}>🚀 Direct VAPID Test</Heading>
          <Text color="gray.600">Test multiple VAPID keys and direct approach</Text>
        </Box>

        {!session && (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please sign in to test VAPID notifications</Text>
          </Alert>
        )}

        {session && (
          <VStack spacing={4} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 Environment Status</Heading>
              <VStack spacing={2} align="start">
                <HStack>
                  <Text>Session:</Text>
                  <Badge colorScheme="green">✅ Active</Badge>
                </HStack>
                <HStack>
                  <Text>Protocol:</Text>
                  <Badge colorScheme={window.location.protocol === 'https:' ? 'green' : 'yellow'}>
                    {window.location.protocol}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Secure:</Text>
                  <Badge colorScheme={window.isSecureContext ? 'green' : 'red'}>
                    {window.isSecureContext ? '✅' : '❌'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Testing:</Text>
                  <Badge colorScheme={isTesting ? 'yellow' : 'gray'}>
                    {isTesting ? '🔄 Running' : '⏸️ Ready'}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            {/* Test Button */}
            <Button
              onClick={testDirectVAPID}
              colorScheme="blue"
              size="lg"
              isLoading={isTesting}
              loadingText="Testing VAPID..."
            >
              🚀 Start Direct VAPID Test
            </Button>

            {/* Subscription Info */}
            {subscription && (
              <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
                <Heading size="md" mb={3}>✅ VAPID Subscription Active</Heading>
                <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto" maxH="200px">
                  {JSON.stringify(subscription.toJSON(), null, 2)}
                </Code>
              </Box>
            )}

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Test Logs</Heading>
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
                  <Text color="gray.500">Click the test button above to start...</Text>
                ) : (
                  logs.map((log, index) => (
                    <Text key={index} mb={1}>{log}</Text>
                  ))
                )}
              </Box>
            </Box>

            {/* Info */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Heading size="md" mb={3}>ℹ️ What This Test Does:</Heading>
              <VStack spacing={2} align="start">
                <Text>• Tests 3 different VAPID key pairs</Text>
                <Text>• Clears existing subscriptions first</Text>
                <Text>• Direct service worker registration</Text>
                <Text>• Multiple fallback strategies</Text>
                <Text>• Detailed error logging</Text>
              </VStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}